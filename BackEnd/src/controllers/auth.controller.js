const AccountRepository = require('../repositories/account.repository');
const ResponseHandler = require('../utils/responseHandler');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthController {
  constructor() {
    this.accountRepository = new AccountRepository();
  }

  /**
   * User login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return ResponseHandler.validationError(res, 'Email and password are required');
      }

      // Find user by email
      let userAllDate = await this.accountRepository.findEmail(email);

      if (!userAllDate) {
        return ResponseHandler.unauthorized(res, 'Invalid credentials');
      }

      const user = userAllDate.Account;
      const typeUser = userAllDate.Account.TypeAccount;

      // Check password
      const isValidPassword = bcrypt.compareSync(password, user.dataValues.password);
      
      if (!isValidPassword) {
        return ResponseHandler.unauthorized(res, 'Invalid credentials');
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: email,
          role: typeUser.dataValues.type,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "5m" }
      );

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user.toJSON();

      return ResponseHandler.success(res, 200, 'Login successful', {
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      console.log(error)
      return ResponseHandler.error(res, 500, 'Login failed', error);
    }
  }

  /**
   * User registration
   */
  async register(req, res) {
    try {
      const { name, email, password, cpf, role } = req.body;

      // Validate input
      if (!name || !email || !password || !cpf) {
        return ResponseHandler.validationError(res, 'Name, email, password and CPF are required');
      }

      // Check if user already exists
      const existingUser = await this.accountRepository.findEmail(email);
      
      if (existingUser) {
        return ResponseHandler.validationError(res, 'User with this email already exists');
      }

      // Hash password
      const hashedPassword = bcrypt.hashSync(password, 10);

      // Create user
      const userData = {
        name,
        email,
        password: hashedPassword,
        cpf,
        role: role || 'user'
      };

      const user = await this.accountRepository.addAccount(userData);

      let emailData = {
        account_id_email:user.id, // Assuming user.id is the account ID
        name: name, 
        email: email, 
        active: true, // Default to active
        company_id_email: null // Assuming no company association for now
      };

      await this.accountRepository.createEmail(emailData)

      if (!user) {
        return ResponseHandler.error(res, 400, 'Failed to create user');
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          email: this.email, 
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '5m' }
      );

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      return ResponseHandler.success(res, 201, 'User registered successfully', {
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      console.log(error);
      return ResponseHandler.error(res, 500, 'Registration failed', error);
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await this.accountRepository.findById(userId);

      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user.toJSON();

      return ResponseHandler.success(res, 200, 'Profile retrieved successfully', userWithoutPassword);
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to retrieve profile', error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const updateData = req.body;

      // Don't allow role updates through profile update
      delete updateData.role;

      // Hash password if provided
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const user = await this.accountRepository.updateAccount(userId, updateData);

      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user.toJSON();

      return ResponseHandler.success(res, 200, 'Profile updated successfully', userWithoutPassword);
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to update profile', error);
    }
  }

  /**
   * Change password
   */
  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return ResponseHandler.validationError(res, 'Current password and new password are required');
      }

      // Get current user
      const user = await this.accountRepository.findById(userId);
      
      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      
      if (!isValidPassword) {
        return ResponseHandler.unauthorized(res, 'Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await this.accountRepository.updateAccount(userId, { password: hashedNewPassword });

      return ResponseHandler.success(res, 200, 'Password changed successfully');
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to change password', error);
    }
  }

  /**
   * Logout (client-side token removal)
   */
  async logout(req, res) {
    try {
      // In a stateless JWT system, logout is handled client-side
      // by removing the token from storage
      return ResponseHandler.success(res, 200, 'Logged out successfully');
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Logout failed', error);
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(req, res) {
    try {
      const userId = req.user.id;
      const user = await this.accountRepository.findById(userId);

      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      // Generate new token
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '5m' }
      );

      return ResponseHandler.success(res, 200, 'Token refreshed successfully', { token });
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to refresh token', error);
    }
  }
}

module.exports = AuthController;
