import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors"; 

// Import Routes
import AttendanceRoutes from "./Routers/attendanceRoutes.js";
import signUpRouter from "./Routers/SignUpPage.js";
import LoginPageRouter from "./Routers/loginPage.js";
import verifyRouter from "./Routers/verify.js";
import ProjectRouter from "./Routers/ProjectRouter.js";
import LeaveRequest from "./Routers/LeaveRequest.js";
import userProfileRouter from "./Routers/userProfile.js";
import UserLCMRouter from "./Routers/UserLCMRouter.js";
import ToDoRouter from "./Routers/ToDoRouter.js";
import MoodTrackerRouter from "./Routers/MoodTrackerRouters.js";
import passwordResetRouter from "./Routers/forgetPassword.js";

// ✅ Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const DB_NAME = process.env.DB_NAME || "loginApp";

// ✅ MongoDB Connection (Using .env for security)
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env file!");
  process.exit(1);
}

console.log(`🚀 Connecting to MongoDB: ${DB_NAME}`);
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log(`✅ MongoDB Connected to ${DB_NAME}`))
.catch((err) => {
  console.error("❌ MongoDB Connection Error:", err.message);
  process.exit(1); // Stop server if connection fails
});

// ✅ Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cors({
  origin: "http://localhost:5173", // Frontend URL
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// ✅ Routes
app.use("/register", signUpRouter);
app.use("/login", LoginPageRouter);
app.use("/verify", verifyRouter);
app.use("/users", userProfileRouter); 
app.use("/leave-requests", LeaveRequest);
app.use("/employees", UserLCMRouter);
app.use("/api/attendance", AttendanceRoutes);
app.use("/projects", ProjectRouter);
app.use("/todos", ToDoRouter);
app.use("/moods", MoodTrackerRouter);
app.use("/password-reset", passwordResetRouter);

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
