// Load .env from current directory (web-server folder)
require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Import routes
const pageRoutes = require('./routes/pages');
const uploadRoutes = require('./routes/upload');

// Use routes
app.use('/', pageRoutes);
app.use('/', uploadRoutes);

app.listen(PORT, () => {
    console.log(`🌐 Web Server running on port: ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
});