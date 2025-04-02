import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    UserName:{type:String,default:null},
    date: { type: String,default:null},
    checkInTime: { type: String },
    checkOutTime: { type: String },
    status: { 
      type: String, 
      enum: ["Check-in", "Check-out", "Break","Active","Present","Day Off"],
    },
    category: { 
      type: String, 
      enum: ["WFH", "WFO", "Day Off"],  
    }
  });
  

export default mongoose.model("Attendance", AttendanceSchema);
