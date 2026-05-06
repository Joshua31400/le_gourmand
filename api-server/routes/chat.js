const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/conversations', chatController.getOrCreateConversation);

router.get('/conversations/:id/messages', chatController.getMessages);

router.post('/conversations/:id/messages', chatController.sendMessage);

router.get('/users/:userId/conversations', chatController.getUserConversations);

module.exports = router;
