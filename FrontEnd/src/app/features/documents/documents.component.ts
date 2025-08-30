import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

interface Consultation {
  id: number;
  patientName: string;
  patientEmail: string;
  date: string;
  time: string;
  status: 'agendado' | 'em_andamento' | 'concluido' | 'cancelado';
  documents: {
    id: number;
    name: string;
    type: string;
    url: string;
    uploadedAt: string;
  }[];
}

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="header">
        <h2>Documentos das Consultas</h2>
        <div class="filters">
          <div class="filter-group">
            <label for="dateFilter">Data:</label>
            <input 
              type="date" 
              id="dateFilter" 
              [(ngModel)]="dateFilter"
              (change)="applyFilters()"
            >
          </div>
          <div class="filter-group">
            <label for="patientFilter">Paciente:</label>
            <input 
              type="text" 
              id="patientFilter" 
              [(ngModel)]="patientFilter"
              (input)="applyFilters()"
              placeholder="Buscar por nome do paciente"
            >
          </div>
        </div>
      </div>

      <div class="consultations-list">
        <div class="consultation-card" *ngFor="let consultation of filteredConsultations">
          <div class="consultation-header">
            <div class="patient-info">
              <h3>{{ consultation.patientName }}</h3>
              <p class="date">{{ formatDate(consultation.date) }} às {{ consultation.time }}</p>
              <p class="status" [ngClass]="consultation.status">
                {{ getStatusLabel(consultation.status) }}
              </p>
            </div>
            <div class="actions">
              <button class="action-btn email" (click)="sendEmail(consultation)">
                <i class="fas fa-envelope"></i>
                Enviar por Email
              </button>
              <button class="action-btn download" (click)="downloadDocuments(consultation)">
                <i class="fas fa-download"></i>
                Download
              </button>
            </div>
          </div>

          <div class="documents-section">
            <h4>Documentos</h4>
            <div class="documents-list" *ngIf="consultation.documents.length > 0">
              <div class="document-item" *ngFor="let doc of consultation.documents">
                <div class="document-info">
                  <i class="fas" [ngClass]="getDocumentIcon(doc.type)"></i>
                  <span>{{ doc.name }}</span>
                  <span class="upload-date">{{ formatDate(doc.uploadedAt) }}</span>
                </div>
                <div class="document-actions">
                  <button class="icon-btn" (click)="previewDocument(doc)">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="icon-btn" (click)="downloadDocument(doc)">
                    <i class="fas fa-download"></i>
                  </button>
                </div>
              </div>
            </div>
            <p class="no-documents" *ngIf="consultation.documents.length === 0">
              Nenhum documento disponível para esta consulta.
            </p>
          </div>
        </div>

        <p class="no-consultations" *ngIf="filteredConsultations.length === 0">
          Nenhuma consulta encontrada com os filtros selecionados.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 2rem;
    }

    .header {
      margin-bottom: 2rem;

      h2 {
        color: #1976d2;
        margin: 0 0 1rem 0;
      }
    }

    .filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      label {
        color: #666;
        font-size: 0.875rem;
      }

      input {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.875rem;

        &:focus {
          outline: none;
          border-color: #1976d2;
        }
      }
    }

    .consultations-list {
      display: grid;
      gap: 1.5rem;
    }

    .consultation-card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .consultation-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .patient-info {
      h3 {
        color: #333;
        margin: 0 0 0.5rem 0;
      }

      .date {
        color: #666;
        margin: 0.25rem 0;
        font-size: 0.875rem;
      }
    }

    .status {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.875rem;
      margin-top: 0.5rem;

      &.agendado {
        background: #e3f2fd;
        color: #1976d2;
      }

      &.em_andamento {
        background: #fff3e0;
        color: #f57c00;
      }

      &.concluido {
        background: #e8f5e9;
        color: #388e3c;
      }

      &.cancelado {
        background: #ffebee;
        color: #d32f2f;
      }
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;

      &.email {
        background: #1976d2;
        color: white;

        &:hover {
          background: #1565c0;
        }
      }

      &.download {
        background: #f5f5f5;
        color: #666;

        &:hover {
          background: #e0e0e0;
        }
      }
    }

    .documents-section {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;

      h4 {
        color: #333;
        margin: 0 0 1rem 0;
      }
    }

    .documents-list {
      display: grid;
      gap: 0.75rem;
    }

    .document-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 4px;
    }

    .document-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      i {
        color: #666;
        font-size: 1.25rem;
      }

      .upload-date {
        color: #666;
        font-size: 0.75rem;
      }
    }

    .document-actions {
      display: flex;
      gap: 0.5rem;
    }

    .icon-btn {
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      transition: all 0.2s;

      &:hover {
        background: #e0e0e0;
        color: #333;
      }
    }

    .no-documents, .no-consultations {
      text-align: center;
      color: #666;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 4px;
    }
  `]
})
export class DocumentsComponent implements OnInit {
  consultations: Consultation[] = [];
  filteredConsultations: Consultation[] = [];
  dateFilter: string = '';
  patientFilter: string = '';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadConsultations();
  }

  loadConsultations() {
    // Simular carregamento de consultas com documentos
    this.consultations = [
      {
        id: 1,
        patientName: 'João Silva',
        patientEmail: 'joao.silva@email.com',
        date: '2024-03-20',
        time: '14:00',
        status: 'concluido',
        documents: [
          {
            id: 1,
            name: 'Exames Laboratoriais.pdf',
            type: 'pdf',
            url: '/assets/documents/exames.pdf',
            uploadedAt: '2024-03-19'
          },
          {
            id: 2,
            name: 'Raio-X.jpg',
            type: 'image',
            url: '/assets/documents/raio-x.jpg',
            uploadedAt: '2024-03-19'
          }
        ]
      },
      {
        id: 2,
        patientName: 'Maria Oliveira',
        patientEmail: 'maria.oliveira@email.com',
        date: '2024-03-20',
        time: '15:30',
        status: 'em_andamento',
        documents: [
          {
            id: 3,
            name: 'Laudo Médico.pdf',
            type: 'pdf',
            url: '/assets/documents/laudo.pdf',
            uploadedAt: '2024-03-20'
          }
        ]
      }
    ];
    this.applyFilters();
  }

  applyFilters() {
    this.filteredConsultations = this.consultations.filter(consultation => {
      const matchesDate = !this.dateFilter || consultation.date === this.dateFilter;
      const matchesPatient = !this.patientFilter || 
        consultation.patientName.toLowerCase().includes(this.patientFilter.toLowerCase());
      return matchesDate && matchesPatient;
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR');
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'agendado': 'Agendado',
      'em_andamento': 'Em Andamento',
      'concluido': 'Concluído',
      'cancelado': 'Cancelado'
    };
    return labels[status] || status;
  }

  getDocumentIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'pdf': 'fa-file-pdf',
      'image': 'fa-file-image',
      'doc': 'fa-file-word',
      'xls': 'fa-file-excel'
    };
    return icons[type] || 'fa-file';
  }

  sendEmail(consultation: Consultation) {
    // Implementar lógica de envio de email
    console.log('Enviando documentos por email para:', consultation.patientEmail);
    // Aqui você pode implementar a lógica real de envio de email
  }

  downloadDocuments(consultation: Consultation) {
    // Implementar lógica de download de todos os documentos
    console.log('Baixando todos os documentos da consulta:', consultation.id);
    // Aqui você pode implementar a lógica real de download
  }

  previewDocument(document: any) {
    // Implementar lógica de preview do documento
    console.log('Visualizando documento:', document.name);
    // Aqui você pode implementar a lógica real de preview
  }

  downloadDocument(document: any) {
    // Implementar lógica de download do documento individual
    console.log('Baixando documento:', document.name);
    // Aqui você pode implementar a lógica real de download
  }

  canEditField(field: string): boolean {
    return this.authService.canEditField(field);
  }
}
