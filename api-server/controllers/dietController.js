const db = require('../config/database');

// GET all diets
exports.getAllDiets = async (req, res) => {
    try {
        const [diets] = await db.query(
            `SELECT id, name FROM diets ORDER BY name ASC`
        );

        res.json({
            success: true,
            count: diets.length,
            data: diets
        });

    } catch (error) {
        console.error('Error fetching diets:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching diets',
            error: error.message
        });
    }
};

// GET single diet by ID
exports.getDietById = async (req, res) => {
    try {
        const { id } = req.params;

        const [diets] = await db.query(
            `SELECT id, name FROM diets WHERE id = ?`,
            [id]
        );

        if (diets.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Diet not found'
            });
        }

        res.json({
            success: true,
            data: diets[0]
        });

    } catch (error) {
        console.error('Error fetching diet:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching diet',
            error: error.message
        });
    }
};