const { Email, Account } = require('../Database/models');
const { v4: uuidv4 } = require('uuid');

module.exports = class emailRepository{

  async findAll(){

    let result = await Email.findAll({
      attributes: [ 
        "id",
        "name",
        "email",
        "active",
        "account_id_email" 
      ]
    });
    
    return result;

  }

  async findAllLimit(limit = 10, base = 0){

    return await Email.findAll({

      limit,
      offset: base
      
    });

  }

  async findEmail(id){

    return await Email.findOne({
      where:{
        id : id
      }
    });
  }
 
  async createEmail( emailUser ){

    const { account_id_email, name, email, active } = emailUser
    // Prevent duplicate email entries
    if (email) {
      const existing = await Email.findOne({ where: { email } });
      if (existing) {
        return { error: 'email' }; // Duplicate email
      }
    }
    
    const result = Email.create({

      id: uuidv4(), 
      account_id_email, 
      name, 
      email, 
      active
       
    }
    ,{
      association: [ Account.account_id_email]
    });

    if( result ){

      return result

    }
    return false
  }

  async updateEmail( email ) {
    
    return await Email.create({

      account_id: email.account_id ? email.account_id : Email.account_id,
      name: email.name ? email.name : Email.name,
      email: email.email ? email.email : Email.email,
      active: email.active ? email.active : Email.active

    },
    {
      where: {
        id: email.id
      }
    });

  }

  async deleteEmail(id) {

    const result = await Email.destroy({
      where: {
        id : id
      },
    });

    if( !result ){
      return false
    }
    return result

  }
    
}