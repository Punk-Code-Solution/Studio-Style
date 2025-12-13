const { Phone } = require("../Database/models");

class phoneRepository{

  async findAll(){

    return await Phone.findAll();

  }

  async findAllLimit(limit = 10, base = 0){

    return await Phone.findAll({

      limit: limit,
      offset: base
      
    });

  }

  async findPhone( id ){

    return await Phone.findOne({
      where:{
        id : id
      }
    }).id
  }
 
  async addPhone(phones) {

    const {
      phone,
      ddd,
      active,
      type,
      account_id_phone,
     } = phones;
    
    return await Phone.create(
      {
        phone,
        ddd,
        active,
        type,
        account_id_phone
    });
  }

  async updatePhone(phone) {
    
    return await Phone.update(
      
      {
        phone: phone.phone ? phone.phone : Phone.phone,
        ddd: phone.ddd ? phone.ddd : Phone.ddd,
        active: phone.active ? phone.active : Phone.active,
        type: phone.type ? phone.type : Phone.type,
        account_id_phone: phone.account_id_phone ? phone.account_id_phone : Phone.account_id_phone
      },
      {
        where: {
            account_id_phone: phone.account_id_phone,
        },
    });
  }

  async deletePhone(id) {

    return await Phone.destroy({
      where: {
        id: id
      },
    });
  }
    
}

module.exports = phoneRepository;