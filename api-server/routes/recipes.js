const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const { verifyToken, optionalAuth } = require('../middleware/auth');

// Public routes (no authentication needed)
router.get('/', recipeController.getAllRecipes);
router.get('/:id', recipeController.getRecipeById);

// Protected routes (authentication required)
router.post('/', verifyToken, recipeController.createRecipe);
router.put('/:id', verifyToken, recipeController.updateRecipe);
router.delete('/:id', verifyToken, recipeController.deleteRecipe);
router.post('/:id/favorite', verifyToken, recipeController.addToFavorites);
router.delete('/:id/favorite', verifyToken, recipeController.removeFromFavorites);
router.post('/:id/share', verifyToken, recipeController.addToShared);
router.delete('/:id/share', verifyToken, recipeController.removeFromShared);
router.post('/:id/rate', verifyToken, recipeController.rateRecipe);

module.exports = router;