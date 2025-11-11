require("dotenv").config();

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleCallbackURL = process.env.GOOGLE_CALLBACK_URL;
const frontendSuccessUrl = process.env.FRONTEND_SUCCESS_URL;

module.exports = {
  googleClientId,
  googleClientSecret,
  googleCallbackURL,
  frontendSuccessUrl,
};