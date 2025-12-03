const purchaseRepository = require("../repositories/purchase.repository.js");
const saleRepository = require("../repositories/sale.repository.js")

const purchaseRespo = new purchaseRepository();
const saleRespo = new saleRepository();

module.exports = class purchase_saleController{

    // PURCHASES
    async findAllPurchse( request, response ){
        // GET usa query, não body
        const { limit, base } = request.query; 
        try{
            // CORREÇÃO: Chama findAll (nome correto no repo)
            const result = await purchaseRespo.findAll(limit, base)
            return response.status(200).json({result})
        }catch(erro){
            return response.status(500).json({"erro" : erro})
        }
    }

    async findPurchase( request, response ) {
        // GET usa query
        const { id } = request.query; 
        try{
            if( id ){
                const result = await purchaseRespo.findPurchase( id )
                return response.status(200).json({result})
            }
            return response.status(400).json({ error: "ID is required" })
        }catch(erro){
            return response.status(500).json({"erro" : erro})
        }
    }

    async findPurchaseAccount( request, response ) {
        const { cpf } = request.query; // GET usa query
        try{
            if( cpf ){ 
                // CORREÇÃO: Retorna o resultado encontrado
                const result = await purchaseRespo.findPurchaseAccount(cpf);
                return response.status(200).json({ result })
            }
            return response.status(400).json({ error: "CPF is required" })
        }
        catch(erro){
            return response.status(500).json({"erro" : erro})  
        } 
    }

    async addPurchase( request, response ) {
        const purchase = request.body;
        try{
            if( purchase ){
                await purchaseRespo.addPurchase(purchase);
                return response.status(201).json({ message: "Purchase added" })
            }
            return response.status(400).json({ error: "Data required" })
        }
        catch(erro){
            return response.status(500).json({"erro" : erro})  
        } 
    }

    async deletePurchase( request, response ) {
        const { id } = request.query; // DELETE usa query
        try{
            if( id ){
                // CORREÇÃO: Passa 'id', não a variável inexistente 'sale'
                await purchaseRespo.deletePurchase(id);
                return response.status(200).json({"Success": "Deleted"})
            }
            return response.status(400).json({ error: "ID required" })
        }
        catch(erro){
            return response.status(500).json({"erro" : erro})  
        }
    }

    // SALES
    async findAllSale( request, response ){
        const { limit, base } = request.query;
        try{
            // CORREÇÃO: Chama findAllSaleLimit
            const result = await saleRespo.findAllSaleLimit( limit, base )
            return response.status(200).json({result})
        }catch(erro){
            console.log( erro )
            return response.status(500).json({"erro" : erro})
        }
    }
    
    async findSale( request, response ) {
        const { id } = request.query; 
        try{
            if( id ){
                const result = await saleRespo.findSale( id )
                return response.status(200).json({result})
            }
            return response.status(400).json({ error: "ID required" })
        }catch(erro){
            return response.status(500).json({"erro" : erro})
        }
    }

    async findSaleAccount( request, response ) {
        const { cpf } = request.query;
        try{
            if( cpf ){
                // CORREÇÃO: Retorna o resultado
                const result = await saleRespo.findSaleAccount(cpf);
                return response.status(200).json({ result })
            }
            return response.status(400).json({ error: "CPF required" })
        }
        catch(erro){
            console.log(erro)
            return response.status(500).json({"erro" : erro})  
        } 
    }
        
    async addSale( request, response ) {
        const sale = request.body;
        try{
            if( sale ){
                await saleRespo.addSale(sale);
                return response.status(201).json({ message: "Sale added" })
            }
            return response.status(400).json({ error: "Data required" })
        }
        catch(erro){
            return response.status(500).json({"erro" : erro})  
        }
    }
        
    async deleteSale( request, response ) {
        const { id } = request.query;
        try{
            if( id ){
                // CORREÇÃO: Passa 'id', não 'sale', e chama deleteSale
                await saleRespo.deleteSale(id);
                return response.status(200).json({"Success": "Deleted"})
            }
            return response.status(400).json({ error: "ID required" })
        }
        catch(erro){
            return response.status(500).json({"erro" : erro})  
        }
    }
}