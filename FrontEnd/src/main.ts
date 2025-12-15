import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

console.log('🚀 [MAIN] Iniciando aplicação Angular...');
console.log('🚀 [MAIN] URL atual:', window.location.href);
console.log('🚀 [MAIN] Pathname:', window.location.pathname);
console.log('🚀 [MAIN] Base href:', document.querySelector('base')?.getAttribute('href') || 'não encontrado');

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    console.log('✅ [MAIN] Aplicação Angular inicializada com sucesso');
    console.log('✅ [MAIN] Router configurado e pronto');
  })
  .catch((err) => {
    console.error('❌ [MAIN] Erro ao inicializar aplicação:', err);
  });
