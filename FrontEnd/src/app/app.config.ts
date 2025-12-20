import { ApplicationConfig, Provider } from '@angular/core';
import { provideRouter, withDebugTracing, withRouterConfig } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/services/http-auth.interceptor';
import { LoggingService } from './core/services/logging.service';
import { environment } from '../environments/environment';

import { routes } from './app.routes';

console.log('⚙️ [CONFIG] Configurando aplicação Angular...');
console.log('⚙️ [CONFIG] Ambiente:', environment.production ? 'PRODUÇÃO' : 'DESENVOLVIMENTO');
console.log('⚙️ [CONFIG] Total de rotas configuradas:', routes.length);
console.log('⚙️ [CONFIG] Rotas:', routes.map(r => r.path || 'root'));

const loggingProvider: Provider = {
  provide: LoggingService,
  useFactory: () => new LoggingService(environment)
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      // Adiciona debug tracing em desenvolvimento
      ...(environment.production ? [] : [withDebugTracing()]),
      withRouterConfig({
        onSameUrlNavigation: 'reload'
      })
    ),
    provideClientHydration(),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    loggingProvider
  ]
};
