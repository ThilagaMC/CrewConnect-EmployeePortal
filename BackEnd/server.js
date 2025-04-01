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

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const DB_NAME = process.env.DB_NAME || "loginApp";

// Configure allowed origins
const allowedOrigins = [
  'http://localhost:5173', // Local development
  'https://crewconnect-employeeportal.netlify.app', // Production frontend
  // Add other domains as needed
];

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
  credentials: true,
  maxAge: 600,
  exposedHeaders: ["*", "Authorization"]
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// MongoDB Connection
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
  process.exit(1);
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// Routes
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;