const mongoose = require('mongoose');
const FAQ = require('./models/FAQ');

const sampleFAQs = [
  {
    category: 'general',
    question: 'How do I create an account?',
    answer: 'To create an account, click the "Sign Up" button on the homepage and fill in your details including email, password, and profile information.',
    isActive: true
  },
  {
    category: 'owners',
    question: 'How do I post a job?',
    answer: 'After logging in as an owner, navigate to the "Post Job" section, fill in the job details, requirements, and payment information, then submit for review.',
    isActive: true
  },
  {
    category: 'workers',
    question: 'How do I find work?',
    answer: 'Browse available jobs in your area, filter by category and requirements, then apply to jobs that match your skills and availability.',
    isActive: true
  },
  {
    category: 'payments',
    question: 'How does payment work?',
    answer: 'Payments are processed securely through our platform. Workers receive payment after job completion and owner approval.',
    isActive: true
  },
  {
    category: 'general',
    question: 'What if I have a dispute with a worker/owner?',
    answer: 'Contact our support team through the help section. We provide mediation services to resolve disputes fairly.',
    isActive: true
  },
  {
    category: 'general',
    question: 'How do I update my profile?',
    answer: 'Go to your profile settings, update your information, skills, and work photos. Make sure to save your changes.',
    isActive: true
  },
  {
    category: 'owners',
    question: 'Can I cancel a job posting?',
    answer: 'Yes, you can cancel a job posting before workers apply. Once applications are received, contact support for assistance.',
    isActive: true
  },
  {
    category: 'safety',
    question: 'How do I get verified on the platform?',
    answer: 'Complete your profile, upload required documents, and follow the verification process in your account settings.',
    isActive: true
  }
];

mongoose.connect('mongodb://localhost:27017/worklink7')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Clear existing FAQs
    await FAQ.deleteMany({});
    console.log('Cleared existing FAQs');
    
    // Insert sample FAQs
    const insertedFAQs = await FAQ.insertMany(sampleFAQs);
    console.log(`Inserted ${insertedFAQs.length} sample FAQs`);
    
    // Verify insertion
    const count = await FAQ.countDocuments();
    console.log(`Total FAQs in database: ${count}`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });