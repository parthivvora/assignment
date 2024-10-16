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
router.get("/verify-email", verifyEmail);
router.post("/send-verification-email", sendVerificationEmail);
router.post("/send-reset-password-email", sendResetPasswordEmail);
router.post("/login", login);
router.put("/reset-password", resetPassword);

module.exports = router;
