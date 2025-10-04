const AccountRepository = require('../repositories/account.repository');
const EmailRepository = require('../repositories/email.repository');
const HairRepository = require('../repositories/hair.repository');
const TypeAccountRepository = require('../repositories/type_account.repository');
const ResponseHandler = require('../utils/responseHandler');
const bcrypt = require('bcrypt');

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
      
      // Hash password if provided
      if (account.password) {
        account.password = await bcrypt.hash(account.password, 10);
      }
      
      const result = await this.accountRepository.addAccount(account);
      
      if (result) {
        // Create associated email
        await this.createEmail(result);
        
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
      const result = await this.accountRepository.findAll();
      return ResponseHandler.success(res, 200, 'Accounts retrieved successfully', result);
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to retrieve accounts', error);
    }
  }

  /**
   * Get account by ID
   */
  async getAccountById(req, res) {
    try {
      const { id } = req.params;
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
      const { id } = req.params;
      const accountData = req.body;
      
      // Hash password if provided
      if (accountData.password) {
        accountData.password = await bcrypt.hash(accountData.password, 10);
      }
      
      const result = await this.accountRepository.updateAccount(id, accountData);
      
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
      const { id } = req.params;
      const result = await this.accountRepository.deleteAccountById(id);
      
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
      const emailData = {
        account_id_email: account.id,
        email: account.email,
        name: account.name, 
        active: true, 
        company_id_email: account.company_id || null
      };
      
      return await this.emailRepository.createEmail(emailData);
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
