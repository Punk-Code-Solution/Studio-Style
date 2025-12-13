import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';
import { bootstrapApplication } from '@angular/platform-browser';

export default async function bootstrap() {
  return bootstrapApplication(AppComponent, config);
}
