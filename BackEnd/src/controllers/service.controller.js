const serviceRepository = require("../repositories/service.repository.js");
const serviceRespo = new serviceRepository();

module.exports = class serviceController{

    async findAll(request, response){

        try{
            // CORREÇÃO: Em requisições GET, os parâmetros vêm em 'query', não em 'body'
            const limit = request.query.limit ? parseInt(request.query.limit) : 100;
            const base = request.query.base ? parseInt(request.query.base) : 0;
            
            const result = await serviceRespo.findAll(limit, base)
            return response.status(201).json({result})
    
        }catch(erro){
            console.error("Erro ao buscar serviços:", erro);
            return response.status(500).json({"erro" : erro.message || erro})
        }
    }
  
    async findService(request, response) {        
        try{
            // CORREÇÃO: Usar query params para GET
            const id = request.query.id || request.query.service; // Suporta ambos
            
            if (!id) {
                 return response.status(400).json({"erro": "ID is required"});
            }

            const result = await serviceRespo.findService(id)
            return response.status(201).json({result})

        }catch(erro){
            return response.status(500).json({"erro" : erro})
        }
    }
        
    async addService(request, response) {
        const newService = request.body;
        try{
            const result = await serviceRespo.addService( newService );
            if( result ){
                return response.status(201).json( { "result" : result } )
            }
            return response.status(400).json({ "result" : "something is wrong" })
        }
        catch(erro){
            return response.status(501).json({"erro" : erro}) 
        }    
    }
        
    async updateService(request, response) {
        try{
            const service = request.body;
            const  newService = await serviceRespo.updateService(service);
            return response.status(201).json({newService});
        }
        catch(erro){
            return response.status(501).json({"erro" : erro}) 
        }
    }
        
    async deleteService(request, response) {
        try{
            const { id } = request.query; // Delete geralmente usa query param
            const result = await serviceRespo.deleteService(id);
            // O repositório retorna o número de linhas deletadas ou o objeto? 
            // Assumindo que retorna algo truthy se funcionou
            return response.status(200).json({"Sucess": "Deleted successfully"});
        }catch(erro){
            return response.status(500).json({"erro" : erro});
        }
    }

    async findServiceStatus(request, response){
        try{
            // GET request usa query
            const status = request.query.status;
            const all = await serviceRespo.findServiceStatus(status);    
            if(!all || !all[0]){
                return response.status(200).json({"erro": "Not Found"});
            }
            return response.status(200).json({"Veiclhes": all});
        }catch(erro){
            return response.status(500).json({"erro" : erro})
        }
    }
}