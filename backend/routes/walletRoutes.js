const express = require("express");
const { getDataAddress } = require("../controllers/transactionController");
const router = express.Router();

router.get(`/get_data/:address`, getDataAddress);

module.exports = router;
