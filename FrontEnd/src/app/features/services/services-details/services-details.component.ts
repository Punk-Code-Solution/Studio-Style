import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ConsultationService } from '../../../core/services/consultation.service';
import { Consultation } from '../../../core/models/consultation.model';
import { PatientService } from '../../../core/services/patient.service';
import { Patient } from '../../../core/models/patient.model';
import { DocumentService, Document } from '../../../core/services/document.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuditLogService } from '../../../core/services/audit-log.service';

@Component({
  selector: 'app-consultation-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-container" role="main" aria-label="Detalhes da Consulta">
      <div class="header">
        <h2>Detalhes da Consulta</h2>
      </div>

      <div class="consultation-details" *ngIf="consultation">
        <div class="section">
          <h3>Informações Básicas</h3>
          <div class="form-group">
            <label for="pacienteId">Paciente</label>
            <input 
              type="text" 
              id="pacienteId" 
              [(ngModel)]="patientName"
              disabled
            >
          </div>

          <div class="form-group">
            <label for="data">Data</label>
            <input 
              type="date" 
              id="data" 
              [(ngModel)]="consultation.data"
              [disabled]="!canEditField('all')"
            >
          </div>

          <div class="form-group">
            <label for="horario">Horário</label>
            <input 
              type="time" 
              id="horario" 
              [(ngModel)]="consultation.horario"
              [disabled]="!canEditField('all')"
            >
          </div>

          <div class="form-group">
            <label for="status">Status</label>
            <select 
              id="status" 
              [(ngModel)]="consultation.status"
              [disabled]="!canEditField('all')"
            >
              <option value="agendada">Agendada</option>
              <option value="confirmada">Confirmada</option>
              <option value="realizada">Realizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div class="form-group">
            <label for="medico">Médico</label>
            <input 
              type="text" 
              id="medico" 
              [(ngModel)]="consultation.medico"
              [disabled]="!canEditField('all')"
            >
          </div>
        </div>

        <div class="section">
          <h3>Detalhes da Consulta</h3>
          <div class="form-group">
            <label for="sintomas">Sintomas</label>
            <textarea 
              id="sintomas" 
              [(ngModel)]="consultation.sintomas"
              [disabled]="!canEditField('all')"
              rows="4"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="diagnostico">Diagnóstico</label>
            <textarea 
              id="diagnostico" 
              [(ngModel)]="consultation.diagnostico"
              [disabled]="!canEditField('all')"
              rows="4"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="prescricao">Prescrição</label>
            <textarea 
              id="prescricao" 
              [(ngModel)]="consultation.prescricao"
              [disabled]="!canEditField('all')"
              rows="4"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="observacoes">Observações</label>
            <textarea 
              id="observacoes" 
              [(ngModel)]="consultation.observacoes"
              [disabled]="!canEditField('all')"
              rows="4"
            ></textarea>
          </div>
        </div>

        <div class="section">
          <h3>Anexos</h3>
          <div class="attachments-list" *ngIf="documents.length > 0" role="list" aria-label="Lista de anexos">
            <div class="attachment-item" *ngFor="let doc of documents" role="listitem">
              <div class="document-info">
                <i class="fas" [ngClass]="getDocumentIcon(doc.type)" aria-hidden="true"></i>
                <span>{{ doc.name }}</span>
                <span class="upload-date">{{ formatDate(doc.uploadedAt) }}</span>
              </div>
              <div class="document-actions">
                <button 
                  class="icon-btn" 
                  (click)="previewDocument(doc)"
                  [attr.aria-label]="'Visualizar ' + doc.name"
                >
                  <i class="fas fa-eye" aria-hidden="true"></i>
                </button>
                <button 
                  class="icon-btn" 
                  (click)="downloadDocument(doc)"
                  [attr.aria-label]="'Baixar ' + doc.name"
                >
                  <i class="fas fa-download" aria-hidden="true"></i>
                </button>
                <button 
                  class="icon-btn" 
                  (click)="sendDocumentByEmail(doc)"
                  [attr.aria-label]="'Enviar ' + doc.name + ' por email'"
                >
                  <i class="fas fa-envelope" aria-hidden="true"></i>
                </button>
                <button 
                  class="remove-btn" 
                  (click)="removeDocument(doc)"
                  *ngIf="canEditField('all')"
                  [attr.aria-label]="'Remover ' + doc.name"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>

          <div class="upload-section" *ngIf="canEditField('all')">
            <input 
              type="file" 
              #fileInput 
              style="display: none"
              (change)="onFileSelected($event)"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              [attr.aria-label]="'Selecionar arquivos para upload'"
            >
            <button 
              class="upload-btn" 
              (click)="fileInput.click()"
              [attr.aria-label]="'Adicionar anexos'"
            >
              <i class="fas fa-upload" aria-hidden="true"></i>
              Adicionar Anexos
            </button>
          </div>

          <div class="upload-progress" *ngIf="isUploading">
            <div class="progress-bar">
              <div class="progress" [style.width.%]="uploadProgress"></div>
            </div>
            <span>{{ uploadProgress }}%</span>
          </div>
        </div>

        <div class="actions">
          <button 
            class="save-btn" 
            (click)="saveConsultation()"
            *ngIf="canEditField('all')"
            [attr.aria-label]="'Salvar alterações'"
          >
            Salvar Alterações
          </button>
          <button 
            class="cancel-btn" 
            [routerLink]="['/dashboard']"
            [attr.aria-label]="'Voltar para o dashboard'"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    // Variáveis
    $primary-color: #1976d2;
    $secondary-color: #607D8B;
    $success-color: #4CAF50;
    $error-color: #F44336;
    $warning-color: #FFC107;
    $border-color: #E0E0E0;
    $background-color: #F5F5F5;
    $text-color: #333;
    $spacing: 1rem;
    $border-radius: 8px;
    $transition: all 0.3s ease;
    $box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    $hover-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);

    .page-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: $spacing * 2;
      background-color: $background-color;
      min-height: 100vh;
    }

    .header {
      background: white;
      padding: $spacing * 1.5;
      border-radius: $border-radius;
      box-shadow: $box-shadow;
      margin-bottom: $spacing * 2;

      h2 {
        color: $primary-color;
        margin: 0;
        font-size: 1.8rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;

        i {
          font-size: 1.6rem;
        }
      }
    }

    .consultation-details {
      .section {
        background: white;
        border-radius: $border-radius;
        padding: $spacing * 1.5;
        margin-bottom: $spacing * 1.5;
        box-shadow: $box-shadow;
        transition: $transition;

        &:hover {
          box-shadow: $hover-shadow;
        }

        h3 {
          color: $text-color;
          font-size: 1.4rem;
          margin: 0 0 $spacing 0;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid $border-color;
          display: flex;
          align-items: center;
          gap: 0.75rem;

          i {
            color: $primary-color;
            font-size: 1.3rem;
          }
        }
      }

      .form-group {
        margin-bottom: $spacing;

        label {
          display: block;
          margin-bottom: 0.5rem;
          color: $secondary-color;
          font-size: 0.9rem;
          font-weight: 500;
        }

        input, select, textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid $border-color;
          border-radius: 4px;
          background: white;
          font-size: 1rem;
          transition: $transition;

          &:focus {
            outline: none;
            border-color: $primary-color;
            box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
          }

          &:disabled {
            background: rgba($primary-color, 0.05);
            cursor: not-allowed;
            color: $secondary-color;
          }
        }

        textarea {
          resize: vertical;
          min-height: 120px;
          line-height: 1.5;
        }
      }

      .attachments-list {
        display: grid;
        gap: $spacing;
        margin-bottom: $spacing;
      }

      .attachment-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: $spacing;
        background: rgba($primary-color, 0.05);
        border-radius: $border-radius;
        transition: $transition;

        &:hover {
          background: rgba($primary-color, 0.08);
        }

        .document-info {
          display: flex;
          align-items: center;
          gap: $spacing;

          i {
            font-size: 1.5rem;
            color: $primary-color;
          }

          span {
            color: $text-color;
            font-size: 1rem;
          }

          .upload-date {
            color: $secondary-color;
            font-size: 0.875rem;
          }
        }

        .document-actions {
          display: flex;
          gap: 0.5rem;
        }
      }

      .upload-section {
        margin-top: $spacing;
        padding: $spacing;
        border: 2px dashed $border-color;
        border-radius: $border-radius;
        text-align: center;
        transition: $transition;

        &:hover {
          border-color: $primary-color;
          background: rgba($primary-color, 0.05);
        }
      }

      .actions {
        display: flex;
        gap: $spacing;
        margin-top: $spacing * 2;
        padding-top: $spacing;
        border-top: 1px solid $border-color;
      }

      .save-btn, .cancel-btn, .upload-btn, .remove-btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 500;
        transition: $transition;
        display: flex;
        align-items: center;
        gap: 0.5rem;

        i {
          font-size: 1.1rem;
        }

        &:hover {
          transform: translateY(-1px);
        }

        &:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba($primary-color, 0.2);
        }
      }

      .save-btn {
        background: $success-color;
        color: white;

        &:hover {
          background: color-mix(in srgb, $success-color 90%, black 10%);
        }
      }

      .cancel-btn {
        background: $secondary-color;
        color: white;

        &:hover {
          background: color-mix(in srgb, $secondary-color 90%, black 10%);
        }
      }

      .upload-btn {
        background: $primary-color;
        color: white;

        &:hover {
          background: color-mix(in srgb, $primary-color 90%, black 10%);
        }
      }

      .remove-btn {
        background: rgba($error-color, 0.1);
        color: $error-color;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;

        &:hover {
          background: rgba($error-color, 0.2);
        }
      }

      .upload-progress {
        margin-top: $spacing;
        display: flex;
        align-items: center;
        gap: $spacing;
        padding: $spacing;
        background: rgba($primary-color, 0.05);
        border-radius: $border-radius;

        .progress-bar {
          flex: 1;
          height: 6px;
          background: rgba($primary-color, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress {
          height: 100%;
          background: $primary-color;
          transition: width 0.3s ease;
        }

        span {
          color: $secondary-color;
          font-size: 0.875rem;
          font-weight: 500;
          min-width: 48px;
          text-align: right;
        }
      }

      .icon-btn {
        background: none;
        border: none;
        color: $secondary-color;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 4px;
        transition: $transition;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;

        i {
          font-size: 1.1rem;
        }

        &:hover {
          background: rgba($secondary-color, 0.1);
          color: color-mix(in srgb, $secondary-color 90%, black 10%);
        }

        &:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba($primary-color, 0.2);
        }
      }
    }

    // Responsividade
    @media (max-width: 768px) {
      .page-container {
        padding: $spacing;
      }

      .consultation-details {
        .section {
          padding: $spacing;
        }

        .attachment-item {
          flex-direction: column;
          gap: $spacing;
          align-items: flex-start;

          .document-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }

        .actions {
          flex-direction: column;

          button {
            width: 100%;
            justify-content: center;
          }
        }
      }
    }
  `]
})
export class ConsultationDetailsComponent implements OnInit {
  consultation: Consultation | null = null;
  patientName: string = '';
  documents: Document[] = [];
  isUploading = false;
  uploadProgress = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private consultationService: ConsultationService,
    private patientService: PatientService,
    private documentService: DocumentService,
    private notificationService: NotificationService,
    private auditLogService: AuditLogService
  ) {}

  ngOnInit() {
    const consultationId = this.route.snapshot.paramMap.get('id');
    if (consultationId) {
      this.consultationService.getConsultation(consultationId).subscribe({
        next: (data) => {
          this.consultation = data;
          this.loadPatientName();
          this.loadDocuments();
          if (this.consultation) {
            this.auditLogService.addLog({
              timestamp: new Date(),
              user: 'current', // Substitua pelo usuário real
              action: 'view',
              targetType: 'consultation',
              targetId: this.consultation.id.toString()
            });
          }
        },
        error: (error) => {
          console.error('Erro ao carregar consulta:', error);
          this.notificationService.error('Erro ao carregar dados da consulta.');
        }
      });
    }
  }

  loadPatientName() {
    if (this.consultation?.pacienteId) {
      this.patientService.getPatient(this.consultation.pacienteId.toString()).subscribe({
        next: (patient) => {
          this.patientName = patient.nome;
        },
        error: (error) => {
          console.error('Erro ao carregar nome do paciente:', error);
        }
      });
    }
  }

  loadDocuments() {
    if (this.consultation?.id) {
      this.documentService.getDocumentsByConsultation( this.consultation.id.toString() ).subscribe({
        next: (documents) => {
          this.documents = documents;
        },
        error: (error) => {
          console.error('Erro ao carregar documentos:', error);
          this.notificationService.error('Erro ao carregar documentos.');
        }
      });
    }
  }

  canEditField(field: string): boolean {
    return this.authService.canEditField(field);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && this.consultation) {
      this.isUploading = true;
      this.uploadProgress = 0;

      const files = Array.from(input.files);
      let uploadedCount = 0;

      files.forEach(file => {
        this.documentService.uploadDocument(file, this.consultation!.pacienteId.toString(), this.consultation!.id.toString())
          .subscribe({
            next: () => {
              uploadedCount++;
              this.uploadProgress = (uploadedCount / files.length) * 100;
              
              if (uploadedCount === files.length) {
                this.isUploading = false;
                this.loadDocuments();
                this.notificationService.success('Documentos enviados com sucesso!');
              }
            },
            error: (error) => {
              console.error('Erro ao fazer upload do documento:', error);
              this.notificationService.error('Erro ao fazer upload do documento.');
              this.isUploading = false;
            }
          });
      });
    }
  }

  removeDocument(document: Document) {
    if (confirm(`Deseja realmente remover o documento ${document.name}?`)) {
      this.documentService.deleteDocument(document.id).subscribe({
        next: () => {
          this.documents = this.documents.filter(d => d.id !== document.id);
          this.notificationService.success('Documento removido com sucesso!');
        },
        error: (error) => {
          console.error('Erro ao remover documento:', error);
          this.notificationService.error('Erro ao remover documento.');
        }
      });
    }
  }

   downloadDocument(doc: Document) {
  //   this.documentService.downloadDocument(doc.id).subscribe({
  //     next: (blob) => {
  //       const url = window.URL.createObjectURL(blob);
  //       const link = document.createElement('a');
  //       link.href = url;
  //       link.download = doc.name;
  //       link.click();
  //       window.URL.revokeObjectURL(url);
  //     },
  //     error: (error) => {
  //       console.error('Erro ao baixar documento:', error);
  //       this.notificationService.error('Erro ao baixar documento.');
  //     }
  //   });
  }

  previewDocument(doc: Document) {
  //   this.documentService.downloadDocument(doc.id).subscribe({
  //     next: (blob) => {
  //       const url = window.URL.createObjectURL(blob);
  //       window.open(url, '_blank');
  //       window.URL.revokeObjectURL(url);
  //     },
  //     error: (error) => {
  //       console.error('Erro ao visualizar documento:', error);
  //       this.notificationService.error('Erro ao visualizar documento.');
  //     }
  //   });
  }

  sendDocumentByEmail(document: Document) {
    if (this.consultation?.pacienteId) {
      this.patientService.getPatient(this.consultation.pacienteId.toString()).subscribe({
        next: (patient) => {
          this.documentService.sendDocumentByEmail(document.id, patient.email).subscribe({
            next: () => {
              this.notificationService.success('Documento enviado por email com sucesso!');
            },
            error: (error) => {
              console.error('Erro ao enviar documento por email:', error);
              this.notificationService.error('Erro ao enviar documento por email.');
            }
          });
        },
        error: (error) => {
          console.error('Erro ao obter email do paciente:', error);
          this.notificationService.error('Erro ao obter email do paciente.');
        }
      });
    }
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

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR');
  }

  saveConsultation() {
    if (this.consultation && this.consultation.id) {
      this.consultationService.updateConsultation(this.consultation.id, this.consultation).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Erro ao salvar consulta:', error);
        }
      });
    }
  }
} 