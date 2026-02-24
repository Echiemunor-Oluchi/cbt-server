const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import models
const Question = require('./models/Question');
const Result = require('./models/Result');
const Student = require('./models/Student');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

connectDB();

// ═══════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'CBT Server is running',
    timestamp: new Date().toISOString()
  });
});

// ═══════════════════════════════════════════════════════════════════
// QUESTIONS ROUTES
// ═══════════════════════════════════════════════════════════════════

// Get all questions
app.get('/api/questions', async (req, res) => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Get filtered questions for exam
app.get('/api/questions/filter', async (req, res) => {
  try {
    const { section, year, subject, type, track } = req.query;
    
    let query = {
      section,
      year: parseInt(year),
      subject
    };
    
    // For practice, get all types; otherwise filter by type
    if (type !== 'practice') {
      query.type = type;
    }
    
    // For senior secondary, filter by track
    if (track) {
      query.$or = [
        { track: track },
        { track: '' },
        { track: { $exists: false } }
      ];
    }
    
    const questions = await Question.find(query);
    res.json(questions);
  } catch (error) {
    console.error('Error filtering questions:', error);
    res.status(500).json({ error: 'Failed to filter questions' });
  }
});

// Get single question
app.get('/api/questions/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json(question);
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

// Add single question
app.post('/api/questions', async (req, res) => {
  try {
    const question = new Question(req.body);
    await question.save();
    res.status(201).json(question);
  } catch (error) {
    console.error('Error adding question:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to add question' });
  }
});

// Bulk upload questions
app.post('/api/questions/bulk', async (req, res) => {
  try {
    const questions = req.body;
    if (!Array.isArray(questions)) {
      return res.status(400).json({ error: 'Expected an array of questions' });
    }
    
    const inserted = await Question.insertMany(questions, { ordered: false });
    res.status(201).json({ 
      message: `Successfully added ${inserted.length} questions`,
      questions: inserted 
    });
  } catch (error) {
    console.error('Error bulk uploading:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to bulk upload questions' });
  }
});

// Update question
app.put('/api/questions/:id', async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json(question);
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// Delete question
app.delete('/api/questions/:id', async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Delete multiple questions
app.post('/api/questions/delete-many', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: 'Expected an array of IDs' });
    }
    
    const result = await Question.deleteMany({ _id: { $in: ids } });
    res.json({ message: `Deleted ${result.deletedCount} questions` });
  } catch (error) {
    console.error('Error deleting questions:', error);
    res.status(500).json({ error: 'Failed to delete questions' });
  }
});

// DELETE all questions
app.delete('/api/questions/all', async (req, res) => {
  try {
    await Question.deleteMany({});
    res.json({ message: 'All questions deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// RESULTS ROUTES
// ═══════════════════════════════════════════════════════════════════

// Get all results
app.get('/api/results', async (req, res) => {
  try {
    const results = await Result.find().sort({ createdAt: -1 });
    res.json(results);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// Get results by student
app.get('/api/results/student/:studentId', async (req, res) => {
  try {
    const results = await Result.find({ 
      'student.id': req.params.studentId 
    }).sort({ createdAt: -1 });
    res.json(results);
  } catch (error) {
    console.error('Error fetching student results:', error);
    res.status(500).json({ error: 'Failed to fetch student results' });
  }
});

// Get results statistics
app.get('/api/results/stats', async (req, res) => {
  try {
    const stats = await Result.aggregate([
      {
        $group: {
          _id: {
            section: '$section',
            year: '$year',
            subject: '$subject'
          },
          avgScore: { $avg: '$score' },
          totalExams: { $sum: 1 },
          highestScore: { $max: '$score' },
          lowestScore: { $min: '$score' }
        }
      },
      { $sort: { '_id.section': 1, '_id.year': 1, '_id.subject': 1 } }
    ]);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Save result
app.post('/api/results', async (req, res) => {
  try {
    const result = new Result(req.body);
    await result.save();
    res.status(201).json(result);
  } catch (error) {
    console.error('Error saving result:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to save result' });
  }
});

// Delete result
app.delete('/api/results/:id', async (req, res) => {
  try {
    const result = await Result.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }
    res.json({ message: 'Result deleted successfully' });
  } catch (error) {
    console.error('Error deleting result:', error);
    res.status(500).json({ error: 'Failed to delete result' });
  }
});

// Clear all results (admin only - use with caution)
app.delete('/api/results/clear/all', async (req, res) => {
  try {
    const result = await Result.deleteMany({});
    res.json({ message: `Cleared ${result.deletedCount} results` });
  } catch (error) {
    console.error('Error clearing results:', error);
    res.status(500).json({ error: 'Failed to clear results' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// STUDENTS ROUTES
// ═══════════════════════════════════════════════════════════════════

// Get all students
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get single student
app.get('/api/students/:studentId', async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.studentId });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// Register or login student
app.post('/api/students/login', async (req, res) => {
  try {
    const { studentId, name, role, section } = req.body;
    
    // Try to find existing student
    let student = await Student.findOne({ studentId });
    
    if (student) {
      // Update last login
      student.lastLogin = new Date();
      if (section) student.section = section;
      await student.save();
    } else {
      // Create new student
      student = new Student({
        studentId,
        name,
        role: role || 'student',
        section
      });
      await student.save();
    }
    
    res.json(student);
  } catch (error) {
    console.error('Error with student login:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to process login' });
  }
});

// Update student
app.put('/api/students/:studentId', async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { studentId: req.params.studentId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Delete student
app.delete('/api/students/:studentId', async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({ 
      studentId: req.params.studentId 
    });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ═══════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 5000;


// DELETE all questions
app.delete('/api/questions/all', async (req, res) => {
  try {
    await Question.deleteMany({});
    res.json({ message: 'All questions deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
EOF 
git add .
