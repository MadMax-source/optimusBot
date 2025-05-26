const { User } = require("../models/userModel");
const walletHandlers = require("./connectWallet");
const passwordHandlers = require("./password");

module.exports = (bot) => {
  bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;

    if (data === "set_password") {
      return passwordHandlers.handleSetPassword(bot, chatId, userId);
    }

    if (data === "confirm_password") {
      return passwordHandlers.handleConfirmPassword(bot, chatId, userId);
    }

    if (data === "connect_wallet") {
      return walletHandlers.handleConnectWallet(bot, chatId); // ✅ ADD THIS
    }

    if (data === "create_wallet") {
      return walletHandlers.handleCreateWallet(bot, chatId, userId);
    }

    if (data === "import_wallet") {
      return walletHandlers.handleImportWallet(bot, chatId, userId);
    }
    if (data === "submit_response") {
      const user = await User.findOne({ telegram_id: userId });
      if (
        !user ||
        !user.walletCreated ||
        !user.password ||
        !user.passwordConfirm
      ) {
        return bot.sendMessage(
          chatId,
          "❌ Please complete all steps before submitting."
        );
      }

      user.status = "pending";
      await user.save();

      // Notify admin (replace with your admin's Telegram user ID)
      const adminId = YOUR_ADMIN_TELEGRAM_ID;
      bot.sendMessage(
        adminId,
        `📝 *New User Request*\n\n👤 Name: @${
          user.username || user.first_name
        }\n💼 Wallet: \`${user.walletAddress}\`\n\nAccept or Reject?`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "✅ Accept",
                  callback_data: `accept_${user.telegram_id}`,
                },
                {
                  text: "❌ Reject",
                  callback_data: `reject_${user.telegram_id}`,
                },
              ],
            ],
          },
        }
      );

      bot.sendMessage(
        chatId,
        "📨 Request submitted to admin. Await approval within 10 minutes."
      );

      // Set auto-rejection in 10 minutes
      const cron = require("node-cron");
      cron.schedule(
        `*/10 * * * *`,
        async () => {
          const pendingUser = await User.findOne({ telegram_id: userId });
          if (pendingUser && pendingUser.status === "pending") {
            pendingUser.status = "rejected";
            await pendingUser.save();
            bot.sendMessage(
              user.chat_id,
              "⏰ Your registration was rejected due to no admin response."
            );
          }
        },
        { scheduled: true, timezone: "UTC" }
      );
    }

    if (data.startsWith("accept_") || data.startsWith("reject_")) {
      const targetUserId = data.split("_")[1];
      const user = await User.findOne({ telegram_id: targetUserId });
      if (!user) return bot.sendMessage(chatId, "❌ User not found.");

      const status = data.startsWith("accept_") ? "accepted" : "rejected";
      user.status = status;
      await user.save();

      bot.sendMessage(
        user.chat_id,
        status === "accepted"
          ? "🎉 Your registration has been *approved*! You now have access to /mainpage."
          : "❌ Your registration was *rejected* by the admin.",
        { parse_mode: "Markdown" }
      );

      bot.sendMessage(chatId, `✅ User ${status}.`);
    }
  });

  bot.on("message", async (msg) => {
    const user = await User.findOne({ telegram_id: msg.from.id });
    if (!user || !user.state) return;

    if (user.state === "awaiting_password") {
      return passwordHandlers.handlePasswordInput(bot, msg, user);
    }

    if (user.state === "awaiting_password_confirm") {
      return passwordHandlers.handlePasswordConfirmInput(bot, msg, user);
    }

    if (user.state === "awaiting_private_key") {
      return walletHandlers.handlePrivateKeyInput(bot, msg, user);
    }
  });
};
