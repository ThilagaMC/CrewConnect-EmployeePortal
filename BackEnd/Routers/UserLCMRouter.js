import express from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/userModel.js";

const UserLCMRouter = express.Router();

// Helper function for API responses
const respond = (res, status, message, data = null) => {
  const response = { status, message };
  if (data) response.data = data;
  return res.status(status).json(response);
};

// Top rated users
UserLCMRouter.get("/TopRated", async (req, res) => {
  try {
    const topRatedUsers = await User.find({ rating: { $gte: 4 } }).select(
      "-password"
    );
    respond(res, 200, "Top rated users retrieved successfully", topRatedUsers);
  } catch (err) {
    console.error("Error fetching top rated users:", err);
    respond(res, 500, "Server error while fetching top rated users");
  }
});

// Create a user
UserLCMRouter.post("/", async (req, res) => {
  console.log("I got Request", req.body);

  try {
    const {
      username,
      email,
      password, // Optional password
      image,
      dob,
      yearOfJoin,
      status,
      currentPackage,
      currentProject,
      rating,
      motherName,
      fatherName,
      panNumber,
      lastAppraisalDate,
      department,
      position,
      phone,
      totalLeave,
      availableLeave,
      completedLeave,
      role,
      checkedIn,
    } = req.body;

    // Validate required fields
    if (!username || !email) {
      return respond(res, 400, "Username and email are required");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return respond(res, 409, "User with this email already exists");
    }

    // Hash password only if provided
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword, // Null if no password is given
      image,
      dob,
      yearOfJoin,
      status,
      currentPackage,
      currentProject,
      rating,
      motherName,
      fatherName,
      panNumber,
      lastAppraisalDate,
      department,
      position,
      phone,
      totalLeave,
      availableLeave,
      completedLeave,
      role,
      checkedIn,
    });

    console.log(newUser);

    const savedUser = await newUser.save();
    savedUser.password = undefined; // Remove password before sending response

    respond(res, 201, "User successfully created", savedUser);
  } catch (err) {
    console.error("Error creating user:", err);
    if (err.name === "ValidationError") {
      return respond(res, 400, "Validation error", { errors: err.errors });
    }
    respond(res, 500, "Error in creating user");
  }
});


// Get all users
UserLCMRouter.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    respond(res, 200, "Users retrieved successfully", users);
  } catch (error) {
    console.error("Error fetching users:", error);
    respond(res, 500, "Error fetching users");
  }
});

// Get user by ID
UserLCMRouter.get('/email/:id', async (req, res) => {
  console.log("I got request Line 123");
  
const {id}=req.params;
  try {
    const employee = await User.findById(id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Convert MongoDB document to a plain JavaScript object
    const employeeData = employee.toObject();
    
    // Optionally format dates or other fields if needed
    employeeData.createdAt = employeeData.createdAt.toISOString();
    employeeData.updatedAt = employeeData.updatedAt.toISOString();
    
    console.log(employeeData);
    
    res.json(employeeData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Update user profile
UserLCMRouter.put("/email/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log(updateData);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return respond(res, 400, "Invalid user ID format");
    }

    if (!Object.keys(updateData).length) {
      return respond(res, 400, "No data provided for update");
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
      select: "-password",
    });

    if (!updatedUser) {
      return respond(res, 404, "User not found");
    }    

    respond(res, 200, "User updated successfully", updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return respond(res, 400, "Validation error", { errors });
    }

    respond(res, 500, "Internal server error");
  }
});

// Change password
UserLCMRouter.put("/:id/password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return respond(res, 400, "Invalid user ID format");
    }

    if (!currentPassword || !newPassword) {
      return respond(
        res,
        400,
        "Current password and new password are required"
      );
    }

    const user = await User.findById(id).select("+password");
    if (!user) {
      return respond(res, 404, "User not found");
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return respond(res, 401, "Incorrect current password");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    respond(res, 200, "Password changed successfully");
  } catch (error) {
    console.error("Error changing password:", error);
    respond(res, 500, "Server error while changing password");
  }
});

// Search users
UserLCMRouter.get("/search", async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 3) {
      return respond(res, 400, "Search query must be at least 3 characters");
    }

    // Simple search implementation - adjust based on your needs
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    }).select("-password");

    respond(res, 200, "Search results", users);
  } catch (error) {
    console.error("Error searching users:", error);
    respond(res, 500, "Server error while searching");
  }
});

// Delete user
UserLCMRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return respond(res, 400, "Invalid user ID format");
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return respond(res, 404, "User not found");
    }

    respond(res, 200, "User deleted successfully");
  } catch (err) {
    console.error("Error deleting user:", err);
    respond(res, 500, "Error deleting user");
  }
});

export default UserLCMRouter;
