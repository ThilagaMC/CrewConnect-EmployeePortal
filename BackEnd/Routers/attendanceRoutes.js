import express from "express";
import moment from "moment";
import Attendance from "../models/Attendance.js";

const AttendanceRoutes = express.Router();

// 📌 Get attendance records of all user
AttendanceRoutes.get("/", async (req, res) => {
  try {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0"); // Get day and ensure two digits
    const month = String(today.getMonth() + 1).padStart(2, "0"); // Get month (0-based)
    const year = today.getFullYear();

    const formattedDate = `${day}-${month}-${year}`;

    const records = await Attendance.find({date:formattedDate});

    res.json(records);
  } catch (error) {
    console.error("Error retrieving attendance records:", error);
    res.status(500).json({ message: "Error retrieving attendance records." });
  }
});

// 📌 Get attendance records for a user
AttendanceRoutes.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const records = await Attendance.find({ userId }).sort({ date: -1 });
    res.json(records);
  } catch (error) {
    console.error("Error retrieving attendance records:", error);
    res.status(500).json({ message: "Error retrieving attendance records." });
  }
});

// 📌 Update attendance category (Present, WFH, WFO, Day Off) - Only Once Per Day
AttendanceRoutes.post("/update-category", async (req, res) => {
  try {
    const { userId, category,userName } = req.body;
    
    if (!userId || !category || !userName) {
      return res
        .status(400)
        .json({ message: "User ID and category are required." });
    }

    const currentDate = moment().format("DD-MM-YYYY");
    let record = await Attendance.findOne({ userId, date: currentDate });

    if (record?.category) {
      
      return res
        .status(400)
        .json({ message: "Category can be updated only once per day!" });
    }

    if (!record) {
      record = new Attendance({userName,userId, date: currentDate });
    }

    record.category = category;
    await record.save();

    res.json({ message: "Category updated successfully", record });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ message: "Error updating category." });
  }
});

// 📌 Update attendance status (Check-in, Check-out, Break)
AttendanceRoutes.post("/update-status", async (req, res) => {
  try {
    const { userId, status, userName } = req.body;
    
    if (!userId || !status) {
      return res.status(400).json({ message: "User ID and status are required." });
    }

    const currentDate = moment().format("DD-MM-YYYY");
    const currentTime = moment().format("HH:mm");
    const previousDate = moment().subtract(1, "day").format("DD-MM-YYYY");

    // Update previous day's record if needed
    if (status === "Check-in") {
      // Only update previous day when checking in for the new day
      const previousRecord = await Attendance.findOne({
        userId,
        date: previousDate,
        status: { $in: ["Check-in", "Check-out", "Break"] }
      });

      if (previousRecord) {
        previousRecord.status = "Present";
        await previousRecord.save();
      }
    }

    // Find or create today's record
    let record = await Attendance.findOne({ userId, date: currentDate });

    if (!record) {
      record = new Attendance({ 
        userId, 
        date: currentDate,
        UserName: userName // Set userName when creating new record
      });
    }

    // Handle different status updates
    switch (status) {
      case "Check-in":
        if (record.checkInTime) {
          return res.status(400).json({ message: "Already checked in today!" });
        }
        record.checkInTime = currentTime;
        record.status = "Check-in";
        break;
        
      case "Check-out":
        if (!record.checkInTime) {
          return res.status(400).json({ message: "Cannot check out without checking in first!" });
        }
        if (record.checkOutTime) {
          return res.status(400).json({ message: "Already checked out today!" });
        }
        record.checkOutTime = currentTime;
        record.status = "Check-out";
        break;
        
      case "Break":
        record.status = record.status === "Break" ? "Active" : "Break";
        break;
        
      default:
        return res.status(400).json({ message: "Invalid status provided." });
    }

    // Update userName if provided (optional)
    if (userName) {
      record.UserName = userName;
    }
    
    await record.save();
    res.json({ message: "Status updated successfully", record });
    
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Error updating status." });
  }
});

export default AttendanceRoutes;
