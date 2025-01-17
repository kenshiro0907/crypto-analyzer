const express = require("express");
const {
  register,
  login,
  getWallet,
  updateWallet,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/authenticate");
const limit = require("../middleware/limit");
const router = express.Router();

router.post("/register", register);
router.post("/login", limit, login);
router.get("/profile/get_wallet", getWallet);
router.put("/profile/update_wallet", authenticate, updateWallet);
router.post("/refresh", refresh);
router.delete("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/verify-email/:token", verifyEmail);

module.exports = router;
