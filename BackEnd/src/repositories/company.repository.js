const { Company, Account, Email } = require('../database/models');
const { v4: uuidv4 } = require('uuid');
const bkrypt = require('bcryptjs');

module.exports = class companyRepository{


  //OK
  async findAll(){

    return await Company.findAll({
      include: [{
        model: Account,
        attributes: [ 'name', 'id' ]
      },
      {
       model: Email,
       attributes: [ 'name', 'id' ]
      }] 
    });

  }

  async findEmail( eMail ){

    return Email.findOnde({

      email : eMail

    });

  }

  async findAllLimit(limit = 10, base = 0){

    return await Company.findAll({

      if(limit){

        limit,
        base

      },

      offset: base

    })

  }

  async findCompanyId(Id){

    return await Company.findOne({
      
      where:{

          id: Id,

        }
      ,      
      include: [{
            model: Account,
            attributes: [ 'name', 'id' ]
        },
        {
          model: Email,
          attributes: [ 'name', 'id' ]
        }] 
      

    })

  }
  
  //OK
  async addCompany(company) {

    const {

      name,
      cnpj,
      active,
      avatar

    } = company;

    return await Company.create({

      id: uuidv4(),
      name,
      cnpj,
      start_date: Date.now(),
      active,
      avatar
      
    })
    
  }
    
  async updateCompany(company) {

    const {
      id,
      name,
      cnpj,
      active,
      avatar
    } = company

    const result = await Company.update(
      {
        name: name != null ? name : Company.name,
        cnpj: cnpj != null ? cnpj : Company.cnpj,
        active: active != null ? active : Company.active,
        avatar: avatar != null ? avatar : Company.avatar
      },
      {
        where: {
          id: id,
        },
      }
    );
    
    if( result ){
      return result
    }
    return false

  }

  async deleteCompanyId( id ) {

    return await Company.destroy({
      where: {
        id: id
      },
    });
  }

}