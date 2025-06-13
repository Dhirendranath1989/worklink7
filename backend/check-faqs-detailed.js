const mongoose = require('mongoose');
const FAQ = require('./models/FAQ');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/worklink7')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const faqs = await FAQ.find().sort({ createdAt: -1 });
    console.log('FAQs found:', faqs.length);
    
    if (faqs.length > 0) {
      console.log('\nFAQ data:');
      faqs.forEach((faq, index) => {
        console.log(`\n${index + 1}. Category: ${faq.category}`);
        console.log(`   Question: ${faq.question}`);
        console.log(`   Answer: ${faq.answer}`);
        console.log(`   Active: ${faq.isActive}`);
        console.log(`   Created: ${faq.createdAt}`);
      });
    } else {
      console.log('No FAQs found in database');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });