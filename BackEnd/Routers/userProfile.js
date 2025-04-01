import express from "express";
import userModel from "../models/userModel.js"; // Ensure this is your correct Mongoose model

const userProfileRouter = express.Router();

// Get user details by ID
userProfileRouter.get("/:userID", async (req, res) => {
  try {
    const {userId} = req.params.userID;
    const user = await userModel.findById(userId, "-password"); // Exclude password field


    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
    
  } catch (error) {
    console.error("Error fetching user details:", error.message);
    res.status(500).json({ error: "Server error" });    
  }
});

export default userProfileRouter;
