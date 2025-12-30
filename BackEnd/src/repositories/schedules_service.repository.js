const { Schedule_Service, Service, Schedules } = require("../Database/models");
const { v4: uuidv4 } = require('uuid');

class schedules_serviceRepository{

  async findAll(limit = 10, base = 0){
    return await Schedule_Service.findAll({
        limit: limit,
        offset: base,
        include: [
            { model: Service, as: 'service' },
            { model: Schedules, as: 'schedule' }
        ]
    });
  }

  async findSchedule_Service(id) {
    return await Schedule_Service.findOne({ 
      where:{
        id : id
      }
     });
  }
    
  async addSchedule_Service(schedules_id, services, transaction = null) {
    if (!Array.isArray(services) || services.length === 0) {
      return false;
    }

    try {
      // Primeiro, remover todas as relações existentes para este agendamento (limpeza antes de atualizar)
      await Schedule_Service.destroy({
        where: { schedules_id },
        transaction
      });

      // Criar array de objetos para bulkCreate
      const scheduleServicesData = services.map(serviceId => ({
        id: uuidv4(),
        schedules_id: schedules_id,
        service_id: serviceId
      }));

      // Adiciona todos os relacionamentos de uma só vez
      const result = await Schedule_Service.bulkCreate(scheduleServicesData, {
        transaction
      });
      return result;
    } catch (error) {
      console.error("Erro ao adicionar serviços ao agendamento:", error);
      return false;
    }
  }
    
  async updateSchedule_Service(data) {
      // Esse método geralmente não é usado para Tabelas Pivô (nós deletamos e recriamos), 
      // mas mantendo estrutura básica se necessário no futuro.
      return false; 
  }
    
  /**
   * Deleta serviços.
   * Se deleteBySchedule = true, o 'id' passado é interpretado como 'schedules_id'
   * e deleta TODOS os serviços daquele agendamento.
   */
  async deleteSchedule_Service(id, serviceId = null, deleteBySchedule = false) {
    try {
        let whereClause = {};

        if (deleteBySchedule) {
            // Deleta todas as conexões de um agendamento específico
            whereClause = { schedules_id: id };
        } else {
            // Deleta uma conexão específica pelo ID da tabela pivô
            whereClause = { id: id };
        }

        await Schedule_Service.destroy({
            where: whereClause
        });
        return true;
    } catch (error) {
        console.error("Erro ao deletar schedule_service:", error);
        return false;
    }
  }
}

module.exports = schedules_serviceRepository;