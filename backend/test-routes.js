const express = require('express');
const app = express();
const usersRouter = require('./routes/users');

app.use('/api/users', usersRouter);

console.log('Checking routes...');
app._router.stack.forEach(layer => {
  if (layer.route) {
    console.log('Route:', layer.route.path, Object.keys(layer.route.methods));
  } else if (layer.name === 'router') {
    console.log('Router mounted at:', layer.regexp.source);
    if (layer.handle && layer.handle.stack) {
      layer.handle.stack.forEach(route => {
        if (route.route) {
          console.log('  Sub-route:', route.route.path, Object.keys(route.route.methods));
        }
      });
    }
  }
});