const { Router } = require("express");
const rota = Router()
const { authorizeRoles } = require('../middlewares/auth');
const SchedulesController = require("../controllers/schedules.controller");
const schedulesController = new SchedulesController()

/**
 * @swagger
 * /schedules:
 *   post:
 *     summary: Cria um novo schedules
 *     tags:
 *       - Schedules
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Schedules criado com sucesso
 *       400:
 *         description: Erro na requisição
 */
rota.post("/", async (request, response) => { await schedulesController.createSchedules( request, response ); });

/**
 * @swagger
 * /schedules:
 *   put:
 *     summary: Atualiza um serviço existente
 *     tags:
 *       - Schedules
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
rota.put("/",  async (request, response) => {  await schedulesController.updateSchedule( request, response ); });

/**
 * @swagger
 * /schedules:
 *   get:
 *     summary: Retorna todos os serviços
 *     tags:
 *       - Schedules
 *     responses:
 *       200:
 *         description: Lista de serviços
 */
rota.get("/", async (request, response) => { await schedulesController.getAllSchedules( request, response ) });

/**
 * @swagger
 * /schedules/id:
 *   get:
 *     summary: Retorna um serviço específico
 *     tags:
 *       - Schedules
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
rota.get("/schedules/id", async (request, response) => { await schedulesController.getSchedulesById( request, response ); });

/**
 * @swagger
 * /schedules:
 *   delete:
 *     summary: Deleta um serviço
 *     tags:
 *       - Schedules
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
rota.delete("/", async (request, response) => { await schedulesController.deleteScheduleById(request, response); });

module.exports = rota