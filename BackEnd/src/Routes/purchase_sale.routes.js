const { Router } = require("express");
const PurchaseSaleController = require("../controllers/purchase_sale.controller");
const { authorizeRoles } = require('../middlewares/auth');
const purchase_salecontroller = new PurchaseSaleController()

const rota = Router()

// --- SALES ---
/**
 * @swagger
 * /account/sale:
 * post:
 * summary: Adicionar venda
 */
rota.post("/account/sale", purchase_salecontroller.addSale.bind(purchase_salecontroller));

/**
 * @swagger
 * /account/sale:
 * get:
 * summary: Buscar vendas por conta
 */
rota.get("/account/sale", purchase_salecontroller.findSaleAccount.bind(purchase_salecontroller));

/**
 * @swagger
 * /sales:
 * get:
 * summary: Listar todas as vendas
 */
rota.get("/sales", purchase_salecontroller.findAllSale.bind(purchase_salecontroller));

/**
 * @swagger
 * /sale:
 * get:
 * summary: Buscar venda por ID
 */
rota.get("/sale", purchase_salecontroller.findSale.bind(purchase_salecontroller));

/**
 * @swagger
 * /sale:
 * delete:
 * summary: Deletar venda
 */
rota.delete("/sale", purchase_salecontroller.deleteSale.bind(purchase_salecontroller));


// --- PURCHASES (CORRIGIDO) ---
/**
 * @swagger
 * /account/purchase:
 * post:
 * summary: Adicionar compra
 */
// CORREÇÃO: Aponta para addPurchase
rota.post("/account/purchase", purchase_salecontroller.addPurchase.bind(purchase_salecontroller));

/**
 * @swagger
 * /account/purchase:
 * get:
 * summary: Buscar compras por conta
 */
// CORREÇÃO: Aponta para findPurchaseAccount
rota.get("/account/purchase", purchase_salecontroller.findPurchaseAccount.bind(purchase_salecontroller));

/**
 * @swagger
 * /purchases:
 * get:
 * summary: Listar todas as compras
 */
// CORREÇÃO: Aponta para findAllPurchse
rota.get("/purchases", purchase_salecontroller.findAllPurchse.bind(purchase_salecontroller));

/**
 * @swagger
 * /purchase:
 * get:
 * summary: Buscar compra por ID
 */
// CORREÇÃO: Aponta para findPurchase
rota.get("/purchase", purchase_salecontroller.findPurchase.bind(purchase_salecontroller));

/**
 * @swagger
 * /purchase:
 * delete:
 * summary: Deletar compra
 */
// CORREÇÃO: Aponta para deletePurchase
rota.delete("/purchase", purchase_salecontroller.deletePurchase.bind(purchase_salecontroller));

module.exports = rota;