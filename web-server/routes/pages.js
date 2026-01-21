const express = require('express');
const router = express.Router();
const path = require('path');

// Helper function to serve HTML files
const servePage = (filename) => {
    return (req, res) => {
        res.sendFile(path.join(__dirname, '../public/pages', filename));
    };
};

// Public routes (no authentication required)
router.get('/signin', servePage('signin.html'));
router.get('/signup', servePage('signup.html'));

// Protected routes (authentication required - checked on client side)
router.get('/', servePage('home.html'));
router.get('/home', servePage('home.html'));
router.get('/profile', servePage('profile.html'));
router.get('/recipe/:id', servePage('recipe.html'));

module.exports = router;