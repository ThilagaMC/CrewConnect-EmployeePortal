import mongoose from "mongoose";

const LeaveSchema = new mongoose.Schema({
  userID: { type: String, required: true },
  name: { type: String, required: true },
  TotalLeave: { type: Number, default:25 },
  AvailableLeave: { type: Number,default:25},
  LOP: { type: Number,default:0},
  leaveType: { type: String, required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
});

const LeaveModel = mongoose.model("Leave", LeaveSchema);
export default LeaveModel;
