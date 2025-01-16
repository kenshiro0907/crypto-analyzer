const express = require("express");
const {
  register,
  login,
  getWallet,
  updateWallet,
  refresh,
  logout,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/authenticate");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile/get_wallet", getWallet);
router.put("/profile/update_wallet", authenticate, updateWallet);
router.post("/refresh", refresh);
router.delete("/logout", logout);

module.exports = router;
