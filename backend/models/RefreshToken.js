const mongoose = require("mongoose");

const RefreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Référence à l'utilisateur
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now, // Date de création automatique
  },
  expiredAt: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("RefreshToken", RefreshTokenSchema);
