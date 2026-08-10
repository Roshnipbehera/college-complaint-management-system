// College Complaint Management System - Week 1
// Basic Node.js/Express server foundation
const express = require('express');

const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Configurable port (defaults to 3000)
const PORT = process.env.PORT || 3000;
// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'College Complaint Management System API is running',
    status: 'success',
    week: 1
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is healthy'
  });
});

// Basic project info route
app.get('/api/project', (req, res) => {
  res.json({
    name: 'College Complaint Management System',
    version: '1.0.0',
    stage: 'Week 1'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});