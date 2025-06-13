const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = 5001;

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Parse JSON bodies
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/worklink', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// FAQ Model
const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: String, default: 'general' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const FAQ = mongoose.model('FAQ', faqSchema);

// Public FAQ route
app.get('/api/public/faq', async (req, res) => {
  try {
    console.log('FAQ endpoint called');
    const faqs = await FAQ.find({ isActive: true }).sort({ createdAt: -1 });
    console.log('Found FAQs:', faqs.length);
    if (faqs.length > 0) {
      console.log('First FAQ:', JSON.stringify(faqs[0], null, 2));
    }
    res.json({ success: true, settings: { faqs } });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ success: false, message: 'Error fetching FAQs' });
  }
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test FAQ server is running!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Test FAQ server running on port ${PORT}`);
});