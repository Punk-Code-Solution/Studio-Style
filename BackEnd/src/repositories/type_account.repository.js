const { TypeAccount, Account } = require("../Database/models");

class typeAccountRepository{

  async findAll(){

    return await TypeAccount.findAll({
      include: [
        { 
          model: Account,
          attributes: [ 'name', 'id' ]  
        }
      ]
    });

  }

  async findTypeAccount(id){

    return await TypeAccount.findOne({
      where:{
        id : id
      }
    })
  }
 
  async addTypeAccount(typeAccount) {

    const { 

      type,
      edit,
      creat,
      viwer,
      delet

    } = typeAccount
    
    await TypeAccount.create({

      type,
      edit,
      creat,
      viwer,
      delet

    });
  }

  async updateTypeAccount(typeAccount) {

    const result = TypeAccount.update({

      type: typeAccount.type ? typeAccount.type : TypeAccount.type,
      edit: typeAccount.edit ? typeAccount.edit : TypeAccount.edit,
      creat: typeAccount.creat ? typeAccount.creat : TypeAccount.creat,
      viwer: typeAccount.viwer ? typeAccount.viwer : TypeAccount.viwer,
      delet: typeAccount.delet ? typeAccount.delet : TypeAccount.delet

    },
    {
      where: {
        id: typeAccount.id
      }
    });

    if(result){
      return true
    }
    return false

  }

  async deleteTypeAccount( id ) {

    const result = TypeAccount.destroy({
      where: {
        id: id
      },
    });

    if(result){
      return true
    }
    return false

  }
    
}

module.exports = typeAccountRepository;