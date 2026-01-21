const db = require('../config/database');

// GET user profile
exports.getUserProfile = async (req, res) => {
    try {
        const { id } = req.params;

        const [users] = await db.query(
            `SELECT id, username, email, picture FROM users WHERE id = ?`,
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: users[0]
        });

    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user profile',
            error: error.message
        });
    }
};

// GET user's favorite recipes - OPTIMIZED
exports.getUserFavorites = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                r.id,
                r.name,
                r.picture,
                r.description,
                d.name as diet_name,
                rt.name as type_name,
                c.name as country_name,
                AVG(rn.note) as average_rating
            FROM user_favorites uf
            JOIN recipes r ON uf.recipe_id = r.id
            LEFT JOIN diets d ON r.diet_id = d.id
            LEFT JOIN recipe_types rt ON r.type_id = rt.id
            LEFT JOIN countries c ON r.country_id = c.id
            LEFT JOIN recipe_notes rn ON r.id = rn.recipe_id
            WHERE uf.user_id = ?
            GROUP BY r.id, r.name, r.picture, r.description, d.name, rt.name, c.name
            ORDER BY r.name ASC
        `;

        const [recipes] = await db.query(query, [id]);

        res.json({
            success: true,
            count: recipes.length,
            data: recipes
        });

    } catch (error) {
        console.error('Error fetching user favorites:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching favorites',
            error: error.message
        });
    }
};

// GET user's shared recipes - OPTIMIZED
exports.getUserShared = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                r.id,
                r.name,
                r.picture,
                r.description,
                d.name as diet_name,
                rt.name as type_name,
                c.name as country_name,
                AVG(rn.note) as average_rating
            FROM user_shared us
            JOIN recipes r ON us.recipe_id = r.id
            LEFT JOIN diets d ON r.diet_id = d.id
            LEFT JOIN recipe_types rt ON r.type_id = rt.id
            LEFT JOIN countries c ON r.country_id = c.id
            LEFT JOIN recipe_notes rn ON r.id = rn.recipe_id
            WHERE us.user_id = ?
            GROUP BY r.id, r.name, r.picture, r.description, d.name, rt.name, c.name
            ORDER BY r.name ASC
        `;

        const [recipes] = await db.query(query, [id]);

        res.json({
            success: true,
            count: recipes.length,
            data: recipes
        });

    } catch (error) {
        console.error('Error fetching user shared recipes:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching shared recipes',
            error: error.message
        });
    }
};

// GET user's created recipes
exports.getUserRecipes = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                r.id,
                r.name,
                r.picture,
                r.description,
                d.name as diet_name,
                rt.name as type_name,
                c.name as country_name,
                AVG(rn.note) as average_rating
            FROM recipes r
            LEFT JOIN diets d ON r.diet_id = d.id
            LEFT JOIN recipe_types rt ON r.type_id = rt.id
            LEFT JOIN countries c ON r.country_id = c.id
            LEFT JOIN recipe_notes rn ON r.id = rn.recipe_id
            WHERE r.user_id = ?
            GROUP BY r.id, r.name, r.picture, r.description, d.name, rt.name, c.name
            ORDER BY r.name ASC
        `;

        const [recipes] = await db.query(query, [id]);

        res.json({
            success: true,
            count: recipes.length,
            data: recipes
        });

    } catch (error) {
        console.error('Error fetching user recipes:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user recipes',
            error: error.message
        });
    }
};

// PUT update user profile
exports.updateUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, picture } = req.body;

        const updates = [];
        const values = [];

        if (username) {
            updates.push('username = ?');
            values.push(username);
        }

        if (picture) {
            updates.push('picture = ?');
            values.push(picture);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        values.push(id);

        await db.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
};