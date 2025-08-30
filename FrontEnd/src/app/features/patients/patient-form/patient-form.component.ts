import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientService } from '../../../core/services/patient.service';
import { Patient } from '../../../core/models/patient.model';
import { NotificationService } from '../../../core/services/notification.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './patient-form.component.html',
  styleUrls: ['./patient-form.component.scss']
})
export class PatientFormComponent implements OnInit {
  patientForm: FormGroup;
  isEditMode = false;
  patientId: string | null = null;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.patientForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', [Validators.required, Validators.pattern(/^\(\d{2}\) \d{5}-\d{4}$/)]],
      status: ['ativo', Validators.required]
    });
  }

  ngOnInit() {
    this.patientId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.patientId;

    if (this.isEditMode && this.patientId) {
      this.loadPatient();
    }
  }

  loadPatient(): void {
    if (this.patientId) {
      this.patientService.getPatient(this.patientId.toString()).subscribe({
        next: (patient) => {
          this.patientForm.patchValue({
            nome: patient.nome,
            email: patient.email,
            telefone: patient.telefone,
            status: patient.status
          });
        },
        error: (error) => {
          console.error('Erro ao carregar paciente:', error);
          this.notificationService.error('Erro ao carregar dados do paciente.');
        }
      });
    }
  }

  onSubmit(): void {
    if (this.patientForm.valid) {
      this.isSubmitting = true;
      const formData = {
        nome: this.patientForm.get('nome')?.value,
        email: this.patientForm.get('email')?.value,
        telefone: this.patientForm.get('telefone')?.value,
        status: this.patientForm.get('status')?.value
      };

      const request = this.isEditMode
        ? this.patientService.updatePatient(Number(this.patientId), formData)
        : this.patientService.createPatient(formData);

      request.pipe(
        finalize(() => this.isSubmitting = false)
      ).subscribe({
        next: () => {
          this.notificationService.success(
            `Paciente ${this.isEditMode ? 'atualizado' : 'criado'} com sucesso!`
          );
          this.router.navigate(['/patients']);
        },
        error: (error) => {
          console.error(`Erro ao ${this.isEditMode ? 'atualizar' : 'criar'} paciente:`, error);
          this.notificationService.error(
            `Erro ao ${this.isEditMode ? 'atualizar' : 'criar'} paciente.`
          );
        }
      });
    } else {
      this.notificationService.warning('Por favor, preencha todos os campos obrigatórios corretamente.');
    }
  }

  onCancel() {
    this.router.navigate(['/patients']);
  }
}
