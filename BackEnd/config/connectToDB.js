import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const DB_URI = process.env.MONGO_URI || `mongodb://127.0.0.1:27017/${process.env.DB_NAME}`;

const connectToDB = async () => {
  try {
    await mongoose.connect(DB_URI);
    console.log("✅ DB Connected successfully");
  } catch (err) {
    console.error("❌ Error connecting to DB:", err.message);
    process.exit(1); // Exit if DB connection fails
  }
};

// Graceful shutdown for SIGINT (Ctrl+C) and SIGTERM (server shutdown)
const handleExit = async () => {
  await mongoose.connection.close();
  console.log("⚠️ DB connection closed gracefully");
  process.exit(0);
};

process.on("SIGINT", handleExit);
process.on("SIGTERM", handleExit);

export default connectToDB;
