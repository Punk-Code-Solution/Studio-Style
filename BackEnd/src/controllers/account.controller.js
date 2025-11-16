const AccountRepository = require('../repositories/account.repository');
const EmailRepository = require('../repositories/email.repository');
const HairRepository = require('../repositories/hair.repository');
const TypeAccountRepository = require('../repositories/type_account.repository');
const ResponseHandler = require('../utils/responseHandler');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize'); // Adicionado para filtros
const { TypeAccount } = require('../Database/models'); // Import TypeAccount model

class AccountController {
  constructor() {
    this.accountRepository = new AccountRepository();
    this.emailRepository = new EmailRepository();
    this.hairRepository = new HairRepository();
    this.typeAccountRepository = new TypeAccountRepository();
  }

  /**
   * Create a new hair type
   */
  async createHair(req, res) {
    try {
      const hair = req.body;
      const result = await this.hairRepository.addHair(hair);
      
      return ResponseHandler.success(res, 201, 'Hair type created successfully', result);
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to create hair type', error);
    }
  }

  /**
   * Get all hair types
   */
  async getAllHair(req, res) {
    try {
      const result = await this.hairRepository.findAll();
      return ResponseHandler.success(res, 200, 'Hair types retrieved successfully', result);
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to retrieve hair types', error);
    }
  }

  /**
   * Update hair type
   */
  async updateHair(req, res) {
    try {
      const { id } = req.params;
      const hairData = req.body;
      
      const result = await this.hairRepository.updateHair(id, hairData);
      
      if (!result) {
        return ResponseHandler.notFound(res, 'Hair type not found');
      }
      
      return ResponseHandler.success(res, 200, 'Hair type updated successfully', result);
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to update hair type', error);
    }
  }

  /**
   * Delete hair type
   */
  async deleteHair(req, res) {
    try {
      const { id } = req.params;
      const result = await this.hairRepository.deleteHair(id);
      
      if (!result) {
        return ResponseHandler.notFound(res, 'Hair type not found');
      }
      
      return ResponseHandler.success(res, 200, 'Hair type deleted successfully');
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to delete hair type', error);
    }
  }

  /**
   * Create a new account
   */
  async createAccount(req, res) {
    try {
      const account = req.body;
      
      // LÓGICA MODIFICADA (Ponto 1): Hash password only if provided
      if (account.password && account.password.trim() !== '') {
        account.password = await bcrypt.hash(account.password, 10);
      } else {
        account.password = null; // Garante que seja nulo se vazio
      }

      // LÓGICA MODIFICADA (Ponto 1): Garante que CPF e Email sejam nulos se não fornecidos
      if (!account.cpf || account.cpf.trim() === '') {
        account.cpf = null;
      }
      if (!account.email || account.email.trim() === '') {
        account.email = null;
      }

      // LÓGICA MODIFICADA (Ponto 5): Se role for fornecido, encontrar o typeaccount_id correspondente
      if (account.role && !account.typeaccount_id) {
        try {
          const typeAccount = await TypeAccount.findOne({
            where: { type: account.role.toLowerCase() }
          });
          if (typeAccount) {
            account.typeaccount_id = typeAccount.id;
          } else {
            console.warn(`TypeAccount not found for role: ${account.role}`);
            return ResponseHandler.error(res, 400, `Invalid role: ${account.role}. TypeAccount not found.`);
          }
        } catch (err) {
          console.error('Error finding TypeAccount:', err.message);
          return ResponseHandler.error(res, 500, 'Failed to resolve role to TypeAccount', err);
        }
      }
      
      const result = await this.accountRepository.addAccount(account);

      if (result && result.error) {
        return ResponseHandler.error(res, 409, `Duplicate field: ${result.error}`, { field: result.error });
      }

      if (result) {
        // Create associated email only if email is provided
        if (result.email) {
          const emailResult = await this.createEmail(result);
          if (emailResult && emailResult.error) {
            return ResponseHandler.error(res, 409, `Duplicate field: ${emailResult.error}`, { field: emailResult.error });
          }
        }

        return ResponseHandler.success(res, 201, 'Account created successfully', result);
      } else {
        return ResponseHandler.error(res, 400, 'Failed to create account');
      }
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to create account', error);
    }
  }

  /**
   * Get all accounts
   */
  async getAllAccounts(req, res) {
    try {
      // LÓGICA MODIFICADA (Ponto 4): Filtrar por role
      const { role } = req.query;
      
      if (!role) {
        // No filter, return all accounts
        const result = await this.accountRepository.findAll({});
        return ResponseHandler.success(res, 200, 'Accounts retrieved successfully', result);
      }

      // With role filter - use specialized method
      const roles = role.split(',').map(r => r.trim());
      
      try {
        const result = await this.accountRepository.findByRoles(roles);
        return ResponseHandler.success(res, 200, 'Accounts retrieved successfully', result);
      } catch (filterError) {
        console.error('Filter error:', filterError.message);
        // If filtering fails, return empty array instead of error
        return ResponseHandler.success(res, 200, 'Accounts retrieved successfully', []);
      }
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to retrieve accounts', error);
    }
  }

  /**
   * Get account by ID
   */
  async getAccountById(req, res) {
    try {
      // ID pode vir de params ou query (compatibilidade)
      const id = req.params.id || req.query.id;
      
      if (!id) {
        return ResponseHandler.validationError(res, 'Account ID is required');
      }
      
      const result = await this.accountRepository.findById(id);
      
      if (!result) {
        return ResponseHandler.notFound(res, 'Account not found');
      }
      
      return ResponseHandler.success(res, 200, 'Account retrieved successfully', result);
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to retrieve account', error);
    }
  }

