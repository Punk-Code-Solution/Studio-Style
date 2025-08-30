import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { PatientService } from '../../../core/services/patient.service';
import { ConsultationService } from '../../../core/services/consultation.service';
import { Patient } from '../../../core/models/patient.model';
import { Consultation } from '../../../core/models/consultation.model';
import { AuditLogService } from '../../../core/services/audit-log.service';

@Component({
  selector: 'app-patient-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="patient-details-container">
      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <div class="spinner"></div>
        <span>Carregando dados do paciente...</span>
      </div>

      <!-- Error Message -->
      <div class="error-message" *ngIf="errorMessage">
        <i class="fas fa-exclamation-circle"></i>
        {{ errorMessage }}
        <button class="retry-btn" (click)="retryLoading()">
          <i class="fas fa-redo"></i>
          Tentar Novamente
        </button>
      </div>

      <!-- Patient Info -->
      <div class="patient-info" *ngIf="patient && !isLoading">
        <div class="header">
          <div class="patient-header">
            <img [src]="patient.avatar || 'assets/images/default-avatar.png'" [alt]="patient.nome" class="avatar">
            <div class="patient-title">
              <h1>{{ patient.nome }}</h1>
              <span class="status-badge" [class]="patient.status">
                {{ patient.status === 'ativo' ? 'Ativo' : 'Inativo' }}
              </span>
            </div>
          </div>
          <div class="actions">
            <button class="action-btn" [routerLink]="['/patients', patient.id, 'edit']" title="Editar paciente">
              <i class="fas fa-edit"></i>
              Editar Paciente
            </button>
            <button class="action-btn delete" (click)="deletePatient()" title="Excluir paciente">
              <i class="fas fa-trash"></i>
              Excluir Paciente
            </button>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-card">
            <h3>Informações Pessoais</h3>
            <div class="info-item">
              <span class="label">Email:</span>
              <span class="value">{{ patient.email }}</span>
            </div>
            <div class="info-item">
              <span class="label">Telefone:</span>
              <span class="value">{{ patient.telefone }}</span>
            </div>
          </div>

          <div class="info-card">
            <h3>Últimas Visitas</h3>
            <div class="info-item">
              <span class="label">Última Visita:</span>
              <span class="value">{{ patient.ultimaVisita | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Próxima Consulta:</span>
              <span class="value">{{ patient.proximaConsulta ? (patient.proximaConsulta | date:'dd/MM/yyyy') : 'Não agendada' }}</span>
            </div>
          </div>
        </div>

        <!-- Consultations Section -->
        <div class="consultations-section">
          <div class="section-header">
            <h2>Histórico de Consultas</h2>
            <button class="add-btn" [routerLink]="['/consultations/new']" [queryParams]="{ patientId: patient.id }">
              <i class="fas fa-plus"></i>
              Nova Consulta
            </button>
          </div>

          <div class="consultations-list" *ngIf="consultations.length > 0">
            <div class="consultation-card" *ngFor="let consultation of consultations">
              <div class="consultation-header">
                <div class="consultation-info">
                  <h4>{{ consultation.data | date:'dd/MM/yyyy' }} {{ consultation.horario }}</h4>
                  <span class="status-badge" [class]="consultation.status">
                    {{ getConsultationStatusLabel(consultation.status) }}
                  </span>
                </div>
                <div class="consultation-actions">
                  <button class="action-btn" [routerLink]="['/consultations', consultation.id]" title="Ver detalhes">
                    <i class="fas fa-eye"></i>
                    Ver Detalhes
                  </button>
                </div>
              </div>
              <div class="consultation-details">
                <p class="doctor">
                  <i class="fas fa-user-md"></i>
                  Dr(a). {{ consultation.medico }}
                </p>
                <p class="notes" *ngIf="consultation.observacoes">
                  {{ consultation.observacoes }}
                </p>
              </div>
            </div>
          </div>

          <div class="empty-state" *ngIf="consultations.length === 0">
            <i class="fas fa-calendar-times"></i>
            <h3>Nenhuma consulta registrada</h3>
            <p>Este paciente ainda não possui consultas registradas no sistema.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .patient-details-container {
      padding: 2rem;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      color: #666;

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #1976d2;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    }

    .error-message {
      background: #ffebee;
      color: #d32f2f;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      i {
        font-size: 1.25rem;
      }

      .retry-btn {
        margin-left: auto;
        background: transparent;
        border: 1px solid #d32f2f;
        color: #d32f2f;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;

        &:hover {
          background: rgba(211, 47, 47, 0.1);
        }
      }
    }

    .patient-info {
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }

      .patient-header {
        display: flex;
        align-items: center;
        gap: 1.5rem;

        .avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
        }

        .patient-title {
          h1 {
            margin: 0;
            color: #333;
            font-size: 1.75rem;
          }
        }
      }

      .actions {
        display: flex;
        gap: 1rem;
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .info-card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);

      h3 {
        margin: 0 0 1rem;
        color: #333;
        font-size: 1.25rem;
      }

      .info-item {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid #eee;

        &:last-child {
          border-bottom: none;
        }

        .label {
          color: #666;
        }

        .value {
          color: #333;
          font-weight: 500;
        }
      }
    }

    .consultations-section {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;

        h2 {
          margin: 0;
          color: #333;
        }
      }
    }

    .consultations-list {
      display: grid;
      gap: 1rem;
    }

    .consultation-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1rem;

      .consultation-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;

        .consultation-info {
          h4 {
            margin: 0 0 0.5rem;
            color: #333;
          }
        }
      }

      .consultation-details {
        .doctor {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #666;
          margin: 0 0 0.5rem;

          i {
            color: #1976d2;
          }
        }

        .notes {
          color: #666;
          margin: 0;
          font-size: 0.875rem;
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #666;

      i {
        font-size: 3rem;
        color: #ddd;
        margin-bottom: 1rem;
      }

      h3 {
        margin: 0 0 0.5rem;
        color: #333;
      }

      p {
        margin: 0;
      }
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 500;

      &.ativo {
        background: #e8f5e9;
        color: #388e3c;
      }

      &.inativo {
        background: #ffebee;
        color: #d32f2f;
      }

      &.agendada {
        background: #e3f2fd;
        color: #1976d2;
      }

      &.em_andamento {
        background: #fff3e0;
        color: #f57c00;
      }

      &.concluida {
        background: #e8f5e9;
        color: #388e3c;
      }

      &.cancelada {
        background: #ffebee;
        color: #d32f2f;
      }
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
      background: #1976d2;
      color: white;

      &:hover {
        background: #1565c0;
      }

      &.delete {
        background: #f44336;

        &:hover {
          background: #d32f2f;
        }
      }
    }

    .add-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
      background: #4caf50;
      color: white;

      &:hover {
        background: #388e3c;
      }
    }

    @media (max-width: 768px) {
      .patient-info {
        .header {
          flex-direction: column;
          gap: 1rem;
        }

        .actions {
          width: 100%;
          flex-direction: column;
        }

        .action-btn {
          width: 100%;
          justify-content: center;
        }
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .consultation-card {
        .consultation-header {
          flex-direction: column;
          gap: 1rem;
          align-items: flex-start;
        }

        .consultation-actions {
          width: 100%;
        }

        .action-btn {
          width: 100%;
          justify-content: center;
        }
      }
    }
  `]
})
export class PatientDetailsComponent implements OnInit {
  patient: Patient | null = null;
  consultations: Consultation[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService,
    private consultationService: ConsultationService,
    private auditLogService: AuditLogService
  ) {}

  ngOnInit() {
    const patientId = this.route.snapshot.paramMap.get('id');
    if (patientId) {
      this.loadPatientData(patientId);
      this.loadPatientConsultations(patientId);
    }

    if (this.patient) {
      this.auditLogService.addLog({
        timestamp: new Date(),
        user: 'current',
        action: 'view',
        targetType: 'patient',
        targetId: this.patient.id.toString()
      });
    }
  }

  loadPatientData(patientId: string) {
    this.isLoading = true;
    this.errorMessage = null;

    this.patientService.getPatient(patientId).subscribe({
      next: (patient) => {
        this.patient = patient;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar dados do paciente:', error);
        this.errorMessage = 'Não foi possível carregar os dados do paciente. Por favor, tente novamente.';
        this.isLoading = false;
      }
    });
  }

  loadPatientConsultations(patientId: string) {
    this.consultationService.getConsultations().subscribe({
      next: (consultations) => {
        this.consultations = consultations
          .filter(c => c.pacienteId === +patientId)
          .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      },
      error: (error) => {
        console.error('Erro ao carregar consultas do paciente:', error);
      }
    });
  }

  retryLoading() {
    const patientId = this.route.snapshot.paramMap.get('id');
    if (patientId) {
      this.loadPatientData(patientId);
      this.loadPatientConsultations(patientId);
    }
  }

  deletePatient() {
    if (this.patient && confirm(`Tem certeza que deseja excluir o paciente ${this.patient.nome}?`)) {
      this.patientService.deletePatient(this.patient.id).subscribe({
        next: () => {
          this.router.navigate(['/patients']);
        },
        error: (error) => {
          console.error('Erro ao excluir paciente:', error);
          this.errorMessage = 'Não foi possível excluir o paciente. Por favor, tente novamente.';
        }
      });
    }
  }

  getConsultationStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
      'scheduled': 'Agendada',
      'in_progress': 'Em Andamento',
      'completed': 'Concluída',
      'cancelled': 'Cancelada'
    };
    return statusLabels[status] || status;
  }
}
