const { Router } = require("express");
const PurchaseSaleController = require("../controllers/purchase_sale.controller");
const { authorizeRoles } = require('../middlewares/auth');
const purchase_salecontroller = new PurchaseSaleController()

const rota = Router()

/**
 * @swagger
 * /account/sale:
 *   post:
 *     summary: Adicionar venda ao colaborador
 *     tags:
 *       - Sales
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Venda adicionada com sucesso
 */
rota.post("/account/sale", purchase_salecontroller.addSale.bind(purchase_salecontroller));

/**
 * @swagger
 * /account/sale:
 *   get:
 *     summary: Buscar venda do colaborador
 *     tags:
 *       - Sales
 *     responses:
 *       200:
 *         description: Lista de vendas do colaborador
 */
rota.get("/account/sale", purchase_salecontroller.findSaleAccount.bind(purchase_salecontroller));

/**
 * @swagger
 * /sales:
 *   get:
 *     summary: Pegar todas as vendas
 *     tags:
 *       - Sales
 *     responses:
 *       200:
 *         description: Lista de todas as vendas
 */
rota.get("/sales", purchase_salecontroller.findAllSale.bind( purchase_salecontroller ) );

/**
 * @swagger
 * /sale:
 *   get:
 *     summary: Pegar uma venda
 *     tags:
 *       - Sales
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da venda
 *     responses:
 *       200:
 *         description: Detalhes da venda
 */
rota.get("/sale", purchase_salecontroller.findSale.bind( purchase_salecontroller ));

/**
 * @swagger
 * /sale:
 *   delete:
 *     summary: Deletar uma venda
 *     tags:
 *       - Sales
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da venda
 *     responses:
 *       200:
 *         description: Venda deletada com sucesso
 */
rota.delete("/sale", purchase_salecontroller.deleteSale.bind( purchase_salecontroller ))


/**
 * @swagger
 * /account/purchase:
 *   post:
 *     summary: Adicionar compra ao colaborador
 *     tags:
 *       - Purchases
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Compra adicionada com sucesso
 */
rota.post("/account/purchase", purchase_salecontroller.addSale.bind( purchase_salecontroller ));

/**
 * @swagger
 * /account/purchase:
 *   get:
 *     summary: Buscar compra do colaborador
 *     tags:
 *       - Purchases
 *     responses:
 *       200:
 *         description: Lista de compras do colaborador
 */
rota.get("/account/purchase", purchase_salecontroller.findSaleAccount.bind( purchase_salecontroller ));

/**
 * @swagger
 * /purchases:
 *   get:
 *     summary: Pegar todas as compras
 *     tags:
 *       - Purchases
 *     responses:
 *       200:
 *         description: Lista de todas as compras
 */
rota.get("/purchases", purchase_salecontroller.findAllSale.bind( purchase_salecontroller ) );

/**
 * @swagger
 * /purchase:
 *   get:
 *     summary: Pegar uma compra
 *     tags:
 *       - Purchases
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da compra
 *     responses:
 *       200:
 *         description: Detalhes da compra
 */
rota.get("/purchase", purchase_salecontroller.findSale.bind( purchase_salecontroller ));

/**
 * @swagger
 * /purchase:
 *   delete:
 *     summary: Deletar uma compra
 *     tags:
 *       - Purchases
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da compra
 *     responses:
 *       200:
 *         description: Compra deletada com sucesso
 */
rota.delete("/purchase", purchase_salecontroller.deleteSale.bind( purchase_salecontroller ));


module.exports = rota