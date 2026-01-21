const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');

// All user routes require authentication
router.get('/:id', verifyToken, userController.getUserProfile);
router.get('/:id/favorites', verifyToken, userController.getUserFavorites);
router.get('/:id/shared', verifyToken, userController.getUserShared);
router.get('/:id/recipes', verifyToken, userController.getUserRecipes);
router.put('/:id', verifyToken, userController.updateUserProfile);

module.exports = router;