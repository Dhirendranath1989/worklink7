const mongoose = require('mongoose');
const FAQ = require('./models/FAQ');

mongoose.connect('mongodb://localhost:27017/worklink7')
  .then(async () => {
    console.log('Connected to MongoDB');
    const faqs = await FAQ.find();
    console.log('FAQs in database:', faqs.length);
    console.log(JSON.stringify(faqs, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });