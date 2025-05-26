const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    telegram_id: Number,
    username: String,
    first_name: String,
    last_name: String,
    is_bot: Boolean,
    language_code: String,
    chat_id: Number,
    password: String,
    walletAddress: String,
    privateKey: String,
    walletCreated: Boolean,
    approved: Boolean,
    state: String,
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = { User };

/*

const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const userSchema = new mongoose.Schema({
  telegram_id: { type: Number, required: true, unique: true },
  username: { type: String },
  first_name: { type: String },
  last_name: { type: String },
  is_bot: { type: Boolean, default: false },
  language_code: { type: String },
  chat_id: { type: Number },

  isConfirmed: { type: Boolean, default: false },
  confirmationRequest: Date,
  loginRequired: { type: Boolean, default: true },
  state: { type: String },
  tempPassword: { type: String },

  wallet: {
    publicKey: { type: String },
    privateKey: { type: String },
  },
});

const User = mongoose.model("User", userSchema);

module.exports = { User };

*/

/*
changes
*/
