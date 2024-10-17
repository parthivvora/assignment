const express = require("express");
const {
  verifyEmail,
  register,
  sendVerificationEmail,
  sendResetPasswordEmail,
  login,
  resetPassword,
} = require("../controllers/userController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/send-verification-email", sendVerificationEmail);
router.get("/verify-email", verifyEmail);
router.post("/send-reset-password-email", sendResetPasswordEmail);
router.put("/reset-password", resetPassword);

module.exports = router;
