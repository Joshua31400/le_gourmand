const express = require('express');
const router = express.Router();
const path = require('path');

const servePage = (filename) => {
    return (req, res) => {
        res.sendFile(path.join(__dirname, '../public/pages', filename));
    };
};

// Public routes
router.get('/signin', servePage('signin.html'));
router.get('/signup', servePage('signup.html'));

// Protected routes
router.get('/', servePage('home.html'));
router.get('/home', servePage('home.html'));
router.get('/profile', servePage('profile.html'));
router.get('/profile/:id', servePage('profile.html'));
router.get('/recipe/:id', servePage('recipe.html'));

module.exports = router;