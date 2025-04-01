import dotenv from "dotenv";
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import userModel from "../models/userModel.js";
dotenv.config();

const signUpRouter = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key";
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const CLIENT_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;

// ✅ Configure Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

signUpRouter.post("/", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // ✅ Validate required fields
    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // ✅ Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // ✅ Validate role type (optional)
    const validRoles = ["admin", "user"];
    if (!validRoles.includes(role.toLowerCase())) {
      return res.status(400).json({ message: "Invalid role type" });
    }

    // ✅ Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // ✅ Generate email verification token
    const verificationToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1d" });

    // ✅ Create new user instance
    const newUser = new userModel({
      username,
      email,
      password: hashedPassword,
      role,
      isVerified: false, // Email verification pending
      verificationToken,
    });

    // ✅ Save user to the database
    const savedUser = await newUser.save();
    console.log("✅ Saved User in DB:", savedUser);

    // ✅ Send verification email
    const mailOptions = {
      from: `"Team Support" <${EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email",
      html: `
        <h3>Hello ${username},</h3>
        <p>Thank you for signing up. Please verify your email by clicking the link below:</p>
        <p><a href="${CLIENT_URL}/verify?token=${verificationToken}" target="_blank">Verify Email</a></p>
        <p>If you didn’t request this, please ignore this email.</p>
        <p>Best Regards,</p>
        <p>Team</p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`📧 Verification email sent to ${email}`);
    } catch (emailError) {
      console.error("❌ Error sending verification email:", emailError.message);
      // Don't return a failure response, just log the error
    }

    // ✅ Send response
    res.status(201).json({
      message: "User registered successfully. Please verify your email before logging in.",
    });

  } catch (error) {
    console.error("❌ Error during registration:", error.message);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

export default signUpRouter;
