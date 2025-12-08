const { sequelize } = require('../Database/models');
const ResponseHandler = require('../utils/responseHandler');

/**
 * Middleware para executar handlers dentro de uma transação de banco de dados
 * A transação é automaticamente commitada em caso de sucesso ou revertida em caso de erro
 * 
 * @param {Function} handler - Função async que recebe (req, res, next)
 * @returns {Function} Middleware function
 */
const withTransaction = (handler) => {
  return async (req, res, next) => {
    const transaction = await sequelize.transaction();
    
    try {
      // Adiciona a transação ao request para uso nos repositories
      req.transaction = transaction;
      
      // Executa o handler
      await handler(req, res, next);
      
      // Se chegou aqui sem erro, commita a transação
      // Mas só se a resposta ainda não foi enviada
      if (!res.headersSent) {
        await transaction.commit();
      } else {
        // Se a resposta já foi enviada, verifica se foi sucesso
        // Se não, faz rollback
        if (res.statusCode >= 400) {
          await transaction.rollback();
        } else {
          await transaction.commit();
        }
      }
    } catch (error) {
      // Em caso de erro, faz rollback
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Erro ao fazer rollback da transação:', rollbackError);
      }
      
      // Passa o erro para o error handler
      next(error);
    }
  };
};

/**
 * Helper para executar código dentro de uma transação manualmente
 * Útil quando você precisa de controle mais fino sobre a transação
 * 
 * @param {Function} callback - Função async que recebe a transação como parâmetro
 * @returns {Promise} Resultado da callback
 */
const executeInTransaction = async (callback) => {
  const transaction = await sequelize.transaction();
  
  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  withTransaction,
  executeInTransaction
};

