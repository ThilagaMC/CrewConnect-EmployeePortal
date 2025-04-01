import express from "express";
import Mood from "../models/MoodTracker.js";

const MoodTrackerRouter = express.Router();

// Helper Functions
const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const getEndOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
};

const getDateRange = (range) => {
  const now = new Date();
  const start = new Date(now);
  
  switch (range) {
    case "week":
      start.setDate(now.getDate() - 6); // Last 7 days inclusive
      break;
    case "month":
      start.setDate(1); // First day of current month
      break;
    case "year":
      start.setMonth(0, 1); // January 1st of current year
      break;
    default:
      start.setDate(now.getDate() - 6); // Default to week
  }
  
  return { 
    start: getStartOfDay(start),
    end: getEndOfDay(now)
  };
};

// @desc    Get today's mood for user
// @route   GET /api/moods/today/:userId
MoodTrackerRouter.get("/", async (req, res) => {
    try {
      const { filter } = req.query;
      let query = {};
      
      if (filter) {
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        switch(filter) {
          case 'today':
            query.date = { $gte: startOfDay };
            break;
          case 'week':
            query.date = { $gte: startOfWeek };
            break;
          case 'month':
            query.date = { $gte: startOfMonth };
            break;
        }
      }
  
      const moods = await Mood.find(query).sort({ date: -1 });
      res.json({
        success: true,
        data: moods || null,
      });
    } catch (error) {
      res.status(404).json({ message: "Data Not Found" });
    }
  });
  
MoodTrackerRouter.get("/today/:userId", async (req, res) => {
  try {
    const todayStart = getStartOfDay();
    const todayEnd = getEndOfDay();
    
    const mood = await Mood.findOne({
      userId: req.params.userId,
      date: { 
        $gte: todayStart,
        $lte: todayEnd
      }
    }).lean();
    
    res.json({
      success: true,
      data: mood || null
    });
  } catch (error) {
    console.error("Error fetching today's mood:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// @desc    Get mood history for user
// @route   GET /api/moods/:userId
MoodTrackerRouter.get("/:userId", async (req, res) => {
  try {
    const { range = "week" } = req.query;
    const { start, end } = getDateRange(range);
    
    const moods = await Mood.find({
      userId: req.params.userId,
      date: { 
        $gte: start,
        $lte: end
      }
    }).sort({ date: -1 });

    res.json({
      success: true,
      data: moods,
      startDate: start,
      endDate: end
    });
  } catch (error) {
    console.error("Error fetching mood history:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// @desc    Create or update mood for user
// @route   POST /api/moods/:userId
MoodTrackerRouter.post("/:userId", async (req, res) => {
  try {
    const { mood, intensity, note, username } = req.body;
    
    if (!mood || !intensity || !username) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    const now = new Date();
    const todayStart = getStartOfDay();
    const todayEnd = getEndOfDay();
    
    const existingMood = await Mood.findOneAndUpdate(
      {
        userId: req.params.userId,
        date: { 
          $gte: todayStart,
          $lte: todayEnd
        }
      }, 
      {
        $set: {
          mood,
          intensity: parseInt(intensity),
          note: note || "",
          username,
          date: now
        }
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: existingMood
    });
  } catch (error) {
    console.error("Error saving mood:", error);
    res.status(400).json({ 
      success: false,
      message: "Bad request",
      error: error.message 
    });
  }
});

// @desc    Delete today's mood for user
// @route   DELETE /api/moods/today/:userId
MoodTrackerRouter.delete("/today/:userId", async (req, res) => {
  try {
    const todayStart = getStartOfDay();
    const todayEnd = getEndOfDay();   
    
    const deleted = await Mood.findOneAndDelete({
      userId: req.params.userId,
      date: { 
        $gte: todayStart,
        $lte: todayEnd
      }
    });

    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        message: "No mood entry found for today" 
      });
    }

    res.json({ 
      success: true,
      message: "Mood entry deleted",
      data: deleted
    });
  } catch (error) {
    console.error("Error deleting mood:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

export default MoodTrackerRouter;