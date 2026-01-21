const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');

// GET all recipes with search and filters
// Query params: ?search=pasta&diet=1&type=2&country=3
router.get('/', recipeController.getAllRecipes);

// GET single recipe with all details
router.get('/:id', recipeController.getRecipeById);

// POST create new recipe
router.post('/', recipeController.createRecipe);

// PUT update recipe
router.put('/:id', recipeController.updateRecipe);

// DELETE recipe
router.delete('/:id', recipeController.deleteRecipe);

// POST add recipe to favorites
router.post('/:id/favorite', recipeController.addToFavorites);

// DELETE remove from favorites
router.delete('/:id/favorite', recipeController.removeFromFavorites);

// POST rate a recipe
router.post('/:id/rate', recipeController.rateRecipe);

module.exports = router;