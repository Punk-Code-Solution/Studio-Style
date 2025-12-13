import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideServerRouting, ServerRoute } from '@angular/ssr';
import { appConfig } from './app.config';
import { routes } from './app.routes';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideServerRouting(routes as ServerRoute[])
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
