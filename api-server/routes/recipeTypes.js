const express = require('express');
const router = express.Router();
const recipeTypeController = require('../controllers/recipeTypeController');

// GET all recipe types
router.get('/', recipeTypeController.getAllRecipeTypes);

// GET single recipe type by ID
router.get('/:id', recipeTypeController.getRecipeTypeById);

module.exports = router;