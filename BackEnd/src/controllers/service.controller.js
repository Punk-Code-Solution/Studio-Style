const serviceRepository = require("../repositories/service.repository.js");
const serviceRespo = new serviceRepository();

module.exports = class serviceController{

    async findAll(request, response){

        try{

            const { limit, base } = request.body
            const result = await serviceRespo.findAll(limit, base)
            return response.status(201).json({result})
    
        }catch(erro){

            return response.status(500).json({"erro" : erro})

        }
    }
  
    async findService(request, response) {        

        try{

            const { service } = request.headers
            const result = await serviceRespo.findService(service)
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

            const { id } = request.query;
            const result = await serviceRespo.deleteService(id);
            if (!result) {
                return response.status(404).json({"erro": "Service not found"});
            }
            return response.status(200).json({"Sucess": "Deleted successfully"});

        }catch(erro){
            
            return response.status(500).json({"erro" : erro});

        }
    }

    async findServiceStatus(request, response){

        

        try{
            
            const { status } = request.body;
            const all = await serviceRespo.findServiceStatus(status);    
            if(!all[0]){
                return response.status(200).json({"erro": "Not Found"});
            }
    
            return response.status(200).json({"Veiclhes": all});
    
        }catch(erro){

            return response.status(500).json({"erro" : erro})

        }

    }
}