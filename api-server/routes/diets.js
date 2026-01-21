const express = require('express');
const router = express.Router();
const dietController = require('../controllers/dietController');

// GET all diets
router.get('/', dietController.getAllDiets);

// GET single diet by ID
router.get('/:id', dietController.getDietById);

module.exports = router;