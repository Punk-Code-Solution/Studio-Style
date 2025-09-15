const { Adress } = require("../database/models");

class adressRepository{

  async findAll(limit = 10, base = 0){

    return await Adress.findAll({

      limit: limit,
      offset: base
      
    });

  }

  async findAdress(id){

    return await Adress.findOne({
      where:{
        id : id
      }
    })
  }
 
  async addAdress(adress) {    

    const [
      city,
      neighborhood,
      road
    ] = adress;

    await Adress.create({
      
      city,
      neighborhood,
      road

    });

  }

  async updateAdress(adress) {

    return await Adress.update(
    
      {
        city: adress.city ? adress.city : Adress.city,
        neighborhood: adress.neighborhood ? adress.neighborhood : Adress.neighborhood,
        road: adress.road ? adress.road : Adress.road
      },
      {
        where: {
            id: adress.id,
        },
    });
    
  }

  async deleteAdress(adress) {
    
    await Adress.destroy(
      {
        where: {
            id: adress.id,
        },
    });
  }
    
}

module.exports = adressRepository;