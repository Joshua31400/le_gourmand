const express = require('express');
const router = express.Router();
const ingredientController = require('../controllers/ingredientController');

// GET all ingredients
router.get('/', ingredientController.getAllIngredients);

// GET single ingredient by ID
router.get('/:id', ingredientController.getIngredientById);

module.exports = router;