import express from "express";
import User from "../models/userModel.js";
import cors from "cors";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const passwordResetRouter = express.Router();
passwordResetRouter.use(cors());

const JWT_SECRET = process.env.JWT_SECRET;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // For local testing only
  },
});

// Request password reset
passwordResetRouter.post("/request-reset", async (req, res) => {
  console.log("Password reset request received for:", req.body.email);
  const { email } = req.body;

  if (!email) {
    console.log("No email provided");
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log(
        "Email not found in database (but returning success for security)"
      );
      return res.status(200).json({
        success: true,
        message: "If this email exists, a reset link has been sent",
      });
    }

    const resetToken = jwt.sign(
      {
        email,
        userId: user._id,
        purpose: "password_reset",
      },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 900000; // 15 minutes
    await user.save();
    console.log("Reset token saved for user:", user.email);

    const resetLink = `${FRONTEND_URL}/password-reset/verify?token=${encodeURIComponent(
      resetToken
    )}`;

    const mailOptions = {
      from: `"Password Reset" <${EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #333;">Hello ${user.username},</h2>
          <p>We received a request to reset your password. Click the link below to proceed:</p>
          <p style="margin: 20px 0;">
            <a href="${resetLink}" 
               style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
              Reset Password
            </a>
          </p>
          <p>This link will expire in 15 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p style="margin-top: 30px; font-size: 0.8em; color: #666;">
            Can't click the button? Copy and paste this link into your browser:<br>
            ${resetLink}
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Reset email sent to:", email);

    res.status(200).json({
      success: true,
      message: "Password reset email sent if the email exists in our system",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing your request",
      error: error.message,
    });
  }
});

// Verify reset token
passwordResetRouter.post("/verify-token", async (req, res) => {
  const { token } = req.body;
  console.log("Token verification request received");
  try {
    const decodedToken = decodeURIComponent(token);
    const decoded = jwt.verify(decodedToken, JWT_SECRET);
    // First try to find user by both email and token
    let user = await User.findOne({
      email: decoded.email,
      resetToken: decodedToken,
    });

    // If not found, try finding just by email
    if (!user) {
      user = await User.findOne({ email: decoded.email });

      // If user exists but token doesn't match, verify if the new token is valid
      if (user && user.resetToken) {
        try {
          jwt.verify(user.resetToken, JWT_SECRET);
          // If this succeeds, the stored token is also valid but different
          return res.status(400).json({
            success: false,
            message: "Invalid token (new reset link may have been generated)",
          });
        } catch (verifyError) {
          // Stored token is invalid, so we can proceed with the new one
          user.resetToken = decodedToken;
          user.resetTokenExpiry = decoded.exp * 1000; // Convert to milliseconds
          await user.save();
        }
      }
    }
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    // Check token expiry
    if (user.resetTokenExpiry && user.resetTokenExpiry < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Expired token",
      });
    }

    res.status(200).json({
      success: true,
      message: "Token is valid",
      email: decoded.email,
    });
  } catch (error) {
    console.error("Token verification error:", error);

    let message = "Invalid token";
    if (error instanceof jwt.TokenExpiredError) {
      message = "Token has expired";
    } else if (error instanceof jwt.JsonWebTokenError) {
      message = "Invalid token";
    }

    res.status(400).json({
      success: false,
      message,
      error: error.message,
    });
  }
});

// Reset password
passwordResetRouter.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  console.log("Password reset request received");

  try {
    const decodedToken = decodeURIComponent(token);
    const decoded = jwt.verify(decodedToken, JWT_SECRET);

    // Find user by email first
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify either the stored token matches or the decoded token is valid
    if (user.resetToken && user.resetToken !== decodedToken) {
      try {
        jwt.verify(user.resetToken, JWT_SECRET);
        return res.status(400).json({
          success: false,
          message: "Invalid token (new reset link may have been generated)",
        });
      } catch (verifyError) {
        // Stored token is invalid, proceed with the new one
      }
    }

    // Check token expiry
    if (user.resetTokenExpiry && user.resetTokenExpiry < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Expired token",
      });
    }

    // Reset password logic...
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Password reset error:", error);

    let message = "Invalid token";
    if (error instanceof jwt.TokenExpiredError) {
      message = "Token has expired";
    } else if (error instanceof jwt.JsonWebTokenError) {
      message = "Invalid token";
    }

    res.status(400).json({
      success: false,
      message,
      error: error.message,
    });
  }
});

export default passwordResetRouter;
