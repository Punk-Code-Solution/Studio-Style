const SchedulesRepository = require('../repositories/schedules.repository');
const ServiceRepository = require('../repositories/service.repository');
const ResponseHandler = require('../utils/responseHandler');
const Schedules_Service = require('../repositories/schedules_service.repository');

class SchedulesController {

    constructor() {
        this.schedulesRepository = new SchedulesRepository();
        this.servicesRepository = new ServiceRepository();
    }

    /**
   * Create a new account
   */
  async createSchedules(req, res) {
    try {
      
      if (true) {

        const schedules = req.body;
        const result = await this.schedulesRepository.addSchedules(schedules);

        console.log("resulte: ", result.dataValues.id)


        
        return ResponseHandler.success(res, 201, 'Service created successfully', result);
      } else {
        return ResponseHandler.error(res, 400, 'Failed to create service');
      }
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to create service', error);
    }
  }

  /**
   * Get all accounts
   */
  async getAllSchedules(req, res) {
    try {
      const result = await this.schedulesRepository.findAll();
      return ResponseHandler.success(res, 200, 'Service retrieved successfully', result);
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to retrieve services', error);
    }
  }

  /**
   * Get account by ID
   */
  async getSchedulesById(req, res) {
    try {
      const { id } = req.params;
      const result = await this.schedulesRepository.findSchedules(id);
      
      if (!result) {
        return ResponseHandler.notFound(res, 'Service not found');
      }
      
      return ResponseHandler.success(res, 200, 'Service retrieved successfully', result);
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to retrieve services', error);
    }
  }

  /**
   * Update account
   */
  async updateSchedule(req, res) {
    try {
      const { id } = req.params;
      const accountData = req.body;
      
      // Hash password if provided
      if (accountData.password) {
        accountData.password = await bcrypt.hash(accountData.password, 10);
      }
      
      const result = await this.schedulesRepository.updateAccount(id, accountData);
      
      if (!result) {
        return ResponseHandler.notFound(res, 'Service not found');
      }
      
      return ResponseHandler.success(res, 200, 'Service updated successfully', result);
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to update service', error);
    }
  }

  /**
   * Delete account by ID
   */
  async deleteScheduleById(req, res) {
    try {
      const { id } = req.params;
      const result = await this.schedulesRepository.deleteAccountById(id);
      
      if (!result) {
        return ResponseHandler.notFound(res, 'Service not found');
      }
      
      return ResponseHandler.success(res, 200, 'Service deleted successfully');
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to delete services', error);
    }
  }

}
module.exports = SchedulesController;