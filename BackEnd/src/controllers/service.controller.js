const serviceRepository = require("../repositories/service.repository.js");
const serviceRespo = new serviceRepository();

module.exports = class serviceController{

    async findAll(request, response){
        try{
            // Aceita tanto GET (query) quanto POST (body) para compatibilidade
            const limitValue = request.query.limit || request.body.limit;
            const baseValue = request.query.base || request.body.base;
            
            const limit = limitValue ? parseInt(limitValue, 10) : 100;
            const base = baseValue ? parseInt(baseValue, 10) : 0;
            
            // Validar que limit e base são números válidos
            if (isNaN(limit) || limit < 1) {
                return response.status(400).json({
                    success: false,
                    message: "Invalid limit parameter. Must be a positive integer."
                });
            }
            
            if (isNaN(base) || base < 0) {
                return response.status(400).json({
                    success: false,
                    message: "Invalid base parameter. Must be a non-negative integer."
                });
            }
            
            const result = await serviceRespo.findAll(limit, base);
            
            // Não logar o resultado completo em produção para evitar problemas
            if (result && result.length > 0) {
                console.log('First service sample:', JSON.stringify(result[0], null, 2));
            }
            
            return response.status(200).json({result: result || []})
    
        }catch(erro){
            console.error("Erro ao buscar serviços:", erro);
            // Log detalhado do erro para debug em produção
            const errorMessage = erro.message || (typeof erro === 'string' ? erro : JSON.stringify(erro));
            console.error("Stack trace:", erro.stack);
            
            // Verificar se é um erro de conexão com o banco de dados
            if (erro.name === 'SequelizeConnectionError' || erro.name === 'SequelizeDatabaseError') {
                return response.status(503).json({
                    success: false,
                    message: "Database connection error. Please try again later.",
                    error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
                });
            }
            
            return response.status(500).json({
                success: false,
                message: "Failed to retrieve services",
                error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
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