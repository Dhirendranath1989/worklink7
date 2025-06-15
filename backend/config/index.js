module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/worklink',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  cors: {
    origins: process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',') : 
      ['http://localhost:5173', 'https://www.worklinkindia.com'],
    credentials: true
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-fallback-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  }
};