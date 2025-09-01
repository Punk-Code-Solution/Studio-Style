import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-consultation-form',
  templateUrl: './service-form.component.html',
  styleUrls: ['./service-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class ConsultationFormComponent implements OnInit {
  consultationForm: FormGroup;
  isEditMode = false;
  attachments: File[] = [];
  previousRoute: string = '/consultations';

  constructor(
    private fb: FormBuilder,
    public router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {
    this.consultationForm = this.fb.group({
      patientId: ['', Validators.required],
      doctorId: ['', Validators.required],
      date: ['', Validators.required],
      time: ['', Validators.required],
      type: ['', Validators.required],
      notes: [''],
      status: ['scheduled']
    });
  }

  ngOnInit(): void {
    // Get the previous route from the query parameters
    this.route.queryParams.subscribe(params => {
      if (params['from']) {
        this.previousRoute = params['from'];
      }
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.attachments = Array.from(input.files);
    }
  }

  printConsultation() {
    window.print();
  }

  onSubmit() {
    if (this.consultationForm.valid) {
      // TODO: Implementar salvamento, incluindo anexos
      console.log(this.consultationForm.value, this.attachments);
      this.notificationService.success('Consulta salva com sucesso!');
      this.router.navigate(['/consultations']);
    }
  }

  cancel() {
    this.router.navigate(['/consultations']);
  }

  getErrorMessage(controlName: string): string {
    const control = this.consultationForm.get(controlName);
    if (!control) return '';

    if (control.hasError('required')) {
      return 'Este campo é obrigatório';
    }

    return '';
  }
}
