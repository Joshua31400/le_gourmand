const db = require('../config/database');

// GET all countries
exports.getAllCountries = async (req, res) => {
    try {
        const [countries] = await db.query(
            `SELECT id, name FROM countries ORDER BY name ASC`
        );

        res.json({
            success: true,
            count: countries.length,
            data: countries
        });

    } catch (error) {
        console.error('Error fetching countries:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching countries',
            error: error.message
        });
    }
};

// GET single country by ID
exports.getCountryById = async (req, res) => {
    try {
        const { id } = req.params;

        const [countries] = await db.query(
            `SELECT id, name FROM countries WHERE id = ?`,
            [id]
        );

        if (countries.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Country not found'
            });
        }

        res.json({
            success: true,
            data: countries[0]
        });

    } catch (error) {
        console.error('Error fetching country:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching country',
            error: error.message
        });
    }
};