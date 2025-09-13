const { Hair } = require("../database/models");
const { Account } = require("../database/models");
const { v4: uuidv4 } = require('uuid');
const bkrypt = require('bcryptjs');

class hairRepository{

  async findAllLimit(limit = 10, base = 0){

    return await Hair.findAll({

      limit: limit,
      offset: base
      
    });

  }

  async findAll(){

    return await Hair.findAll({

      include: [
        { 
          model: Account,
          attributes:[ 'name', 'id'] 
        }
      ]
    });

  }

  async findHair(id){

    return await Hair.findOne({
      where:{
        id : id
      }
    })
  }
 
  async addHair(hair) {

    const {
      type,
      level,
      letter
     } = hair;
    
    await Hair.create({
      
      id: uuidv4(),
      type,
      level,
      letter

    });
  }

  async updateHair( hair ) {

    const result = await Hair.update({
      
      type: hair.type ? hair.type : Hair.type,
      level: hair.level ? hair.level : Hair.level,
      letter: hair.letter ? hair.letter : Hair.letter

    },
    {

      where: {
        id: hair.id        
      }

    });

    if( result ){      
      return true
    }
    return false

  }

  async deleteHair(id) {

    const result = await Hair.destroy({

      where: {

          id: id
          
        }

      });

      if( result ){      
        return true
      }
      return false

    }
    
}

module.exports = hairRepository;