const ProductRepositoryRespo = require("../repositories/product.repository");
const ResponseHandler = require('../utils/responseHandler');


class ProductController{

    constructor() {
        this.productRespo = new ProductRepositoryRespo();
    }

    async findAll( req, res) {
  
        try{

        const result = await this.productRespo.findAll()
        return ResponseHandler.success(res, 200, "Produtos", result )
    
        }catch(erro){
        return ResponseHandler.error(res, 500, "Faild", erro)

        }

  }
  
    async findProduct(request, response) {

        try{

            const { id } = request.body
            const result = await productRespo.findProduct(id)
            return response.status(201).json({result})

        }catch(erro){

            return response.status(500).json({"erro" : erro})
            
        }
    }

    async findProductExist( request, response) {

        if( id ){
            
            const { id } = request.body
            const result = await productRespo.findProduct( id );
            if( result ){

                return true

            }
            return null

        }

        return null
    }
        
    async addProduct(request, response) {
        
        try{

            const  product = request.body;
            await productRespo.addProduct(product);
            return response.status(201).send()

        }
        catch(erro){

            return response.status(501).json({"erro" : erro}) 

        }    

    }
        
    async updateProduct(request, response) {
        
        try{

            const product = request.body;    
            const  newProduct = await productRespo.updateProduct(product);    
            return response.status(201).json({newProduct});
    
        }catch( erro ){
    
            return response.status(501).json({"erro" : erro})  
    
        }
    }
        
    async deleteProduct(request, response) {
        
        
        try{

            const { id } = request.body;
            await productRespo.deleteProduct(id);
            return response.status(200).json({"Sucess": "sucess"});

        }catch(erro){
        
            return response.status(500).json({"erro" : erro});

        } 
    }
}

module.exports = ProductController;
