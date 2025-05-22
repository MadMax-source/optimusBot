const { User } = require("../models/userModel");

const bcrypt = require("bcrypt");

module.exports = {
  handleSetPassword: async (bot, chatId, userId) => {
    await User.findOneAndUpdate(
      { telegram_id: userId },
      { state: "awaiting_password" }
    );
    return bot.sendMessage(
      chatId,
      "🔐 Please enter your new password.\n(Min 6 chars, 1 uppercase, 1 lowercase, 1 number)"
    );
  },

  handleConfirmPassword: async (bot, chatId, userId) => {
    const user = await User.findOne({ telegram_id: userId });
    if (!user || !user.tempPassword) {
      return bot.sendMessage(chatId, "❌ You need to set a password first.");
    }
    await User.findOneAndUpdate(
      { telegram_id: userId },
      { state: "awaiting_password_confirm" }
    );
    return bot.sendMessage(
      chatId,
      "✅ Now confirm your password by typing it again:"
    );
  },

  handlePasswordInput: async (bot, msg, user) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    const isValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(text);
    if (!isValid) {
      return bot.sendMessage(
        chatId,
        "❌ Password not strong enough. Try again."
      );
    }

    await User.findOneAndUpdate(
      { telegram_id: user.telegram_id },
      {
        tempPassword: text,
        state: null,
      }
    );

    return bot.sendMessage(
      chatId,
      "✅ Password saved temporarily. Now click 'Confirm Password' to verify it.",
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔐 Confirm Password",
                callback_data: "confirm_password",
              },
            ],
          ],
        },
      }
    );
  },

  handlePasswordConfirmInput: async (bot, msg, user) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === user.tempPassword) {
      const hashed = await bcrypt.hash(text, 10);
      await User.findOneAndUpdate(
        { telegram_id: user.telegram_id },
        {
          passwordHash: hashed,
          tempPassword: null,
          state: null,
        }
      );
      return bot.sendMessage(
        chatId,
        "✅ Password confirmed and saved successfully!"
      );
    } else {
      return bot.sendMessage(
        chatId,
        "❌ Passwords do not match. Please start again."
      );
    }
  },
};
