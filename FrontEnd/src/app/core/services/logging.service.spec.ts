import { TestBed } from '@angular/core/testing';
import { LoggingService } from './logging.service';

describe('LoggingService', () => {
  let service: LoggingService;
  let consoleSpy: {
    log: jasmine.Spy;
    warn: jasmine.Spy;
    error: jasmine.Spy;
  };

  beforeEach(() => {
    // Criar um spy para o console
    consoleSpy = {
      log: jasmine.createSpy('console.log'),
      warn: jasmine.createSpy('console.warn'),
      error: jasmine.createSpy('console.error')
    };
    
    // Substituir os métodos do console pelos nossos spies
    spyOn(console, 'log').and.callFake(consoleSpy.log);
    spyOn(console, 'warn').and.callFake(consoleSpy.warn);
    spyOn(console, 'error').and.callFake(consoleSpy.error);
    
    TestBed.configureTestingModule({
      providers: [
        LoggingService,
        { provide: 'environment', useValue: { production: false } }
      ]
    });
    
    service = TestBed.inject(LoggingService);
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });

  it('deve registrar mensagens de log em desenvolvimento', () => {
    const testMessage = 'Teste de log';
    
    service.log(testMessage);
    
    expect(consoleSpy.log).toHaveBeenCalledWith(
      jasmine.stringContaining(testMessage),
      undefined
    );
  });

  it('não deve registrar logs em produção', () => {
    // Criar uma instância separada para teste de produção
    const prodService = new LoggingService({ production: true });
    
    prodService.log('Mensagem que não deve aparecer');
    
    expect(consoleSpy.log).not.toHaveBeenCalled();
  });

  it('deve registrar erros em qualquer ambiente', () => {
    const errorMessage = 'Erro crítico';
    const error = new Error('Erro de teste');
    
    service.error(errorMessage, error);
    
    expect(consoleSpy.error).toHaveBeenCalledWith(
      jasmine.stringContaining(errorMessage),
      jasmine.objectContaining({
        message: error.message,
        stack: jasmine.any(String)
      })
    );
  });

  it('deve sanitizar dados sensíveis', () => {
    const sensitiveData = {
      password: 'senha123',
      token: 'token-secreto',
      user: { 
        email: 'teste@exemplo.com',
        password: 'outrasenha' // Deve ser sanitizado mesmo em objeto aninhado
      }
    };
    
    service.log('Teste de dados sensíveis', sensitiveData);
    
    expect(consoleSpy.log).toHaveBeenCalledWith(
      jasmine.any(String),
      {
        password: '***REDACTED***',
        token: '***REDACTED***',
        user: { 
          email: 'teste@exemplo.com',
          password: '***REDACTED***'
        }
      }
    );
  });

  it('deve lidar com arrays corretamente', () => {
    const dataWithArray = {
      users: [
        { name: 'João', password: 'senha123' },
        { name: 'Maria', token: 'token123' }
      ]
    };
    
    service.log('Teste com array', dataWithArray);
    
    expect(consoleSpy.log).toHaveBeenCalledWith(
      jasmine.any(String),
      {
        users: [
          { name: 'João', password: '***REDACTED***' },
          { name: 'Maria', token: '***REDACTED***' }
        ]
      }
    );
  });

  it('deve lidar com valores nulos ou indefinidos', () => {
    service.log('Teste com null', null);
    service.log('Teste com undefined', undefined);
    
    expect(consoleSpy.log.calls.argsFor(0)).toEqual([
      jasmine.stringContaining('Teste com null'),
      null
    ]);
    
    expect(consoleSpy.log.calls.argsFor(1)).toEqual([
      jasmine.stringContaining('Teste com undefined'),
      undefined
    ]);
  });
});
