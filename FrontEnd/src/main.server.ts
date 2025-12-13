import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';
import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';

// A função bootstrap é chamada pelo AngularNodeAppEngine com o BootstrapContext
// No Angular 19, o bootstrapApplication do platform-browser aceita o contexto como terceiro parâmetro
export default async function bootstrap(context: BootstrapContext) {
  return bootstrapApplication(AppComponent, config, context);
}
