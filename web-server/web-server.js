const path = require('path');
const express = require('express');
const app = express();

const PORT = process.env.WEB_PORT || 3002;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Import routes
const pageRoutes = require('./routes/pages');
const uploadRoutes = require('./routes/upload');

// Use routes
app.use('/', pageRoutes);
app.use('/', uploadRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Web Server running on port: ${PORT}`);
});