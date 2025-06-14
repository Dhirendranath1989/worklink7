require('dotenv').config({ path: './.env' });
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('All env vars:', Object.keys(process.env).filter(key => key.includes('MONGO')));