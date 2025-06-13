const express = require('express');
const app = express();

app.use(express.json());

app.get('/test', (req, res) => {
  res.json({ message: 'Minimal server working' });
});

app.put('/api/users/change-password', (req, res) => {
  console.log('Change password endpoint hit');
  res.status(401).json({ message: 'Unauthorized - no token' });
});

const server = app.listen(3001, () => {
  console.log('Minimal server running on port 3001');
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    process.exit(0);
  });
});