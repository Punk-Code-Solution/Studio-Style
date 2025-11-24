/**
 * Setup file para testes Jest
 * Configurações globais para os testes
 */

// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test';

// Timeout padrão para testes
jest.setTimeout(10000);

// Suprimir logs durante os testes (opcional)
global.console = {
  ...console,
  // Manter apenas erros e warnings
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};

