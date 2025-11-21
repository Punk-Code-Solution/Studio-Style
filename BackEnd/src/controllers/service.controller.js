const serviceRepository = require("../repositories/service.repository.js");
const serviceRespo = new serviceRepository();

module.exports = class serviceController{

    async findAll(request, response){
        try{
            // Aceita tanto GET (query) quanto POST (body) para compatibilidade
            const limit = request.query.limit || request.body.limit ? 
                parseInt(request.query.limit || request.body.limit) : 100;
            const base = request.query.base || request.body.base ? 
                parseInt(request.query.base || request.body.base) : 0;
            
            console.log('Finding services with limit:', limit, 'base:', base);
            const result = await serviceRespo.findAll(limit, base);
            console.log('Services found:', result?.length || 0);
            console.log('Services data:', JSON.stringify(result, null, 2));
            
            return response.status(200).json({result: result || []})
    
        }catch(erro){
            console.error("Erro ao buscar serviços:", erro);
            // Log detalhado do erro para debug em produção
            const errorMessage = erro.message || (typeof erro === 'string' ? erro : JSON.stringify(erro));
            console.error("Stack trace:", erro.stack);
            return response.status(500).json({
                success: false,
                message: "Failed to retrieve services",
                error: errorMessage
            })
        }
    }
  
    async findService(request, response) {        
        try{
            // CORREÇÃO: Ler ID da query string
            const id = request.query.id || request.query.service;
            
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
            const { id } = request.query; // CORREÇÃO: Delete via query
            const result = await serviceRespo.deleteService(id);
            return response.status(200).json({"Sucess": "Deleted successfully"});
        }catch(erro){
            return response.status(500).json({"erro" : erro});
        }
    }

    async findServiceStatus(request, response){
        try{
            const status = request.query.status; // CORREÇÃO: Ler de query
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