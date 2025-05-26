const { User } = require("../models/userModel");
const cron = require("node-cron");

let pendingApprovals = new Map(); // In-memory store for simplicity

module.exports = {
  handleSubmitResponse: async (bot, chatId, userId) => {
    const user = await User.findOne({ telegram_id: userId });

    if (!user || !user.walletCreated || !user.password) {
      return bot.sendMessage(
        chatId,
        "❌ Please complete registration steps before submitting."
      );
    }

    // Notify admin
    const adminChatId = process.env.ADMIN_CHAT_ID;
    const message = `🚨 New User Request:\n\n👤 *Name:* ${
      user.username || user.first_name
    }\n🔗 *Wallet:* \`${user.walletAddress}\`\n🆔 *User ID:* ${
      user.telegram_id
    }`;

    const sentMessage = await bot.sendMessage(adminChatId, message, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "✅ Approve",
              callback_data: `approve_${user.telegram_id}`,
            },
            {
              text: "❌ Reject",
              callback_data: `reject_${user.telegram_id}`,
            },
          ],
        ],
      },
    });

    // Track approval for auto-rejection
    pendingApprovals.set(user.telegram_id, {
      message_id: sentMessage.message_id,
      chat_id: adminChatId,
    });

    // Schedule auto-reject in 10 minutes
    cron.schedule("* * * * *", async function autoReject() {
      const request = pendingApprovals.get(user.telegram_id);
      if (!request) return;

      const createdAt = await User.findOne({ telegram_id: user.telegram_id });
      const ageMinutes = (Date.now() - new Date(createdAt.updatedAt)) / 60000;

      if (ageMinutes >= 10) {
        await User.findOneAndUpdate(
          { telegram_id: user.telegram_id },
          { approved: false }
        );

        await bot.sendMessage(
          user.chat_id,
          "⏰ Your request was auto-rejected after 10 minutes."
        );
        pendingApprovals.delete(user.telegram_id);
        this.stop(); // Stop the cron job
      }
    });

    await bot.sendMessage(
      chatId,
      "✅ Your response has been submitted to the admin."
    );
  },

  handleAdminAction: async (bot, query) => {
    const action = query.data.split("_")[0];
    const targetUserId = parseInt(query.data.split("_")[1]);

    const user = await User.findOne({ telegram_id: targetUserId });
    if (!user)
      return bot.answerCallbackQuery(query.id, { text: "User not found." });

    const update = { approved: action === "approve" };
    await User.findOneAndUpdate({ telegram_id: targetUserId }, update);
    pendingApprovals.delete(targetUserId);

    const statusText = action === "approve" ? "approved" : "rejected";
    await bot.sendMessage(
      user.chat_id,
      `🎉 Your access has been *${statusText}*!`,
      { parse_mode: "Markdown" }
    );

    return bot.answerCallbackQuery(query.id, {
      text: `User has been ${statusText}.`,
    });
  },
};
