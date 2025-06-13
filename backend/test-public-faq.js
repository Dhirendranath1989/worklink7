const http = require('http');

async function testPublicFAQ() {
  try {
    const data = await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:5000/api/public/faq', (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            reject(e);
          }
        });
      });
      req.on('error', reject);
    });
    
    console.log('Response status:', data.status);
    console.log('Response data:', JSON.stringify(data.data, null, 2));
    
    if (data.data.settings && data.data.settings.faqs) {
      console.log('Number of FAQs:', data.data.settings.faqs.length);
      data.data.settings.faqs.forEach((faq, index) => {
        console.log(`FAQ ${index + 1}:`);
        console.log('  Question:', faq.question);
        console.log('  Answer:', faq.answer);
        console.log('  Category:', faq.category);
        console.log('  Active:', faq.isActive);
      });
    }
  } catch (error) {
    console.error('Error testing FAQ API:', error);
  }
}

testPublicFAQ();