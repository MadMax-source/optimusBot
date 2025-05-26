bot.onText(/\/admin/, async (msg) => {
  const adminId = YOUR_ADMIN_TELEGRAM_ID;
  if (msg.from.id !== adminId)
    return bot.sendMessage(msg.chat.id, "Access denied.");

  const pendingUsers = await User.find({ status: "pending" });

  if (pendingUsers.length === 0) {
    return bot.sendMessage(adminId, "✅ No pending user approvals.");
  }

  for (const user of pendingUsers) {
    bot.sendMessage(
      adminId,
      `👤 @${user.username || user.first_name}\n💼 Wallet: \`${
        user.walletAddress
      }\`\n🕒 Requested: ${user.requestedAt.toLocaleString()}`,
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
  }
});
