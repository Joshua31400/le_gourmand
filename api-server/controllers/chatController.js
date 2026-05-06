const db = require('../config/database');

// POST initier ou récupérer une conversation
exports.getOrCreateConversation = async (req, res) => {
    try {
        // Idéalement, user1Id vient de req.user.id si tu utilises ton middleware auth.js
        // Pour être sûr, on le récupère du body ici, avec le targetUserId (l'autre utilisateur)
        const { user1Id, targetUserId } = req.body;

        if (!user1Id || !targetUserId) {
            return res.status(400).json({
                success: false,
                message: 'Les IDs des deux utilisateurs sont requis'
            });
        }

        // On cherche si la conversation existe déjà
        const [existing] = await db.query(
            `SELECT id FROM conversations 
             WHERE (user1_id = ? AND user2_id = ?) 
                OR (user1_id = ? AND user2_id = ?)`,
            [user1Id, targetUserId, targetUserId, user1Id]
        );

        if (existing.length > 0) {
            return res.json({
                success: true,
                message: 'Conversation existante trouvée',
                data: { conversationId: existing[0].id }
            });
        }

        // Sinon, on crée la conversation
        const [result] = await db.query(
            `INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)`,
            [user1Id, targetUserId]
        );

        res.json({
            success: true,
            message: 'Nouvelle conversation créée',
            data: { conversationId: result.insertId }
        });

    } catch (error) {
        console.error('Error in getOrCreateConversation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération/création de la conversation',
            error: error.message
        });
    }
};

// GET récupérer les messages d'une conversation
exports.getMessages = async (req, res) => {
    try {
        const conversationId = req.params.id;

        const [messages] = await db.query(
            `SELECT m.*, u.username, u.picture as user_picture 
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             WHERE m.conversation_id = ? 
             ORDER BY m.created_at ASC`,
            [conversationId]
        );

        res.json({
            success: true,
            count: messages.length,
            data: messages
        });

    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des messages',
            error: error.message
        });
    }
};

// POST sauvegarder un nouveau message (utile pour l'API classique avant les WebSockets)
exports.sendMessage = async (req, res) => {
    try {
        const conversationId = req.params.id;
        const { senderId, content } = req.body;

        if (!senderId || !content) {
            return res.status(400).json({
                success: false,
                message: 'L\'ID de l\'expéditeur et le contenu du message sont requis'
            });
        }

        const [result] = await db.query(
            `INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)`,
            [conversationId, senderId, content]
        );

        res.json({
            success: true,
            message: 'Message envoyé',
            data: {
                messageId: result.insertId,
                conversation_id: conversationId,
                sender_id: senderId,
                content: content,
                created_at: new Date()
            }
        });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'envoi du message',
            error: error.message
        });
    }
};
// GET récupérer toutes les conversations d'un utilisateur (Boîte de réception)
exports.getUserConversations = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Cette requête SQL magique récupère les discussions, les infos de l'autre utilisateur, et le dernier message !
        const [conversations] = await db.query(
            `SELECT 
                c.id AS conversation_id,
                u.id AS target_user_id,
                u.username AS target_username,
                u.picture AS target_picture,
                (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_date
             FROM conversations c
             JOIN users u ON (c.user1_id = u.id OR c.user2_id = u.id) AND u.id != ?
             WHERE c.user1_id = ? OR c.user2_id = ?
             HAVING last_message IS NOT NULL
             ORDER BY last_message_date DESC`,
            [userId, userId, userId]
        );

        res.json({
            success: true,
            data: conversations
        });

    } catch (error) {
        console.error('Error fetching user conversations:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des discussions',
            error: error.message
        });
    }
};