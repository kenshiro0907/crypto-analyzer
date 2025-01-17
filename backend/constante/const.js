require("dotenv").config();

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

module.exports = {
  accessTokenSecret,
  refreshTokenSecret,
};
