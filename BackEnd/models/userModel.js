import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema({
  leaveType: { 
    type: String, 
    required: true,
    enum: ["Casual", "Sick", "Earned", "Maternity", "Paternity", "Bereavement", "Other"]
  },
  fromDate: { type: String, required: true },
  toDate: { type: String, required: true },
  reason: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["Pending", "Approved", "Rejected"], 
    default: "Pending" 
  },
  requestedDays: { type: Number, required: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rejectionReason: { type: String }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  dob: { type: String, default: null },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: { type: String, default: null },
  totalLeave: { type: Number, default: 25 },
  availableLeave: { type: Number, default: 25 },
  completedLeave: { type: Number, default: 0 },
  role: {
    type: String,
    required: true,
    enum: ["Admin", "User", "Manager", "HR"],
  },
  isVerified: { type: Boolean, default: false },
  department: { 
    type: String, 
    enum: ["Engineering", "HR", "Marketing", "Sales", "Finance"], 
  },
  position: { type: String, default: null },
  verificationToken: { type: String, default: null },
  lastCheckIn: { type: String, default: null },
  lastCheckOut: { type: String, default: null },
  checkedIn: { type: Boolean, default: false },
  motherName: { type: String, trim: true, default: null },
  fatherName: { type: String, trim: true, default: null },
  panNumber: { type: String, uppercase: true, default: null },
  yearOfJoin: { type: Number, default: null },
  currentPackage: { type: Number, default: null },
  currentProject: { type: String, trim: true, default: null },
  rating: {
    type: Number,
    min: [1, "Rating must be at least 1"],
    max: [5, "Rating cannot exceed 5"],
    default: null
  },
  lastAppraisalDate: { type: String, default: null },
  phone: { type: String },
  status: {
    type: String,
    enum: ['Active', 'Relieved', 'On Notice Period'],
    default: 'Active'
  },
  image: {
    type: String,
    default: "default.jpg",
  },
  imgURL: {
    type: String,
    default: "/uploads/default.jpg"
  },
  LOP: { type: Number, default: 0 },
  leaveRequests: [leaveRequestSchema],
  isActive: { type: Boolean, default: true }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true } 
});

// Add text index for search functionality
userSchema.index({
  username: 'text',
  email: 'text',
  department: 'text',
  position: 'text'
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.username;
});

// Method to request leave
userSchema.methods.requestLeave = async function(leaveData) {
  const requestedDays = this.countLeaveDaysExcludingWeekends(leaveData.fromDate, leaveData.toDate);
  
  if (this.availableLeave < requestedDays) {
    throw new Error('Insufficient leave balance');
  }

  const leaveRequest = {
    ...leaveData,
    requestedDays,
    status: 'Pending'
  };

  this.leaveRequests.push(leaveRequest);
  await this.save();
  return this.leaveRequests[this.leaveRequests.length - 1];
};

// Helper method to count leave days
userSchema.methods.countLeaveDaysExcludingWeekends = function(fromDate, toDate) {
  let start = new Date(fromDate);
  let end = new Date(toDate);
  let leaveDays = 0;

  while (start <= end) {
    const dayOfWeek = start.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      leaveDays++;
    }
    start.setDate(start.getDate() + 1);
  }

  return leaveDays;
};

const User = mongoose.model("User", userSchema);
export default User;