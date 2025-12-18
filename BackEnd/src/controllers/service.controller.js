const serviceRepository = require("../repositories/service.repository.js");
const ResponseHandler = require("../utils/responseHandler");
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
                return ResponseHandler.validationError(response, 'Invalid limit parameter. Must be a positive integer.');
            }
            
            if (isNaN(base) || base < 0) {
                return ResponseHandler.validationError(response, 'Invalid base parameter. Must be a non-negative integer.');
            }
            
            const result = await serviceRespo.findAll(limit, base);
            
            // Manter compatibilidade com testes existentes que esperam { result: [...] }
            return response.status(200).json({ result: result || [] });
    
        }catch(error){
            console.error("Erro ao buscar serviços:", error);
            
            // Verificar se é um erro de conexão com o banco de dados
            if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeDatabaseError') {
                return ResponseHandler.error(response, 503, 'Database connection error. Please try again later.', error);
            }
            
            return ResponseHandler.error(response, 500, 'Failed to retrieve services', error);
        }
    }
  
    async findService(request, response) {        
        try{
            const id = request.query.id || request.query.service || request.params.id;
            
            if (!id) {
                return ResponseHandler.validationError(response, 'Service ID is required');
            }

            const result = await serviceRespo.findService(id);
            
            if (!result) {
                return ResponseHandler.notFound(response, 'Service not found');
            }
            
            // Manter compatibilidade com testes existentes que esperam { result: {...} }
            return response.status(200).json({ result });

        }catch(error){
            console.error("Erro ao buscar serviço:", error);
            return ResponseHandler.error(response, 500, 'Failed to retrieve service', error);
        }
    }
        
    async addService(request, response) {
        try{
            const serviceData = request.body;
            
            // Validação básica de campos obrigatórios
            if (!serviceData.service || !serviceData.service.trim()) {
                return ResponseHandler.validationError(response, 'Service name is required');
            }
            
            if (serviceData.price === undefined || serviceData.price === null) {
                return ResponseHandler.validationError(response, 'Price is required');
            }
            
            if (typeof serviceData.price !== 'number' || serviceData.price < 0) {
                return ResponseHandler.validationError(response, 'Price must be a positive number');
            }
            
            if (serviceData.commission_rate !== undefined) {
                if (typeof serviceData.commission_rate !== 'number' || 
                    serviceData.commission_rate < 0 || 
                    serviceData.commission_rate > 1) {
                    return ResponseHandler.validationError(response, 'Commission rate must be a number between 0 and 1');
                }
            }
            
            if (serviceData.duration !== undefined) {
                if (typeof serviceData.duration !== 'number' || 
                    serviceData.duration < 1 || 
                    !Number.isInteger(serviceData.duration)) {
                    return ResponseHandler.validationError(response, 'Duration must be a positive integer (in minutes)');
                }
            }
            
            if (serviceData.single_per_hour !== undefined) {
                if (typeof serviceData.single_per_hour !== 'boolean') {
                    return ResponseHandler.validationError(response, 'single_per_hour must be a boolean value');
                }
            }
            
            const result = await serviceRespo.addService(serviceData);
            
            if (!result) {
                return ResponseHandler.error(response, 500, 'Failed to create service');
            }
            
            // Manter compatibilidade com testes existentes que esperam { result: {...} }
            return response.status(201).json({ result });
        }
        catch(error){
            console.error("Erro ao criar serviço:", error);
            
            // Tratar erros de constraint único
            if (error.name === 'SequelizeUniqueConstraintError') {
                return ResponseHandler.validationError(response, 'Service with this name already exists');
            }
            
            return ResponseHandler.error(response, 500, 'Failed to create service', error);
        }    
    }
        
    async updateService(request, response) {
        try{
            const serviceData = request.body;
            
            if (!serviceData.id) {
                return ResponseHandler.validationError(response, 'Service ID is required');
            }
            
            // Verificar se o serviço existe
            const existingService = await serviceRespo.findService(serviceData.id);
            if (!existingService) {
                return ResponseHandler.notFound(response, 'Service not found');
            }
            
            // Validações opcionais para campos que estão sendo atualizados
            if (serviceData.service !== undefined && !serviceData.service.trim()) {
                return ResponseHandler.validationError(response, 'Service name cannot be empty');
            }
            
            if (serviceData.price !== undefined) {
                if (typeof serviceData.price !== 'number' || serviceData.price < 0) {
                    return ResponseHandler.validationError(response, 'Price must be a positive number');
                }
            }
            
            if (serviceData.commission_rate !== undefined) {
                if (typeof serviceData.commission_rate !== 'number' || 
                    serviceData.commission_rate < 0 || 
                    serviceData.commission_rate > 1) {
                    return ResponseHandler.validationError(response, 'Commission rate must be a number between 0 and 1');
                }
            }
            
            if (serviceData.duration !== undefined) {
                if (typeof serviceData.duration !== 'number' || 
                    serviceData.duration < 1 || 
                    !Number.isInteger(serviceData.duration)) {
                    return ResponseHandler.validationError(response, 'Duration must be a positive integer (in minutes)');
                }
            }
            
            if (serviceData.single_per_hour !== undefined) {
                if (typeof serviceData.single_per_hour !== 'boolean') {
                    return ResponseHandler.validationError(response, 'single_per_hour must be a boolean value');
                }
            }
            
            const updatedService = await serviceRespo.updateService(serviceData);
            
            if (!updatedService) {
                return ResponseHandler.error(response, 500, 'Failed to update service');
            }
            
            // Manter compatibilidade com testes existentes que esperam { newService: {...} }
            return response.status(200).json({ newService: updatedService });
        }
        catch(error){
            console.error("Erro ao atualizar serviço:", error);
            
            if (error.name === 'SequelizeUniqueConstraintError') {
                return ResponseHandler.validationError(response, 'Service with this name already exists');
            }
            
            return ResponseHandler.error(response, 500, 'Failed to update service', error);
        }
    }
        
    async deleteService(request, response) {
        try{
            const id = request.query.id || request.params.id;
            
            if (!id) {
                return ResponseHandler.validationError(response, 'Service ID is required');
            }
            
            // Verificar se o serviço existe
            const existingService = await serviceRespo.findService(id);
            if (!existingService) {
                return ResponseHandler.notFound(response, 'Service not found');
            }
            
            // Verificar se há agendamentos associados
            // TODO: Implementar verificação de relacionamentos quando necessário
            
            const result = await serviceRespo.deleteService(id);
            
            if (!result) {
                return ResponseHandler.error(response, 500, 'Failed to delete service');
            }
            
            return ResponseHandler.success(response, 200, 'Service deleted successfully');
        }catch(error){
            console.error("Erro ao deletar serviço:", error);
            
            // Tratar erro de constraint de foreign key
            if (error.name === 'SequelizeForeignKeyConstraintError') {
                return ResponseHandler.error(response, 409, 'Cannot delete service because it has associated records');
            }
            
            return ResponseHandler.error(response, 500, 'Failed to delete service', error);
        }
    }

    async findServiceStatus(request, response){
        try{
            const status = request.query.status;
            
            if (!status) {
                return ResponseHandler.validationError(response, 'Status parameter is required');
            }
            
            const result = await serviceRespo.findServiceStatus(status);
            
            if (!result || result.length === 0) {
                return ResponseHandler.success(response, 200, 'No services found with this status', []);
            }
            
            return ResponseHandler.success(response, 200, 'Services retrieved successfully', result);
        }catch(error){
            console.error("Erro ao buscar serviços por status:", error);
            return ResponseHandler.error(response, 500, 'Failed to retrieve services by status', error);
        }
    }
}