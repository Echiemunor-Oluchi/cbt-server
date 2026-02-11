const mongoose = require('mongoose');

const resultDetailSchema = new mongoose.Schema({
  question: String,
  userAnswer: Number,
  correctAnswer: Number,
  options: [String],
  isCorrect: Boolean
}, { _id: false });

const resultSchema = new mongoose.Schema({
  student: {
    id: {
      type: String,
      required: [true, 'Student ID is required']
    },
    name: {
      type: String,
      required: [true, 'Student name is required']
    },
    role: {
      type: String,
      default: 'student'
    }
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    enum: ['elementary', 'college']
  },
  year: {
    type: Number,
    required: [true, 'Year is required']
  },
  track: {
    type: String,
    default: null
  },
  subject: {
    type: String,
    required: [true, 'Subject is required']
  },
  examType: {
    type: String,
    required: [true, 'Exam type is required'],
    enum: ['test', 'exam', 'practice']
  },
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: 0,
    max: 100
  },
  correct: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  details: [resultDetailSchema]
}, {
  timestamps: true
});

// Indexes for faster queries
resultSchema.index({ 'student.id': 1 });
resultSchema.index({ createdAt: -1 });
resultSchema.index({ section: 1, year: 1, subject: 1 });

module.exports = mongoose.model('Result', resultSchema);
