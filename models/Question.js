const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  options: {
    type: [String],
    required: [true, 'Options are required'],
    validate: {
      validator: function(v) {
        return v.length === 4;
      },
      message: 'Exactly 4 options are required'
    }
  },
  correctAnswer: {
    type: Number,
    required: [true, 'Correct answer index is required'],
    min: 0,
    max: 3
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    enum: ['elementary', 'college', 'entrance', 'vat' , 'mock6', 'mock9', 'mock12']
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: 1,
    max: 12
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['test', 'exam', 'practice'],
    default: 'test'
  },
  track: {
    type: String,
    enum: ['Science', 'Commercial', 'Arts', ''],
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster queries
questionSchema.index({ section: 1, year: 1, subject: 1, type: 1 });
questionSchema.index({ track: 1 });

module.exports = mongoose.model('Question', questionSchema);
