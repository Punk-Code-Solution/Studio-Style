const express = require('express');
const whatsappController = require('../controllers/whatsapp.controller');

const router = express.Router();

/**
 * @swagger
 * /webhook:
 *   get:
 *     summary: Verifica o webhook do WhatsApp
 *     tags:
 *       - WhatsApp
 *     responses:
 *       200:
 *         description: Webhook verificado com sucesso
 *   post:
 *     summary: Recebe mensagens do webhook do WhatsApp
 *     tags:
 *       - WhatsApp
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Mensagem recebida com sucesso
 */

// Webhook para verificação
router.get('/webhook', whatsappController.verifyWebhook.bind(whatsappController));

/**
 * @swagger
 * /webhook:
 *   post:
 *     summary: Recebe mensagens do webhook do WhatsApp
 *     tags:
 *       - WhatsApp
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Mensagem recebida com sucesso
 */
// Webhook para receber mensagens
router.post('/webhook', whatsappController.handleWebhook.bind(whatsappController));

module.exports = router;
