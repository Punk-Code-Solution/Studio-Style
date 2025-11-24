const { 
  Account,
  TypeAccount,
  Email,
  Hair,
  Service,
  Schedules,
  Sale,
  Purchase,
  Purchase_Material,
  Phone,
  Adress } = require("../Database/models");
const { v4: uuidv4 } = require('uuid');
const bkrypt = require('bcrypt');
const { Op } = require('sequelize');

module.exports = class accountRepository{

  // Helper method para includes padrão
  getDefaultIncludes() {
    return [
      { model: TypeAccount },
      { model: Email },
      { model: Hair },
      { model: Schedules },
      { model: Sale },
      { model: Purchase },
      { model: Purchase_Material },
      { model: Phone },
      { model: Adress }
    ];
  }

  async createEmail( emailUser ){

    const { account_id_email, name, email, active } = emailUser

    // Prevent duplicate email
    if (email) {
      const existing = await Email.findOne({ where: { email } });
      if (existing) {
        return { error: 'email' };
      }
    }
    
    const result = await Email.create({
      id: uuidv4(), 
      account_id_email, 
      name, 
      email, 
      active: active || new Date()
    });

    if( result ){
      return result
    }
    return false
  }

  //OK
  async findAll(options = {}){
    // Merge custom options with default includes
    const defaultInclude = this.getDefaultIncludes();

    // If custom include is provided (e.g., for filtering), merge it with defaults
    let includeList = defaultInclude;
    if (options.include && options.include.length > 0) {
      // Merge custom include with defaults (custom ones take precedence for filtering)
      includeList = options.include.map(customInc => {
        // If custom include is for filtering (has 'where' clause), use it as is
        if (customInc.where) {
          return customInc;
        }
        // Otherwise, merge with defaults
        const defaultInc = defaultInclude.find(d => d.model === customInc.model);
        return defaultInc || customInc;
      });
      // Add default includes that are not in custom includes
      defaultInclude.forEach(def => {
        if (!includeList.some(inc => inc.model === def.model)) {
          includeList.push(def);
        }
      });
    }

    const mergedOptions = {
      ...options,
      include: includeList
    };

    return await Account.findAll(mergedOptions);

  }

  // NEW: Simple method to find accounts by TypeAccount roles
  async findByRoles(roles = []) {
    try {
      // Incluir TypeAccount com filtro + todos os outros relacionamentos padrão
      const defaultIncludes = this.getDefaultIncludes();
      const typeAccountInclude = {
        model: TypeAccount,
        where: {
          type: {
            [Op.in]: roles
          }
        },
        required: true  // INNER JOIN - only accounts with matching roles
      };
      
      // Substituir o TypeAccount padrão pelo filtrado
      const includes = defaultIncludes.map(inc => 
        inc.model === TypeAccount ? typeAccountInclude : inc
      );
      
      const result = await Account.findAll({
        include: includes,
        attributes: { include: [] } // Include all account attributes
      });
      return result;
    } catch (err) {
      console.error('Error in findByRoles:', err.message);
      throw err;
    }
  }

  async findEmail( eMail ){

    const result = await Email.findOne({
      where: {
      email: eMail
      },
      include: [
      { 
        model: Account,
        attributes: ['password'],
        include: [
        {
          model: TypeAccount,
          attributes: ['type']
        }
        ]
      }
      ]
    });

    if( result ){
      return result
    }
    return false

  }

  async findAllLimit(limit = 10, base = 0){

    return await Account.findAll({
      limit,
      offset: base
    });

  }

  async findAccountSale(cpf) {

    return await Account.findOne({

      where:{

        cpf:cpf

      }

    }).purchase_history;

  }

  async findAccountId(Id){
    // Método antigo que só retornava password - mantido para compatibilidade
    const result = await Account.findOne({
      attributes: [ 'password' ],
      where: {
        id: Id,
      }
    }); 

    if(result){
      return result
    }
    return false
  }

  // Novo método para buscar account completo com todos os relacionamentos
  async findById(id) {
    try {
      const result = await Account.findOne({
        where: {
          id: id
        },
        include: this.getDefaultIncludes()
      });
      
      return result || false;
    } catch (error) {
      console.error('Error in findById:', error);
      return false;
    }
  }

  async findAccountCpf(cpf){
    const result = await Account.findOne({
      where: {
        cpf: cpf
      },
      include: this.getDefaultIncludes()
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
      type_hair_id

    } = account;

    // Prevent duplicate by CPF
    if (cpf) {
      const existingByCpf = await this.findAccountCpf(cpf);
      if (existingByCpf) {
        return { error: 'cpf' }; // Duplicate CPF
      }
    }

    // Prevent duplicate by email (if provided)
    if (email) {
      const existingEmail = await this.findEmail(email);
      if (existingEmail) {
        return { error: 'email' }; // Duplicate email
      }
    }

    const result = await Account.create({     

      id: uuidv4(),
      name,
      lastname,
      password,
      cpf: cpf,
      start_date: account.start_date || new Date(),
      birthday,
      deleted: deleted !== undefined ? deleted : false,
      avatar,
      typeaccount_id,
      type_hair_id
      
    }, {
      association: [ Account.typeaccount_id, Account.type_hair_id ]
    })

    if(result){
      account.id = result.id
      return account
    }
    return false;
    
  }
    
  async updateAccount( account ) {
    try {
      // Buscar o registro atual do banco
      const existingAccount = await Account.findOne({
        where: { id: account.id }
      });

      if (!existingAccount) {
        return false;
      }

      // Preparar objeto de atualização apenas com campos fornecidos
      const updateData = {};

      if (account.name !== undefined) updateData.name = account.name;
      if (account.lastname !== undefined) updateData.lastname = account.lastname;
      if (account.password !== undefined && account.password !== null && account.password.trim() !== '') {
        updateData.password = bkrypt.hashSync(account.password, 10);
      }
      if (account.cpf !== undefined) updateData.cpf = account.cpf;
      if (account.type_hair_id !== undefined) updateData.type_hair_id = account.type_hair_id;
      if (account.birthday !== undefined) updateData.birthday = account.birthday;
      if (account.deleted !== undefined) updateData.deleted = account.deleted;
      if (account.avatar !== undefined) updateData.avatar = account.avatar;
      if (account.typeaccount_id !== undefined) updateData.typeaccount_id = account.typeaccount_id;
      // Atualizar apenas se houver dados para atualizar
      if (Object.keys(updateData).length === 0) {
        return existingAccount;
      }

      const result = await Account.update(
        updateData,
        {
          where: {
            id: account.id,
          },
        }
      );

      if (result && result[0] > 0) {
        // Retornar o registro atualizado
        return await Account.findOne({
          where: { id: account.id }
        });
      }
      return false;
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
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

  async findAccountByPhone(phoneNumber) {
    try {
      // Remove caracteres não numéricos para garantir a busca
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      
      const phoneRecord = await Phone.findOne({
        where: { 
          phone: {
            [Op.like]: `%${cleanPhone}` // Busca flexível
          } 
        },
        include: [{
          model: Account,
          include: [TypeAccount] // Inclui o tipo de conta
        }]
      });
      
      // Retorna o objeto Account se encontrado
      return phoneRecord ? phoneRecord.Account : null;

    } catch (error) {
      console.error('Erro ao buscar conta por telefone:', error);
      return null;
    }
  }

  /**
   * (NOVO) Cria um registro de telefone associado a uma conta.
   */
  async createPhone(phoneData) {
    const { phone, ddd, type, account_id_phone } = phoneData;
    
    // Limpa o telefone para armazenamento
    const cleanPhone = phone.replace(/\D/g, '');

    try {
      return await Phone.create({
        id: uuidv4(),
        phone: cleanPhone, // Armazena o número limpo
        ddd: ddd || cleanPhone.substring(2, 4), // Tenta extrair DDD
        type: type || 'whatsapp',
        active: new Date(),
        account_id_phone: account_id_phone
      });
    } catch (error) {
       console.error('Erro ao criar registro de telefone:', error);
       return null;
    }
  }

}