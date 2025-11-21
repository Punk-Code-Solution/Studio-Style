const { Hair } = require("../Database/models");
const { Account } = require("../Database/models");
const { v4: uuidv4 } = require('uuid');
const bkrypt = require('bcrypt');

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
    
    const result = await Hair.create({
      
      id: uuidv4(),
      type,
      level,
      letter

    });
    
    return result;
  }

  async updateHair( hair ) {
    const updateData = {};
    
    if (hair.type !== undefined) {
      updateData.type = hair.type;
    }
    if (hair.level !== undefined) {
      updateData.level = hair.level;
    }
    if (hair.letter !== undefined) {
      updateData.letter = hair.letter;
    }

    await Hair.update(updateData, {
      where: {
        id: hair.id        
      }
    });

    // Retornar o registro atualizado
    return await this.findHair(hair.id);
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