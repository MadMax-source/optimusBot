require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const connectDB = require("./config/db");
const startHandler = require("./bot/start");

connectDB();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const app = express();

startHandler(bot);

require("./handlers/index")(bot);

app.use(express.json());

app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});
