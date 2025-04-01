import mongoose from "mongoose";

const moodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "User ID is required"],
    ref: "User"
  },
  username: {
    type: String,
    required: [true, "Username is required"],
    trim: true
  },
  mood: {
    type: String,
    required: [true, "Mood is required"],
    enum: {
      values: ['happy', 'sad', 'neutral', 'excited', 'angry', 'anxious'],
      message: '{VALUE} is not a valid mood'
    }
  },
  intensity: {
    type: Number,
    required: [true, "Intensity is required"],
    min: [1, "Intensity must be at least 1"],
    max: [10, "Intensity cannot be more than 10"]
  },
  note: {
    type: String,
    maxlength: [200, "Note cannot be more than 200 characters"],
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries
moodSchema.index({ userId: 1, date: -1 });

const Mood = mongoose.model('Mood', moodSchema);

export default Mood;