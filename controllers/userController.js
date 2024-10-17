const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const nodemailer = require("nodemailer");
const {
  createUserSchema,
  loginUserSchema,
  emailValidation,
} = require("../validators/userValidator");

exports.register = async (req, res) => {
  try {
    const { name, email, password, loginType } = req.body;

    const { error } = createUserSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const existingUser = await User.findOne({ email });
    if (existingUser?.isVerified) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      isVerified: loginType == "googleLogin" ? true : false,
    });

    await newUser.save();

    jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    return res
      .status(201)
      .json({ message: "User created! Please verify your email." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.sendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const { error } = emailValidation.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const user = await User.findOne({ email });
    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    if (!user.isVerified) {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
      await sendVerificationEmailService(email, verificationUrl, "createUser");
      return res.status(200).json({ message: "Email sent successfully" });
    } else if (user.isVerified) {
      return res.status(401).json({ message: "User verified already" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Error logging in", error });
  }
};

const sendVerificationEmailService = async (email, accessUrl, emailType) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    let subject = "";
    let message = "";

    if (emailType === "createUser") {
      subject = "Verify your email";
      message = `<p>Please <a href="${accessUrl}">click here</a> to verify your email address.</p>`;
    } else if (emailType === "updatePassword") {
      subject = "Reset your password";
      message = `<p>Please <a href="${accessUrl}">click here</a> to reset your password.</p>            `;
    }

    const mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: subject,
      html: message,
    };
    await transporter.sendMail(mailOptions);

    return "Email sent";
  } catch (error) {
    console.error("Error sending email", error);
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email } = decoded;

    const user = await User.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "Email verified successfully!" });
  } catch (error) {
    return res.status(500).json({ message: "Error verifying email", error });
  }
};

exports.login = async (req, res) => {
  try {
    const { error } = loginUserSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    } else if (!user.isVerified) {
      return res.status(401).json({ message: "User is not verified" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Login successful!",
      token,
      user: { name: user.name, email: user.email },
    });
  } catch (error) {
    return res.status(500).json({ message: "Error logging in", error });
  }
};

exports.sendResetPasswordEmail = async (req, res) => {
  try {
    const { error } = emailValidation.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const resetPassUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await sendVerificationEmailService(email, resetPassUrl, "updatePassword");

    return res
      .status(200)
      .json({ message: "Password reset email sent please check your inbox" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error sending verification email", error });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    const { newPassword } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { email } = decoded;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    return res.status(500).json({ message: "Error updating password", error });
  }
};
