import express, { Router } from "express";
import userModel from "../models/userModel.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import mongoose from "mongoose";
import jwt from 'jsonwebtoken';

dotenv.config();
const LeaveRequest = express.Router();

const countLeaveDaysExcludingWeekends = (fromDate, toDate) => {
  let start = new Date(fromDate);
  let end = new Date(toDate);
  let leaveDays = 0;

  while (start <= end) {
    let dayOfWeek = start.getDay(); // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      leaveDays++; // Count only weekdays (Monday-Friday)
    }
    start.setDate(start.getDate() + 1); // Move to the next day
  }

  return leaveDays;
};

// Email configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, text, html = null) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

// Create Leave Request
LeaveRequest.post("/", async (req, res) => {
  try {
    const { userID, leaveType, fromDate, toDate, reason } = req.body;
    
    const employee = await userModel.findById(userID);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Calculate leave days (implement your countLeaveDaysExcludingWeekends function)
    const requestedDays = countLeaveDaysExcludingWeekends(fromDate, toDate);

    let completedLeave = 0;
    let LOP = 0;

    if (requestedDays > employee.availableLeave) {
      completedLeave = employee.availableLeave;
      LOP = requestedDays - employee.availableLeave;
    } else {
      completedLeave = requestedDays;
      LOP = 0;
    }

    employee.availableLeave -= completedLeave;
    employee.LOP += LOP;

    const newLeaveRequest = {
      leaveType,
      fromDate,
      toDate,
      reason,
      status: "Pending",
      requestedDays,
      completedLeave,
      LOP,
      createdAt: new Date()
    };

    if (!employee.leaveRequests) employee.leaveRequests = [];
    employee.leaveRequests.push(newLeaveRequest);
    
    await employee.save();

    // Send email to employee
    await sendEmail(
      employee.email,
      "Leave Request Submitted",
      `Your leave request from ${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()} has been submitted.`
    );

    // Generate secure token
    const token = jwt.sign(
      { employeeId: employee._id, requestIndex: employee.leaveRequests.length - 1 },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create admin approval links
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const approveLink = `${frontendUrl}/leave/action?employeeId=${employee._id}&requestIndex=${employee.leaveRequests.length - 1}&status=Approved&token=${token}`;
    const rejectLink = `${frontendUrl}/leave/action?employeeId=${employee._id}&requestIndex=${employee.leaveRequests.length - 1}&status=Rejected&token=${token}`;

    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Leave Request Approval</h2>
        <p><strong>Employee:</strong> ${employee.username}</p>
        <p><strong>Dates:</strong> ${new Date(fromDate).toLocaleDateString()} - ${new Date(toDate).toLocaleDateString()}</p>
        <p><strong>Days:</strong> ${requestedDays} (${completedLeave} completed, ${LOP} LOP)</p>
        <p><strong>Reason:</strong> ${reason}</p>
        
        <div style="margin: 25px 0; text-align: center;">
          <a href="${approveLink}" style="display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px; margin-right: 15px; font-weight: bold;">
            Approve
          </a>
          <a href="${rejectLink}" style="display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Reject
          </a>
        </div>
        
        <p style="font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 10px;">
          This link will expire in 7 days. If not processed, the request will remain pending.
        </p>
      </div>
    `;

    await sendEmail(
      "mcthilagavathi@gmail.com",
      "Leave Request Approval Needed",
      "",
      adminEmailHtml
    );

    res.status(201).json({ 
      message: "Leave request submitted successfully",
      leaveRequest: newLeaveRequest
    });
  } catch (error) {
    console.error("Error creating leave request:", error);
    res.status(500).json({ error: error.message });
  }
});
LeaveRequest.get('/process-action', async (req, res) => {
  try {
    const { employeeId, requestIndex, status, token } = req.query;

    // 1. Validate required parameters
    if (!employeeId || !requestIndex || !status || !token) {
      throw new Error('Missing required parameters');
    }

    // 2. Verify JWT token with proper error handling
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.error('JWT Verification Error:', jwtError);
      throw new Error('Invalid or expired token');
    }

    // 3. Validate token matches request
    if (decoded.employeeId !== employeeId || decoded.requestIndex !== parseInt(requestIndex)) {
      throw new Error('Token does not match request');
    }

    // 4. Process the request
    const employee = await userModel.findById(employeeId);
    if (!employee) throw new Error('Employee not found');

    const index = parseInt(requestIndex);
    if (!employee.leaveRequests?.[index]) {
      throw new Error('Leave request not found');
    }

    const leaveRequest = employee.leaveRequests[index];

    // Only process pending requests
    console.log(leaveRequest.status);
    
    if (leaveRequest.status !== 'Pending') {
      console.log(true);
      
      return res.status(200).json({
        success: true,
        message: `Request already ${leaveRequest.status.toLowerCase()}`
      });
    }

    // Update status
    leaveRequest.status = status;
    leaveRequest.processedAt = new Date();

    // Handle leave balance changes
    if (status === 'Rejected') {
      employee.availableLeave += leaveRequest.completedLeave || 0;
      employee.LOP -= leaveRequest.LOP || 0;
    }

    await employee.save();

    // Successful response
    res.status(200).json({
      success: true,
      message: `Leave request ${status.toLowerCase()} successfully`,
      newStatus: status,
      updatedAt: leaveRequest.processedAt
    });

  } catch (error) {
    console.error('Processing Error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
      // Include token expiration info if JWT error
      ...(error.message.includes('token') && { tokenExpired: true })
    });
  }
});

LeaveRequest.get("/employee/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ error: "Invalid employee ID" });
    }

    const employee = await userModel.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.status(200).json({
      leaveRequests: employee.leaveRequests,
      availableLeave: employee.availableLeave,
      totalLeave: employee.totalLeave
    });
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    res.status(500).json({ error: error.message });
  }
});

export default LeaveRequest;