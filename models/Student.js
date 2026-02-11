const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true
  },
  role: {
    type: String,
    default: 'student',
    enum: ['student', 'admin']
  },
  section: {
    type: String,
    enum: ['elementary', 'college', null],
    default: null
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster lookups
studentSchema.index({ studentId: 1 });

module.exports = mongoose.model('Student', studentSchema);
