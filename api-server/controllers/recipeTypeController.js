const db = require('../config/database');

// GET all recipe types
exports.getAllRecipeTypes = async (req, res) => {
    try {
        const [recipeTypes] = await db.query(
            `SELECT id, name FROM recipe_types ORDER BY name ASC`
        );

        res.json({
            success: true,
            count: recipeTypes.length,
            data: recipeTypes
        });

    } catch (error) {
        console.error('Error fetching recipe types:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recipe types',
            error: error.message
        });
    }
};

// GET single recipe type by ID
exports.getRecipeTypeById = async (req, res) => {
    try {
        const { id } = req.params;

        const [recipeTypes] = await db.query(
            `SELECT id, name FROM recipe_types WHERE id = ?`,
            [id]
        );

        if (recipeTypes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Recipe type not found'
            });
        }

        res.json({
            success: true,
            data: recipeTypes[0]
        });

    } catch (error) {
        console.error('Error fetching recipe type:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recipe type',
            error: error.message
        });
    }
};