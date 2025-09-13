const express = require('express');
const whatsappController = require('../controllers/whatsapp.controller');

const router = express.Router();

// Webhook para verificação
router.get('/webhook', whatsappController.verifyWebhook);

// Webhook para receber mensagens
router.post('/webhook', whatsappController.handleWebhook);

module.exports = router;
