const purchaseRepository = require("../repositories/purchase.repository.js");
const saleRepository = require("../repositories/sale.repository.js")

const purchaseRespo = new purchaseRepository();
const saleRespo = new saleRepository();

module.exports = class purchase_saleController{

    async findAllPurchse( request, response ){

        const { limit, base } = request.body

        try{

            const result = await purchaseRespo.findAllPurchse( limit, base )
            return response.status(201).json({result})
    
    
        }catch(erro){

            return response.status(500).json({"erro" : erro})
    
        }

    }

    async findAllSale( request, response ){

        const { limit, base } = request.body

        try{

            const result = await saleRespo.findAllSale( limit, base )
            return response.status(201).json({result})
    
    
        }catch(erro){
            return response.status(500).json({"erro" : erro})
    
        }

    }
    
    async findPurchase( request, response ) {

        const { id } = request.body 

        try{

            if( id ){

                const result = await purchaseRespo.findPurchase( id )
                return response.status(201).json({result})

            }

            return response.status(404)
    
        }catch(erro){

            return response.status(500).json({"erro" : erro})
    
        }

    }

    async findSale( request, response ) {

        const { id } = request.body 

        try{

            if( id ){

                const result = await saleRespo.findSale( id )
                return response.status(201).json({result})

            }

            return response.status(404)
    
        }catch(erro){

            return response.status(500).json({"erro" : erro})
    
        }
    }

    async findSaleAccount( request, response ) {

        const { cpf } = request.body;
    
        try{
            if( cpf ){
                await saleRespo.findSaleAccount(cpf);
                return response.status(201).send()
            }
            return response.status(404)
        }
        catch(erro){
            return response.status(501).json({"erro" : erro})  

        } 

    }

    async findPurchaseAccount( request, response ) {

        const cpf = request.body;
    
        try{

            if( cpf ){ 
                await purchaseRespo.findPurchaseAccount(cpf);
                return response.status(201).send()
            }

            return response.status(404)

        }
        catch(erro){

            return response.status(501).json({"erro" : erro})  

        } 

    }
        
    async addPurchase( request, response ) {

        const sale = request.body;
    
        try{
            
            if( sale ){

                await purchaseRespo.addPurchase(sale);
                return response.status(201).send()
            }

            return response.status( 404 )
    
        }
        catch(erro){
    
            return response.status(501).json({"erro" : erro})  
            
        } 

    }

    async addSale( request, response ) {

        const sale = request.body;
    
        try{
            
            if( sale ){

                await saleRespo.addSale(sale);
                return response.status(201).send()
            }
            return response.status(404)
            
        }
        catch(erro){
    
            return response.status(501).json({"erro" : erro})  
            
        }

    }
        
    async deletePurchase( request, response ) {

        const { id } = request.body

        try{

            if( id ){

                await purchaseRespo.deletePurchase(sale);
                return response.status(201).send()

            }

            return response.status(404)
    
        }
        catch(erro){
    
            return response.status(501).json({"erro" : erro})  
            
        }

    }

    async deleteSale( request, response ) {

        const { id } = request.body

        try{

            if( id ){

                await saleRespo.deletePurchase(sale);
                return response.status(201).send()

            }

            return response.status(404)
    
        }
        catch(erro){
    
            return response.status(501).json({"erro" : erro})  
            
        }

    }
}

