const { Router } = require("express");
const rota = Router()
const { authorizeRoles } = require('../middlewares/auth');
const ServiceController = require("../controllers/service.controller");
const servicecontroller = new ServiceController()

/**
 * @swagger
 * /service:
 *   post:
 *     summary: Cria um novo serviço
 *     tags:
 *       - Service
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Serviço criado com sucesso
 *       400:
 *         description: Erro na requisição
 */
rota.post("/", async (request, response) => { await servicecontroller.addService( request, response ); });

/**
 * @swagger
 * /service:
 *   put:
 *     summary: Atualiza um serviço existente
 *     tags:
 *       - Service
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Serviço atualizado com sucesso
 *       400:
 *         description: Erro na requisição
 */
rota.put("/",  async (request, response) => {  await servicecontroller.updateService( request, response ); });

/**
 * @swagger
 * /service:
 *   get:
 *     summary: Retorna todos os serviços
 *     tags:
 *       - Service
 *     responses:
 *       200:
 *         description: Lista de serviços
 */
rota.get("/", async (request, response) => { await servicecontroller.findAll( request, response ) });

/**
 * @swagger
 * /service/one:
 *   get:
 *     summary: Retorna um serviço específico
 *     tags:
 *       - Service
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do serviço
 *     responses:
 *       200:
 *         description: Serviço encontrado
 *       404:
 *         description: Serviço não encontrado
 */
rota.get("/one", async (request, response) => { await servicecontroller.findService( request, response ); });

/**
 * @swagger
 * /service:
 *   delete:
 *     summary: Deleta um serviço
 *     tags:
 *       - Service
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do serviço
 *     responses:
 *       200:
 *         description: Serviço deletado com sucesso
 *       404:
 *         description: Serviço não encontrado
 */
rota.delete("/", async (request, response) => { await servicecontroller.deleteService( request, response ); });

/**
 * @swagger
 * /service/status:
 *   get:
 *     summary: Retorna status dos serviços
 *     tags:
 *       - Service
 *     responses:
 *       200:
 *         description: Status dos serviços
 */
rota.get("/status", async (request, response) =>{ await servicecontroller.findServiceStatus( request, response ); })

module.exports = rota