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
