const db = require('../config/database');

// GET all ingredients
exports.getAllIngredients = async (req, res) => {
    try {
        const [ingredients] = await db.query(
            `SELECT id, name FROM ingredients ORDER BY name ASC`
        );

        res.json({
            success: true,
            count: ingredients.length,
            data: ingredients
        });

    } catch (error) {
        console.error('Error fetching ingredients:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching ingredients',
            error: error.message
        });
    }
};

// GET single ingredient by ID
exports.getIngredientById = async (req, res) => {
    try {
        const { id } = req.params;

        const [ingredients] = await db.query(
            `SELECT id, name FROM ingredients WHERE id = ?`,
            [id]
        );

        if (ingredients.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ingredient not found'
            });
        }

        res.json({
            success: true,
            data: ingredients[0]
        });

    } catch (error) {
        console.error('Error fetching ingredient:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching ingredient',
            error: error.message
        });
    }
};