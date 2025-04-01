import express from "express";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const verifyRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key";

// Route for email verification
verifyRouter.get("/", async (req, res) => {
  const token = req.query.token;

  if (!token) {
    return res.status(400).json({
      message: "Token is required. Please check your email for the verification link.",
      success: false,
    });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find the user by email
    const user = await userModel.findOne({ email: decoded.email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token.",
        success: false,
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: "Your email is already verified.",
        success: false,
      });
    }

    // Mark the user as verified and remove the verification token
    await userModel.updateOne({ email: decoded.email }, { 
      $set: { isVerified: true }, 
      $unset: { verificationToken: 1 } 
    });

    // Respond with success message
    res.status(200).json({
      message: "Your email has been verified. You can now log in.",
      success: true,
    });
  } catch (error) {
    console.error("Verification error:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(400).json({
        message: "The verification link has expired. Please sign up again.",
        success: false,
      });
    }

    res.status(400).json({
      message: "Invalid or expired token.",
      success: false,
    });
  }
});

export default verifyRouter;
