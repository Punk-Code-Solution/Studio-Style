const { Router } = require('express');
const { body } = require('express-validator');
const AccountController = require('../controllers/account.controller');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const { handleValidationErrors } = require('../middlewares/validation');

const router = Router();
const accountController = new AccountController();

// Validation rules
const accountValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('cpf').notEmpty().withMessage('CPF is required'),
  handleValidationErrors
];

const hairValidation = [
  body('name').notEmpty().withMessage('Hair type name is required'),
  handleValidationErrors
];

const typeAccountValidation = [
  body('name').notEmpty().withMessage('Type account name is required'),
  handleValidationErrors
];

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Get all accounts
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Accounts retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, accountController.getAllAccounts.bind(accountController));

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     summary: Create a new account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - cpf
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               cpf:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticateToken, accountValidation, accountController.createAccount.bind(accountController));

/**
 * @swagger
 * /api/accounts/{id}:
 *   get:
 *     summary: Get account by ID
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account retrieved successfully
 *       404:
 *         description: Account not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authenticateToken, accountController.getAccountById.bind(accountController));

/**
 * @swagger
 * /api/accounts/{id}:
 *   put:
 *     summary: Update account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               cpf:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account updated successfully
 *       404:
 *         description: Account not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', authenticateToken, accountValidation, accountController.updateAccount.bind(accountController));

/**
 * @swagger
 * /api/accounts/{id}:
 *   delete:
 *     summary: Delete account by ID
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       404:
 *         description: Account not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authenticateToken, accountController.deleteAccountById.bind(accountController));

/**
 * @swagger
 * /api/accounts/cpf/{cpf}:
 *   get:
 *     summary: Get account by CPF
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cpf
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account retrieved successfully
 *       404:
 *         description: Account not found
 *       401:
 *         description: Unauthorized
 */
router.get('/cpf/:cpf', authenticateToken, accountController.getAccountByCpf.bind(accountController));

/**
 * @swagger
 * /api/accounts/cpf/{cpf}:
 *   delete:
 *     summary: Delete account by CPF
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cpf
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       404:
 *         description: Account not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/cpf/:cpf', authenticateToken, accountController.deleteAccountByCpf.bind(accountController));

// Hair types routes
/**
 * @swagger
 * /api/accounts/hair:
 *   get:
 *     summary: Get all hair types
 *     tags: [Hair Types]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hair types retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/hair', authenticateToken, accountController.getAllHair.bind(accountController));

/**
 * @swagger
 * /api/accounts/hair:
 *   post:
 *     summary: Create a new hair type
 *     tags: [Hair Types]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Hair type created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/hair', authenticateToken, hairValidation, accountController.createHair.bind(accountController));

/**
 * @swagger
 * /api/accounts/hair/{id}:
 *   put:
 *     summary: Update hair type
 *     tags: [Hair Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Hair type updated successfully
 *       404:
 *         description: Hair type not found
 *       401:
 *         description: Unauthorized
 */
router.put('/hair/:id', authenticateToken, hairValidation, accountController.updateHair.bind(accountController));

/**
 * @swagger
 * /api/accounts/hair/{id}:
 *   delete:
 *     summary: Delete hair type
 *     tags: [Hair Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hair type deleted successfully
 *       404:
 *         description: Hair type not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/hair/:id', authenticateToken, accountController.deleteHair.bind(accountController));

// Type accounts routes
/**
 * @swagger
 * /api/accounts/type-accounts:
 *   get:
 *     summary: Get all type accounts
 *     tags: [Type Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Type accounts retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/type-accounts', authenticateToken, accountController.getAllTypeAccounts.bind(accountController));

/**
 * @swagger
 * /api/accounts/type-accounts:
 *   post:
 *     summary: Create a new type account
 *     tags: [Type Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Type account created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/type-accounts', authenticateToken, typeAccountValidation, accountController.createTypeAccount.bind(accountController));

/**
 * @swagger
 * /api/accounts/type-accounts/{id}:
 *   put:
 *     summary: Update type account
 *     tags: [Type Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Type account updated successfully
 *       404:
 *         description: Type account not found
 *       401:
 *         description: Unauthorized
 */
router.put('/type-accounts/:id', authenticateToken, typeAccountValidation, accountController.updateTypeAccount.bind(accountController));

/**
 * @swagger
 * /api/accounts/type-accounts/{id}:
 *   delete:
 *     summary: Delete type account
 *     tags: [Type Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Type account deleted successfully
 *       404:
 *         description: Type account not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/type-accounts/:id', authenticateToken, accountController.deleteTypeAccount.bind(accountController));

// Email routes
/**
 * @swagger
 * /api/accounts/emails:
 *   get:
 *     summary: Get all emails
 *     tags: [Emails]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Emails retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/emails', authenticateToken, accountController.getAllEmails.bind(accountController));

/**
 * @swagger
 * /api/accounts/emails/{id}:
 *   delete:
 *     summary: Delete email
 *     tags: [Emails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email deleted successfully
 *       404:
 *         description: Email not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/emails/:id', authenticateToken, accountController.deleteEmail.bind(accountController));

module.exports = router;
