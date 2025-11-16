import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-employee-form',
  templateUrl: './employee-form.component.html',
  styleUrls: ['./employee-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class EmployeeFormComponent implements OnInit {
  employeeForm: FormGroup;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.employeeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      lastname: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      department: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10,11}$/)]],
      address: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // TODO: Implementar lógica de edição
  }

  onSubmit() {
    if (this.employeeForm.valid) {
      // TODO: Implementar salvamento
      this.router.navigate(['/employees']);
    }
  }

  getErrorMessage(controlName: string): string {
    const control = this.employeeForm.get(controlName);
    if (!control) return '';

    if (control.hasError('required')) {
      return 'Este campo é obrigatório';
    }

    if (control.hasError('email')) {
      return 'Email inválido';
    }

    if (control.hasError('minlength')) {
      return `Mínimo de ${control.errors?.['minlength'].requiredLength} caracteres`;
    }

    if (control.hasError('pattern')) {
      return 'Formato inválido';
    }

    return '';
  }
} 