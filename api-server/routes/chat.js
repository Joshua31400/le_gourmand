const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/conversations', chatController.getOrCreateConversation);

router.get('/conversations/:id/messages', chatController.getMessages);

router.post('/conversations/:id/messages', chatController.sendMessage);

module.exports = router;
