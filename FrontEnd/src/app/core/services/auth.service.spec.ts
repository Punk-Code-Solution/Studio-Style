import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  // Token JWT "fake" mas com estrutura válida (Header.Payload.Signature)
  // O payload tem exp: 9999999999 (futuro distante)
  const validFutureToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTksInN1YiI6InRlc3QifQ.signature_fake';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule, 
        RouterTestingModule
      ],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });

  it('deve realizar login e armazenar token', () => {
    const mockResponse = {
      success: true,
      data: {
        token: validFutureToken,
        user: { id: '1', name: 'Test User', TypeAccount: { type: 'admin' } }
      }
    };

    service.login('test@test.com', '123456').subscribe(response => {
      expect(response.token).toBe(validFutureToken);
      expect(localStorage.getItem('auth_token')).toBe(validFutureToken);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('deve fazer logout e limpar localStorage', () => {
    localStorage.setItem('auth_token', 'token-antigo');
    service.logout();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });
});