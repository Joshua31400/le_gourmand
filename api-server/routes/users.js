const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// GET user profile
router.get('/:id', userController.getUserProfile);

// GET user's favorite recipes
router.get('/:id/favorites', userController.getUserFavorites);

// GET user's shared recipes
router.get('/:id/shared', userController.getUserShared);

// GET user's created recipes
router.get('/:id/recipes', userController.getUserRecipes);

// PUT update user profile
router.put('/:id', userController.updateUserProfile);

module.exports = router;