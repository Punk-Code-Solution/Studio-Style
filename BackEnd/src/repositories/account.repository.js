const { 
  Account,
  TypeAccount,
  Company,
  Email,
  Hair,
  Service,
  Schedules,
  Sale,
  Purchase,
  Purchase_Material,
  Phone,
  Adress } = require("../database/models");
const { v4: uuidv4 } = require('uuid');
const bkrypt = require('bcryptjs');

module.exports = class accountRepository{

  async createEmail( emailUser ){

    const { account_id_email, name, email, active, company_id_email } = emailUser
    
    const result = Email.create({

      id: uuidv4(), 
      account_id_email, 
      name, 
      email, 
      active, 
      company_id_email
       
    }
    ,{
      association: [ Account.account_id_email, Company.company_id_email ]
    });

    if( result ){
      return result
    }
    return false
  }

  //OK
  async findAll(){

    return await Account.findAll({
      include: [
        { model: TypeAccount },
        { model: Company },
        { model: Email },
        { model: Hair },
        { model: Service },
        { model: Schedules },
        { model: Sale },
        { model: Purchase },
        { model: Purchase_Material },
        { model: Phone },
        { model: Adress }
      ]
    });

  }

  async findEmail( eMail ){

    const result = await Email.findOne({

      where: {
        email : eMail
      },
      include: [{ 
        model: Account,
        attributes: [ 'password' ]
      }]

    });

    if( result ){
      return result
    }
    return false

  }

  async findAllLimit(limit = 10, base = 0){

    return await Account.findAll({

      if(limit){

        limit,
        base

      },

      offset: base

    })

  }

  async findAccountSale(cpf) {

    return await Account.findOne({

      where:{

        cpf:cpf

      }

    }).purchase_history;

  }

  async findAccountId(Id){

    const result = await Account.findOne({

      attributes: [ 'password' ],
      where:{

        id: Id,

      }

    }); 

    if(result){
      return result
    }
    return false

  }

  async findAccountCpf(cpf){

    const result = await Account.findOne({

      where:{
        cpf : cpf
      }
    });

    if( result ){      
      return result
    }
    return false

  }

  async addTypeAccount(typeAccount) {

    const {
      type,
      edit,
      creat,
      viwer,
      delet,
      typeaccount_id

    } = typeAccount;

    return await TypeAccount.create({
      id: uuidv4(),
      type,
      edit,
      creat,
      viwer,
      delet,
      typeaccount_id    
    })
    
  }
  
  //OK
  async addAccount(account) {

    const {
      name,
      email,
      lastname,
      password,
      cpf,
      birthday,
      deleted,
      avatar,
      typeaccount_id,
      company_id_account,
      type_hair_id

    } = account;

    const result = await Account.create({     

      id: uuidv4(),
      name,
      lastname,
      password,
      cpf: cpf,
      start_date: Date.now(),
      birthday,
      deleted,
      avatar,
      typeaccount_id,
      company_id_account,
      type_hair_id
      
    }, {
      association: [ Account.typeaccount_id, Account.company_id_account, Account.type_hair_id ]
    })

    if(result){
      return result.dataValues
    }
    return false;
    
  }
    
  async updateAccount( account ) {

    const result = await Account.update(
      {
          name: account.name ? account.name : Account.name,
          lastname: account.lastname ? account.lastname : Account.lastname,
          password: account.password ? bkrypt.hashSync(account.password) : Account.password,
          cpf: account.cpf ? account.cpf : Account.cpf,
          type_hair_id: account.type_hair_id ? account.type_hair_id : Account.type_hair_id,
          birthday: account.birthday ? account.birthday : Account.birthday,
          deleted: account.deleted ? account.deleted: Account.deleted,
          avatar: account.avatar ? account.avatar : Account.avatar,
          typeaccount_id: account.typeaccount_id ? account.typeaccount_id : Account.typeaccount_id,
          type_hair_id: account.type_hair_id ? account.type_hair_id : Account.type_hair_id,
          account_id_Adress: account.account_id_Adress ? account.account_id_Adress : Account.account_id_Adress,
          company_id_account: account.company_id_account ? account.company_id_account : Account.company_id_account

      },
      {
        where: {
          id: account.id,
        },
      }
    );

    if( result ){      
      return result
    }
    return false
    
  }
    
  //OK
  async deleteAccountCpf( cpf ) {

    const result = await Account.destroy({

      where: {

        cpf: cpf

      },
    });

    if( result ){      
      return true
    }
    return false

  }

  async deleteAccountId( id ) {

    const result = await Account.destroy({
      where: {
        id: id
      },
      include: [
        { model: Phone, where: { account_id_phone: id } },
        { model: Email, where: { account_id_email: id } },
        { model: Adress, where: { account_id_adress: id } }
      ]
    });

    if( result ){      
      return true
    }
    return false

  }

}