  /**
   * Get account by CPF
   */
  async getAccountByCpf(req, res) {
    try {
      const { cpf } = req.params;
      const result = await this.accountRepository.findByCpf(cpf);
      
      if (!result) {
        return ResponseHandler.notFound(res, 'Account not found');
      }
      
      return ResponseHandler.success(res, 200, 'Account retrieved successfully', result);
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to retrieve account', error);
    }
  }

  /**
   * Update account
   */
  async updateAccount(req, res) {
    try {
      // ID pode vir de params ou body (compatibilidade)
      const id = req.params.id || req.body.id || req.query.id;
      const accountData = { ...req.body };
      
      // Remover id do body para não duplicar
      if (accountData.id) {
        delete accountData.id;
      }
      
      if (!id) {
        return ResponseHandler.validationError(res, 'Account ID is required');
      }
      
      // LÓGICA MODIFICADA (Ponto 1): Hash password only if provided
      if (accountData.password && accountData.password.trim() !== '') {
        accountData.password = await bcrypt.hash(accountData.password, 10);
      } else {
        delete accountData.password; // Não atualiza a senha se vazia
      }
      
      // Passar ID junto com os dados para o repository
      accountData.id = id;
      const result = await this.accountRepository.updateAccount(accountData);
      
      if (!result) {
        return ResponseHandler.notFound(res, 'Account not found');
      }
      
      return ResponseHandler.success(res, 200, 'Account updated successfully', result);
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to update account', error);
    }
  }

  /**
   * Delete account by ID
   */
  async deleteAccountById(req, res) {
    try {
      // ID pode vir de params ou query (compatibilidade)
      const id = req.params.id || req.query.id;
      
      if (!id) {
        return ResponseHandler.validationError(res, 'Account ID is required');
      }
      
      const result = await this.accountRepository.deleteAccountId(id);
      
      if (!result) {
        return ResponseHandler.notFound(res, 'Account not found');
      }
      
      return ResponseHandler.success(res, 200, 'Account deleted successfully');
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to delete account', error);
    }
  }

  /**
   * Delete account by CPF
   */
  async deleteAccountByCpf(req, res) {
    try {
      const { cpf } = req.params;
      const result = await this.accountRepository.deleteAccountByCpf(cpf);
      
      if (!result) {
        return ResponseHandler.notFound(res, 'Account not found');
      }
      
      return ResponseHandler.success(res, 200, 'Account deleted successfully');
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to delete account', error);
    }
  }

  /**
   * Create email for account
   */
  async createEmail(account) {
    try {
      // LÓGICA MODIFICADA (Ponto 1): Verifica se o email existe antes de criar
      if (!account.email) {
        return null;
      }
      const emailData = {
        account_id_email: account.id,
        email: account.email,
        name: account.name, 
        active: true, 
        company_id_email: account.company_id || null
      };
      
      const result = await this.emailRepository.createEmail(emailData);
      if (result && result.error) {
        return result; // propagate error object
      }
      return result;
    } catch (error) {
      console.error('Failed to create email:', error);
      throw error;
    }
  }

  /**
   * Get all emails
   */
  async getAllEmails(req, res) {
    try {
      const result = await this.emailRepository.findAll();
      return ResponseHandler.success(res, 200, 'Emails retrieved successfully', result);
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to retrieve emails', error);
    }
  }

  /**
   * Delete email
   */
  async deleteEmail(req, res) {
    try {
      const { id } = req.params;
      const result = await this.emailRepository.deleteEmail(id);
      
      if (!result) {
        return ResponseHandler.notFound(res, 'Email not found');
      }
      
      return ResponseHandler.success(res, 200, 'Email deleted successfully');
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to delete email', error);
    }
  }

  /**
   * Create type account
   */
  async createTypeAccount(req, res) {
    try {
      const typeAccount = req.body;
      
      const result = await this.typeAccountRepository.addTypeAccount(typeAccount);
      
      return ResponseHandler.success(res, 201, 'Type account created successfully', result);
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to create type account', error);
    }
  }

  /**
   * Get all type accounts
   */
  async getAllTypeAccounts(req, res) {
    try {

      const result = await this.typeAccountRepository.findAll();
      return ResponseHandler.success(res, 200, 'Type accounts retrieved successfully', result);
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to retrieve type accounts', error);
    }
  }

  /**
   * Update type account
   */
  async updateTypeAccount(req, res) {
    try {
      const { id } = req.params;
      const typeAccountData = req.body;
      
      const result = await this.typeAccountRepository.updateTypeAccount(id, typeAccountData);
      
      if (!result) {
        return ResponseHandler.notFound(res, 'Type account not found');
      }
      
      return ResponseHandler.success(res, 200, 'Type account updated successfully', result);
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to update type account', error);
    }
  }

  /**
   * Delete type account
   */
  async deleteTypeAccount(req, res) {
    try {
      const { id } = req.params;
      const result = await this.typeAccountRepository.deleteTypeAccount(id);
      
      if (!result) {
        return ResponseHandler.notFound(res, 'Type account not found');
      }
      
      return ResponseHandler.success(res, 200, 'Type account deleted successfully');
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to delete type account', error);
    }
  }
}

module.exports = AccountController;