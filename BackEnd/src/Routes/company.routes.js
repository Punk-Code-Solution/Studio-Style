const { Router } = require('express');
const CompanyController = require('../controllers/Company.controller');
const { authorizeRoles } = require('../middlewares/auth');
const { handleValidationErrors } = require('../middlewares/validation');

const router = Router();
const companyController = new CompanyController();

/**
 * @swagger
 * /api/company:
 *   get:
 *     summary: Buscar todas as empresas
 *     tags:
 *       - Company
 *     responses:
 *       200:
 *         description: Lista de empresas retornada com sucesso
 */
router.get('/', companyController.getAllCompanies.bind(companyController));

/**
 * @swagger
 * /api/company/id:
 *   get:
 *     summary: Buscar uma empresa pelo ID
 *     tags:
 *       - Company
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da empresa
 *     responses:
 *       200:
 *         description: Empresa retornada com sucesso
 *       404:
 *         description: Empresa não encontrada
 */
router.get("/company/id", async ( request, response ) => { await companyController.getCompanyId( request, response ) })

/**
 * @swagger
 * /api/company:
 *   post:
 *     summary: Criar uma empresa
 *     tags:
 *       - Company
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               cnpj:
 *                 type: string
 *     responses:
 *       201:
 *         description: Empresa criada com sucesso
 */
router.post("/company", async (request, response) => { await companyController.createCompany( request, response ) })

/**
 * @swagger
 * /api/company:
 *   put:
 *     summary: Atualizar uma empresa
 *     tags:
 *       - Company
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               nome:
 *                 type: string
 *               cnpj:
 *                 type: string
 *     responses:
 *       200:
 *         description: Empresa atualizada com sucesso
 *       404:
 *         description: Empresa não encontrada
 */
router.put("/company", async (request, response) => { await companyController.updateCompany( request, response ) })

module.exports = router;