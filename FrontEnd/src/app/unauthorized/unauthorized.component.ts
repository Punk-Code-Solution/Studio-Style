import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="unauthorized-container">
      <div class="unauthorized-box">
        <h1>403</h1>
        <h2>Acesso Negado</h2>
        <p>Você não tem permissão para acessar esta página.</p>
        <button routerLink="/dashboard">Voltar ao Dashboard</button>
      </div>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #e3f0ff 0%, #f7fbff 100%);
    }

    .unauthorized-box {
      background: white;
      padding: 3rem;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      text-align: center;
      max-width: 400px;
    }

    h1 {
      font-size: 4rem;
      color: #d32f2f;
      margin: 0;
    }

    h2 {
      color: #1976d2;
      margin: 1rem 0;
    }

    p {
      color: #666;
      margin-bottom: 2rem;
    }

    button {
      padding: 0.8rem 1.5rem;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.2s;
    }

    button:hover {
      background: #1565c0;
    }
  `]
})
export class UnauthorizedComponent {} 