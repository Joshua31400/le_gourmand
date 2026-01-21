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

// Use routes
app.use('/', pageRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'pages', '404.html'));
});

app.listen(PORT, () => {
    console.log(`🌐 Web Server running on port: ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
});