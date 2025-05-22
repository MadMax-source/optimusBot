const { User } = require("../models/userModel");
const passwordHandlers = require("./password");

module.exports = (bot) => {
  // Handle callback buttons
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

    // Other callback options (wallet, submit, etc.) can go here
  });

  // Handle text input for passwords
  bot.on("message", async (msg) => {
    const user = await User.findOne({ telegram_id: msg.from.id });
    if (!user || !user.state) return;

    if (user.state === "awaiting_password") {
      return passwordHandlers.handlePasswordInput(bot, msg, user);
    }

    if (user.state === "awaiting_password_confirm") {
      return passwordHandlers.handlePasswordConfirmInput(bot, msg, user);
    }
  });
};
