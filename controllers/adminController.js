const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Admin = require("../models/admin");
const nodemailer = require("nodemailer"); // For sending email

// Function to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "3h" });
};

// Admin login function
const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username });
  if (admin && (await admin.matchPassword(password))) {
    res.json({
      _id: admin._id,
      username: admin.username,
      token: generateToken(admin._id),
    });
  } else {
    res.status(401).json({ message: "Invalid username or password" });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    admin.resetPasswordToken = resetToken;
    admin.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // Token valid for 30 minutes

    await admin.save();

    // Send email with reset link (using nodemailer)
    // In forgotPassword function in the admin controller:
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`; // This URL points to the frontend reset page
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "zafardeveloper8@gmail.com",
        pass: "nhgt tjjs pevp cufw",
      },
    });

    await transporter.sendMail({
      from: "zafardeveloper8@gmail.com",
      to: admin.email,
      subject: "Password Reset",
      text: `Please use the following link to reset your password: ${resetUrl}`,
    });

    res.status(200).json({ message: "Reset email sent" });
  } catch (error) {
    res.status(500).json({ message: "Error sending reset email", error });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  try {
    const admin = await Admin.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpire: { $gt: Date.now() }, // Ensure the token has not expired
    });

    if (!admin) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    admin.password = password;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpire = undefined;

    await admin.save();
    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error resetting password", error });
  }
};

module.exports = { loginAdmin, forgotPassword, resetPassword };
