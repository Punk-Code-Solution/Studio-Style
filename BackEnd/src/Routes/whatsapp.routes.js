const express = require('express');
const whatsappController = require('../controllers/whatsapp.controller');

const router = express.Router();

// Webhook para verificação
router.get('/webhook', whatsappController.verifyWebhook.bind(whatsappController));

// Webhook para receber mensagens
router.post('/webhook', whatsappController.handleWebhook.bind(whatsappController));

module.exports = router;
