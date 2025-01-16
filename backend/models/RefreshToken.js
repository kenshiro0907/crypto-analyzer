const mongoose = require("mongoose");

const RefreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  expiredAt: { type: Date, required: true },
});

module.exports = mongoose.model("RefreshToken", RefreshTokenSchema);
