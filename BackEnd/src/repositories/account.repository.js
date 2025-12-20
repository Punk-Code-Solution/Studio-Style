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
const bcrypt = require('bcrypt');
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
      { model: Phone, as: 'phones' },
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
  async addAccount(account, transaction = null) {
    try {
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

      // Validações básicas
      if (!name || !name.trim()) {
        throw new Error('Name is required');
      }

      // Verificar duplicatas - mas confiar principalmente nas constraints do banco
      // para evitar race conditions
      if (cpf) {
        const existingByCpf = await this.findAccountCpf(cpf);
        if (existingByCpf) {
          const error = new Error('CPF already exists');
          error.code = 'DUPLICATE_CPF';
          error.field = 'cpf';
          throw error;
        }
      }

      if (email) {
        const existingEmail = await this.findEmail(email);
        if (existingEmail) {
          const error = new Error('Email already exists');
          error.code = 'DUPLICATE_EMAIL';
          error.field = 'email';
          throw error;
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
        company_id_account,
        type_hair_id
      }, {
        association: [ Account.typeaccount_id, Account.company_id_account, Account.type_hair_id ],
        transaction
      });

      if (!result) {
        throw new Error('Failed to create account');
      }

      account.id = result.id;
      return account;
    } catch (error) {
      // Se for erro de constraint único do Sequelize, converter para nosso formato
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors && error.errors[0] ? error.errors[0].path : 'unknown';
        const newError = new Error(`${field} already exists`);
        newError.code = field === 'cpf' ? 'DUPLICATE_CPF' : field === 'email' ? 'DUPLICATE_EMAIL' : 'DUPLICATE_FIELD';
        newError.field = field;
        throw newError;
      }
      
      console.error('Erro ao criar conta no repositório:', error);
      throw error;
    }
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
        updateData.password = account.password
      }
      if (account.cpf !== undefined) updateData.cpf = account.cpf;
      if (account.type_hair_id !== undefined) updateData.type_hair_id = account.type_hair_id;
      if (account.birthday !== undefined) updateData.birthday = account.birthday;
      if (account.deleted !== undefined) updateData.deleted = account.deleted;
      if (account.avatar !== undefined) updateData.avatar = account.avatar;
      if (account.typeaccount_id !== undefined) updateData.typeaccount_id = account.typeaccount_id;
      if (account.company_id_account !== undefined) updateData.company_id_account = account.company_id_account;

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

  async deleteAccountId(id, transaction = null) {
    try {
      // Otimização: Verificar relacionamentos usando COUNT em uma única query quando possível
      // ou usar Promise.all para executar verificações em paralelo
      const [schedulesCount, salesCount, purchasesCount, purchaseMaterialsCount] = await Promise.all([
        Schedules.count({
          where: {
            [Op.or]: [
              { client_id_schedules: id },
              { provider_id_schedules: id }
            ]
          },
          transaction
        }),
        Sale.count({
          where: {
            [Op.or]: [
              { client_id_sale: id },
              { account_id_sale: id }
            ]
          },
          transaction
        }),
        Purchase.count({
          where: {
            account_id_purchase: id
          },
          transaction
        }),
        Purchase_Material.count({
          where: {
            account_id_purchase_material: id
          },
          transaction
        })
      ]);

      // Se houver registros relacionados, retornar erro informativo
      if (schedulesCount > 0 || salesCount > 0 || purchasesCount > 0 || purchaseMaterialsCount > 0) {
        const errors = [];
        if (schedulesCount > 0) errors.push('agendamentos');
        if (salesCount > 0) errors.push('vendas');
        if (purchasesCount > 0) errors.push('compras');
        if (purchaseMaterialsCount > 0) errors.push('materiais de compra');
        
        const error = new Error(`Não é possível excluir esta conta pois ela possui ${errors.join(', ')} associados.`);
        error.code = 'HAS_RELATED_RECORDS';
        error.relatedRecords = errors;
        throw error;
      }

      // Deletar relacionamentos e conta principal dentro da transação
      // Deletar telefones associados
      await Phone.destroy({
        where: {
          account_id_phone: id
        },
        transaction
      });

      // Deletar emails associados
      await Email.destroy({
        where: {
          account_id_email: id
        },
        transaction
      });

      // Deletar endereços associados
      await Adress.destroy({
        where: {
          account_id_adress: id
        },
        transaction
      });

      // Por fim, deletar a conta principal
      const result = await Account.destroy({
        where: {
          id: id
        },
        transaction
      });

      if (result === 0) {
        throw new Error('Account not found');
      }

      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  async findAccountByPhone(phoneNumber) {
    try {
      // Remove caracteres não numéricos para garantir a busca
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      
      // Remove código do país (55) se presente para normalizar a busca
      let phoneToSearch = cleanPhone;
      if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
        phoneToSearch = cleanPhone.substring(2); // Remove "55"
      }
      
      // Busca exata primeiro (mais eficiente)
      let phoneRecord = await Phone.findOne({
        where: { 
          phone: phoneToSearch
        },
        include: [{
          model: Account,
          include: [TypeAccount] // Inclui o tipo de conta
        }]
      });
      
      // Se não encontrou com busca exata, tenta busca flexível (para números antigos)
      if (!phoneRecord) {
        phoneRecord = await Phone.findOne({
          where: { 
            phone: {
              [Op.like]: `%${phoneToSearch}` // Busca flexível apenas se necessário
            } 
          },
          include: [{
            model: Account,
            include: [TypeAccount]
          }]
        });
      }
      
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
    
    // Garante que o telefone não tenha código do país
    let phoneToStore = cleanPhone;
    let dddToStore = ddd;
    
    // Se o telefone ainda tem código do país (55), remove
    if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
      phoneToStore = cleanPhone.substring(2);
      // Se não foi fornecido o DDD, extrai das posições 2-4 do número original
      if (!dddToStore) {
        dddToStore = cleanPhone.substring(2, 4);
      }
    } else if (!dddToStore && cleanPhone.length >= 10) {
      // Se não tem código do país e não foi fornecido DDD, assume que os 2 primeiros são o DDD
      dddToStore = cleanPhone.substring(0, 2);
    }

    try {
      return await Phone.create({
        id: uuidv4(),
        phone: phoneToStore, // Armazena o número sem código do país
        ddd: dddToStore,
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