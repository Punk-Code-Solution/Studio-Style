const { TypeAccount, Account } = require("../Database/models");
const { v4: uuidv4 } = require('uuid');

class typeAccountRepository{

  async findAll(){
    try {
      return await TypeAccount.findAll({
        include: [
          { 
            model: Account,
            attributes: [ 'name', 'id' ]  
          }
        ]
      });
    } catch (error) {
      console.error('Error in findAll TypeAccount:', error);
      throw error;
    }
  }

  async findTypeAccount(id){
    try {
      return await TypeAccount.findOne({
        where:{
          id : id
        }
      });
    } catch (error) {
      console.error('Error in findTypeAccount:', error);
      throw error;
    }
  }
 
  async addTypeAccount(typeAccount) {
    try {
      console.log('Starting addTypeAccount with data:', typeAccount);
      
      const { 
        type,
        edit,
        creat,
        viwer,
        delet
      } = typeAccount
      
      console.log('Creating TypeAccount with values:', {
        type,
        edit,
        creat,
        viwer,
        delet
      });
      
      const result = await TypeAccount.create({
        id: uuidv4(),
        type,
        edit,
        creat,
        viwer,
        delet
      });
      
      console.log('TypeAccount created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error in addTypeAccount:', error);
      throw error;
    }
  }

  async updateTypeAccount(typeAccount) {
    try {
      const result = await TypeAccount.update({
        type: typeAccount.type,
        edit: typeAccount.edit,
        creat: typeAccount.creat,
        viwer: typeAccount.viwer,
        delet: typeAccount.delet
      },
      {
        where: {
          id: typeAccount.id
        }
      });

      if(result[0] > 0){
        return true
      }
      return false
    } catch (error) {
      console.error('Error in updateTypeAccount:', error);
      throw error;
    }
  }

  async deleteTypeAccount( id ) {
    try {
      const result = await TypeAccount.destroy({
        where: {
          id: id
        },
      });

      if(result > 0){
        return true
      }
      return false
    } catch (error) {
      console.error('Error in deleteTypeAccount:', error);
      throw error;
    }
  }

  async findClientType() {
    try {
      return await TypeAccount.findOne({
        where: {
          type: 'client'
        }
      });
    } catch (error) {
      console.error('Error in findClientType:', error);
      throw error;
    }
  }
    
}

module.exports = typeAccountRepository;