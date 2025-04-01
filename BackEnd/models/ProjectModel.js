import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: String, required: true }, // Stored in DD-MM-YYYY format
  budget: { type: Number, required: true },
  resources: { type: [String], required: true }, // Updated to an array of strings
});

const Project = mongoose.model('Project', projectSchema);
export default Project;
