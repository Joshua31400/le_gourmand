require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const recipeRoutes = require('./routes/recipes');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const ingredientRoutes = require('./routes/ingredients');
const dietRoutes = require('./routes/diets');
const countryRoutes = require('./routes/countries');
const recipeTypeRoutes = require('./routes/recipeTypes');

// Use routes
app.use('/api/recipes', recipeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/diets', dietRoutes);
app.use('/api/countries', countryRoutes);
app.use('/api/recipe-types', recipeTypeRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'API is running',
        database: process.env.DB_NAME
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`🚀 API Server running on port: ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
});