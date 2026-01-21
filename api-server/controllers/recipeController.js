const db = require('../config/database');

// GET all recipes with search and filters - OPTIMIZED with JOIN
exports.getAllRecipes = async (req, res) => {
    try {
        const { search, diet, type, country } = req.query;

        let query = `
            SELECT
                r.id,
                r.name,
                r.picture,
                r.description,
                d.name as diet_name,
                rt.name as type_name,
                c.name as country_name,
                AVG(rn.note) as average_rating,
                COUNT(DISTINCT uf.id) as favorites_count
            FROM recipes r
                     LEFT JOIN diets d ON r.diet_id = d.id
                     LEFT JOIN recipe_types rt ON r.type_id = rt.id
                     LEFT JOIN countries c ON r.country_id = c.id
                     LEFT JOIN recipe_notes rn ON r.id = rn.recipe_id
                     LEFT JOIN user_favorites uf ON r.id = uf.recipe_id
            WHERE 1=1
        `;

        const params = [];

        // Search by name or ingredient
        if (search) {
            query += ` AND (r.name LIKE ? OR r.id IN (
                SELECT rri.recipe_id 
                FROM relation_recipe_ingredients rri
                JOIN ingredients i ON rri.ingredient_id = i.id
                WHERE i.name LIKE ?
            ))`;
            params.push(`%${search}%`, `%${search}%`);
        }

        // Filter by diet
        if (diet) {
            query += ` AND r.diet_id = ?`;
            params.push(diet);
        }

        // Filter by type
        if (type) {
            query += ` AND r.type_id = ?`;
            params.push(type);
        }

        // Filter by country
        if (country) {
            query += ` AND r.country_id = ?`;
            params.push(country);
        }

        query += ` GROUP BY r.id, r.name, r.picture, r.description, d.name, rt.name, c.name`;
        query += ` ORDER BY r.name ASC`;

        const [recipes] = await db.query(query, params);

        res.json({
            success: true,
            count: recipes.length,
            data: recipes
        });

    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recipes',
            error: error.message
        });
    }
};

// GET single recipe with ALL details - OPTIMIZED with multiple JOINs
exports.getRecipeById = async (req, res) => {
    try {
        const { id } = req.params;

        // Main recipe info with related data
        const recipeQuery = `
            SELECT
                r.*,
                d.name as diet_name,
                rt.name as type_name,
                c.name as country_name,
                AVG(rn.note) as average_rating,
                COUNT(DISTINCT rn.id) as total_ratings,
                COUNT(DISTINCT uf.id) as favorites_count
            FROM recipes r
                     LEFT JOIN diets d ON r.diet_id = d.id
                     LEFT JOIN recipe_types rt ON r.type_id = rt.id
                     LEFT JOIN countries c ON r.country_id = c.id
                     LEFT JOIN recipe_notes rn ON r.id = rn.recipe_id
                     LEFT JOIN user_favorites uf ON r.id = uf.recipe_id
            WHERE r.id = ?
            GROUP BY r.id
        `;

        // Get ingredients for this recipe
        const ingredientsQuery = `
            SELECT
                i.id,
                i.name
            FROM ingredients i
                     JOIN relation_recipe_ingredients rri ON i.id = rri.ingredient_id
            WHERE rri.recipe_id = ?
        `;

        const [recipeResult] = await db.query(recipeQuery, [id]);
        const [ingredients] = await db.query(ingredientsQuery, [id]);

        if (recipeResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Recipe not found'
            });
        }

        const recipe = {
            ...recipeResult[0],
            ingredients: ingredients
        };

        res.json({
            success: true,
            data: recipe
        });

    } catch (error) {
        console.error('Error fetching recipe:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recipe',
            error: error.message
        });
    }
};

