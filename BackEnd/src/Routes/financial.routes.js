const { Router } = require('express');
const router = Router();
const FinancialController = require('../controllers/financial.controller');
const { authorizeRoles } = require('../middlewares/auth');

/**
 * @swagger
 * /financial/calculate-split:
 *   post:
 *     summary: Calcula divisão de pagamento de serviço
 *     tags: [Financial]
 */
router.post('/calculate-split', authorizeRoles(['admin', 'provider']), 
  (req, res) => FinancialController.calculateServiceSplit(req, res));

/**
 * @swagger
 * /financial/record-payment:
 *   post:
 *     summary: Registra pagamento no livro razão
 *     tags: [Financial]
 */
router.post('/record-payment', authorizeRoles(['admin', 'provider']), 
  (req, res) => FinancialController.recordServicePayment(req, res));

/**
 * @swagger
 * /financial/ledger:
 *   get:
 *     summary: Busca entradas do livro razão
 *     tags: [Financial]
 */
router.get('/ledger', authorizeRoles(['admin', 'provider']), 
  (req, res) => FinancialController.getLedgerEntries(req, res));

/**
 * @swagger
 * /financial/ledger/:id:
 *   get:
 *     summary: Busca uma entrada específica por ID
 *     tags: [Financial]
 */
router.get('/ledger/:id', authorizeRoles(['admin', 'provider']), 
  (req, res) => FinancialController.getLedgerEntry(req, res));

/**
 * @swagger
 * /financial/ledger:
 *   post:
 *     summary: Cria uma entrada manual no livro razão
 *     tags: [Financial]
 */
router.post('/ledger', authorizeRoles(['admin']), 
  (req, res) => FinancialController.createLedgerEntry(req, res));

/**
 * @swagger
 * /financial/ledger/:id:
 *   put:
 *     summary: Atualiza uma entrada do livro razão
 *     tags: [Financial]
 */
router.put('/ledger/:id', authorizeRoles(['admin']), 
  (req, res) => FinancialController.updateLedgerEntry(req, res));

/**
 * @swagger
 * /financial/ledger/:id:
 *   delete:
 *     summary: Deleta uma entrada do livro razão
 *     tags: [Financial]
 */
router.delete('/ledger/:id', authorizeRoles(['admin']), 
  (req, res) => FinancialController.deleteLedgerEntry(req, res));

/**
 * @swagger
 * /financial/totals:
 *   get:
 *     summary: Calcula totais financeiros (DRE)
 *     tags: [Financial]
 */
router.get('/totals', authorizeRoles(['admin', 'provider']), 
  (req, res) => FinancialController.getFinancialTotals(req, res));

/**
 * @swagger
 * /financial/settings:
 *   get:
 *     summary: Busca configurações financeiras globais
 *     tags: [Financial]
 */
router.get('/settings', authorizeRoles(['admin']), 
  (req, res) => FinancialController.getCompanySettings(req, res));

/**
 * @swagger
 * /financial/settings:
 *   put:
 *     summary: Atualiza configurações financeiras globais
 *     tags: [Financial]
 */
router.put('/settings', authorizeRoles(['admin']), 
  (req, res) => FinancialController.updateCompanySettings(req, res));

/**
 * @swagger
 * /financial/commission-rules:
 *   post:
 *     summary: Cria regra de comissão
 *     tags: [Financial]
 */
router.post('/commission-rules', authorizeRoles(['admin']), 
  (req, res) => FinancialController.createCommissionRule(req, res));

/**
 * @swagger
 * /financial/commission-rules:
 *   get:
 *     summary: Busca regras de comissão
 *     tags: [Financial]
 */
router.get('/commission-rules', authorizeRoles(['admin', 'provider']), 
  (req, res) => FinancialController.getCommissionRules(req, res));

/**
 * @swagger
 * /financial/expenses:
 *   post:
 *     summary: Cria despesa
 *     tags: [Financial]
 */
router.post('/expenses', authorizeRoles(['admin']), 
  (req, res) => FinancialController.createExpense(req, res));

/**
 * @swagger
 * /financial/expenses:
 *   get:
 *     summary: Busca despesas
 *     tags: [Financial]
 */
router.get('/expenses', authorizeRoles(['admin', 'provider']), 
  (req, res) => FinancialController.getExpenses(req, res));

/**
 * @swagger
 * /financial/schedules:
 *   get:
 *     summary: Busca valores de schedules finalizados e agendados
 *     tags: [Financial]
 */
router.get('/schedules', authorizeRoles(['admin', 'provider']), 
  (req, res) => FinancialController.getScheduleFinancialData(req, res));

module.exports = router;
