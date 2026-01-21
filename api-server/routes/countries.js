const express = require('express');
const router = express.Router();
const countryController = require('../controllers/countryController');

// GET all countries
router.get('/', countryController.getAllCountries);

// GET single country by ID
router.get('/:id', countryController.getCountryById);

module.exports = router;