// POST create new recipe
exports.createRecipe = async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const { name, picture, description, preparation, diet_id, type_id, country_id, ingredients } = req.body;
        const user_id = req.user.id;

        // Insert recipe with user_id
        const [recipeResult] = await connection.query(
            `INSERT INTO recipes (name, picture, description, preparation, diet_id, type_id, country_id, user_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, picture, description, preparation, diet_id, type_id, country_id, user_id]
        );

        const recipeId = recipeResult.insertId;

        // Insert ingredients relations
        if (ingredients && ingredients.length > 0) {
            const ingredientValues = ingredients.map(ingredientId => [recipeId, ingredientId]);
            await connection.query(
                `INSERT INTO relation_recipe_ingredients (recipe_id, ingredient_id) VALUES ?`,
                [ingredientValues]
            );
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Recipe created successfully',
            data: { id: recipeId }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error creating recipe:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating recipe',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// POST add to favorites
exports.addToFavorites = async (req, res) => {
    try {
        const { id } = req.params; // recipe_id
        const user_id = req.user.id; // Get from JWT token

        // Check if already favorited
        const [existing] = await db.query(
            `SELECT id FROM user_favorites WHERE user_id = ? AND recipe_id = ?`,
            [user_id, id]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Recipe already in favorites'
            });
        }

        await db.query(
            `INSERT INTO user_favorites (user_id, recipe_id) VALUES (?, ?)`,
            [user_id, id]
        );

        res.json({
            success: true,
            message: 'Recipe added to favorites'
        });

    } catch (error) {
        console.error('Error adding to favorites:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding to favorites',
            error: error.message
        });
    }
};

// DELETE remove from favorites
exports.removeFromFavorites = async (req, res) => {
    try {
        const { id } = req.params; // recipe_id
        const user_id = req.user.id; // Get from JWT token

        const [result] = await db.query(
            `DELETE FROM user_favorites WHERE user_id = ? AND recipe_id = ?`,
            [user_id, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Recipe not in favorites'
            });
        }

        res.json({
            success: true,
            message: 'Recipe removed from favorites'
        });

    } catch (error) {
        console.error('Error removing from favorites:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing from favorites',
            error: error.message
        });
    }
};

// POST rate recipe
exports.rateRecipe = async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;
        const user_id = req.user.id;

        // Validate note
        if (!note || note < 1 || note > 5) {
            return res.status(400).json({
                success: false,
                message: 'Note must be between 1 and 5'
            });
        }

        // Check if user already rated
        const [existing] = await db.query(
            `SELECT id FROM recipe_notes WHERE user_id = ? AND recipe_id = ?`,
            [user_id, id]
        );

        if (existing.length > 0) {
            // Update existing rating
            await db.query(
                `UPDATE recipe_notes SET note = ? WHERE user_id = ? AND recipe_id = ?`,
                [note, user_id, id]
            );
        } else {
            // Insert new rating
            await db.query(
                `INSERT INTO recipe_notes (user_id, recipe_id, note) VALUES (?, ?, ?)`,
                [user_id, id, note]
            );
        }

        res.json({
            success: true,
            message: 'Recipe rated successfully'
        });

    } catch (error) {
        console.error('Error rating recipe:', error);
        res.status(500).json({
            success: false,
            message: 'Error rating recipe',
            error: error.message
        });
    }
};

// PUT update recipe
exports.updateRecipe = async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { name, picture, description, preparation, diet_id, type_id, country_id, ingredients } = req.body;
        const user_id = req.user.id; // Get from JWT token

        // Check if user owns this recipe
        const [recipe] = await connection.query(
            `SELECT user_id FROM recipes WHERE id = ?`,
            [id]
        );

        if (recipe.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Recipe not found'
            });
        }

        if (recipe[0].user_id !== user_id) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this recipe'
            });
        }

        // Update recipe
        await connection.query(
            `UPDATE recipes 
             SET name = ?, picture = ?, description = ?, preparation = ?, 
                 diet_id = ?, type_id = ?, country_id = ?
             WHERE id = ?`,
            [name, picture, description, preparation, diet_id, type_id, country_id, id]
        );

        // Delete old ingredients relations
        await connection.query(
            `DELETE FROM relation_recipe_ingredients WHERE recipe_id = ?`,
            [id]
        );

        // Insert new ingredients relations
        if (ingredients && ingredients.length > 0) {
            const ingredientValues = ingredients.map(ingredientId => [id, ingredientId]);
            await connection.query(
                `INSERT INTO relation_recipe_ingredients (recipe_id, ingredient_id) VALUES ?`,
                [ingredientValues]
            );
        }

        await connection.commit();

        res.json({
            success: true,
            message: 'Recipe updated successfully'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error updating recipe:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating recipe',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// DELETE recipe
exports.deleteRecipe = async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const user_id = req.user.id; // Get from JWT token

        // Check if user owns this recipe
        const [recipe] = await connection.query(
            `SELECT user_id FROM recipes WHERE id = ?`,
            [id]
        );

        if (recipe.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Recipe not found'
            });
        }

        if (recipe[0].user_id !== user_id) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this recipe'
            });
        }

        // Delete related data first (foreign key constraints)
        await connection.query(`DELETE FROM relation_recipe_ingredients WHERE recipe_id = ?`, [id]);
        await connection.query(`DELETE FROM recipe_notes WHERE recipe_id = ?`, [id]);
        await connection.query(`DELETE FROM user_favorites WHERE recipe_id = ?`, [id]);
        await connection.query(`DELETE FROM user_shared WHERE recipe_id = ?`, [id]);

        // Delete recipe
        await connection.query(`DELETE FROM recipes WHERE id = ?`, [id]);

        await connection.commit();

        res.json({
            success: true,
            message: 'Recipe deleted successfully'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error deleting recipe:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting recipe',
            error: error.message
        });
    } finally {
        connection.release();
    }
};