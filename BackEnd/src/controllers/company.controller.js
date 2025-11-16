const companyRepository  = require("../repositories/company.repository");
const emailRepository = require("../repositories/email.repository");
const ResponseHandler = require('../utils/responseHandler');

class CompanyController {

  constructor() {
    this.companyRepo = new companyRepository();
    this.emailRepo = new emailRepository();
  }

  async createCompany(request, response) {

    const company = request.body;
  
    try{        
        const result = await companyRepo.addCompany( company );
        return response.status(201).json(result)
  
    }catch(erro){
        return response.status(500).json({"erro" : erro})
    }
  
  }

  async findAllEmail( request, response ) {

    try{

      const result = await emailRepo.findAll();
      return response.status( 201 ).json( result );

    }catch( e ){

      return response.status(500).json({"erro" : erro})

    }

  }

  async createEmail( request, response ) {

    const email = request.body;
  
    try{    

        const result = await emailRepo.createEmail( email );
        if (result && result.error) {
          return response.status(409).json({ message: 'Duplicate field', field: result.error });
        }
        return response.status(201).json( result )
  
    }catch( erro ){
        return response.status(500).json({"erro" : erro})

    }
  
  }

  async updateCompany(request, response) {

    const company = request.body;
  
    try{
      
        const result = await companyRepo.updateCompany( company );
        if( result ){
          return response.status( 201 ).json( { "result" : company } )
        }else{
          return response.status( 400 ).json( { "result" : "Not Exits Or Data Invalid" } )
        }
  
    }catch(erro){

        return response.status(500).json({"erro" : "Not Exits Or Data Invalid" });

    }
  
  }

  /**
   * Get all companies
   */
  async getAllCompanies( req, res) {
  
    try{

      const result = await this.companyRepo.findAll()
      return ResponseHandler.success(res, 200, "Companies", result )
  
    }catch(erro){
      return ResponseHandler.error(res, 500, "Faild", erro)

    }

  }

  async getCompanyId( request, response ) {

    const { id } = request.query;
  
    try{

      const result = await companyRepo.findCompanyId( id )
      return response.status(201).json( { result } )
  
    }catch(erro){
      return response.status(500).json( { "erro" : erro } )

    }

  }

}

module.exports = CompanyController;
