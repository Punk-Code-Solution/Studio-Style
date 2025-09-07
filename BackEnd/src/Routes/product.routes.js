const { Router } = require("express");
const rota = Router()
const { authorizeRoles } = require('../middlewares/auth');
const ProductController = require("../controllers/product.controller");
const productcontroller = new ProductController()

//OK
// async function verifyIfExistsProductId(request, response, next){

//     const  product  = request.body;

//     try{

//         const result = await productcontroller.findProductExist(product);
//         if(!result){

//             return response.status(500).json({"erro" : "Not Found"})

//         }        

//         return next();

//     }catch(erro){

//         return response.status(400).json({ "error": erro});

//     }    

// }
//Adicionar um produto
/**
 * @swagger
 * /api/product:
 *   post:
 *     summary: Adiciona um novo produto
 *     tags:
 *       - Produtos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Produto criado com sucesso
 *       400:
 *         description: Erro na requisição
 */
rota.post("/product", productcontroller.addProduct.bind(productcontroller));

/**
 * @swagger
 * /api/product:
 *   put:
 *     summary: Edita um produto existente
 *     tags:
 *       - Produtos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Produto atualizado com sucesso
 *       400:
 *         description: Erro na requisição
 */
rota.put("/product", async (request, response) => { await productcontroller.updateProduct( request, response ); });

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Busca todos os produtos
 *     tags:
 *       - Produtos
 *     responses:
 *       200:
 *         description: Lista de produtos
 *       400:
 *         description: Erro na requisição
 */
rota.get("/", productcontroller.findAll.bind(productcontroller));

/**
 * @swagger
 * /api/product:
 *   get:
 *     summary: Busca um produto
 *     tags:
 *       - Produtos
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Produto encontrado
 *       404:
 *         description: Produto não encontrado
 */
rota.get("/product", async (request, response) => { await productcontroller.findProduct( request, response ); });

/**
 * @swagger
 * /api/product:
 *   delete:
 *     summary: Deleta um produto
 *     tags:
 *       - Produtos
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Produto deletado com sucesso
 *       404:
 *         description: Produto não encontrado
 */
rota.delete("/product", async (request, response) => { await productcontroller.deleteProduct( request, response ); });

module.exports = rota