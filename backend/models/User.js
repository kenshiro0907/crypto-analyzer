const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  /*emailVerificationToken: String,
  emailVerificationExpires: Date,*/
  wallet: {
    type: String,
    required: false,
  },
});

module.exports = mongoose.model("User", UserSchema);
