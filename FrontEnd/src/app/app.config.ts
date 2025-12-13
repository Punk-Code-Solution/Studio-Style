import { ApplicationConfig, Provider } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/services/http-auth.interceptor';
import { LoggingService } from './core/services/logging.service';
import { environment } from '../environments/environment';

import { routes } from './app.routes';

const loggingProvider: Provider = {
  provide: LoggingService,
  useFactory: () => new LoggingService(environment)
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    loggingProvider
  ]
};
