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
} = require("../controllers/authController");
const { authenticate } = require("../middleware/authenticate");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile/get_wallet", getWallet);
router.put("/profile/update_wallet", authenticate, updateWallet);
router.post("/refresh", refresh);
router.delete("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;
