import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EmployeeService, Employee } from '../../../core/services/employee.service';

@Component({
  selector: 'app-employee-edit',
  templateUrl: './employee-edit.component.html',
  styleUrls: ['./employee-edit.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class EmployeeEditComponent implements OnInit {
  employeeForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.employeeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      department: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10,11}$/)]],
      address: ['', Validators.required],
      status: ['active', Validators.required]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEmployee(id);
    }
  }

  private loadEmployee(id: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.employeeService.getEmployeeById(id).subscribe({
      next: (employee: Employee) => {
        // Preparar dados do funcionário para o formulário
        const formData = {
          name: employee.name || '',
          lastname: employee.lastname || '',
          email: employee.email || '',
          role: employee.role || '',
          department: employee.department || '',
          phone: employee.phone || '',
          address: this.getAddressString(employee.address || employee.Adress),
          status: employee.status || 'active'
        };
        
        this.employeeForm.patchValue(formData);
        this.isLoading = false;
      },
      error: (error: Error) => {
        this.errorMessage = 'Erro ao carregar dados do funcionário. Por favor, tente novamente.';
        this.isLoading = false;
        console.error('Error loading employee:', error);
      }
    });
  }

  private getAddressString(address: any): string {
    // Se address é null ou undefined
    if (!address) {
      return '';
    }
    
    // Se address é uma string, retornar diretamente
    if (typeof address === 'string') {
      return address.trim();
    }
    
    // Se address é um array, pegar o primeiro elemento
    if (Array.isArray(address)) {
      if (address.length === 0) {
        return '';
      }
      address = address[0];
    }
    
    // Se address é um objeto, formatar as propriedades
    if (address && typeof address === 'object') {
      const parts: string[] = [];
      
      // Adicionar rua/road
      if (address.road && address.road.trim()) {
        parts.push(address.road.trim());
      }
      
      // Adicionar bairro/neighborhood
      if (address.neighborhood && address.neighborhood.trim()) {
        parts.push(address.neighborhood.trim());
      }
      
      // Adicionar cidade/city
      if (address.city && address.city.trim()) {
        parts.push(address.city.trim());
      }
      
      // Se tem CEP
      if (address.cep) {
        parts.push(`CEP: ${address.cep}`);
      }
      
      // Retornar endereço formatado
      return parts.join(', ');
    }
    
    return '';
  }

  onSubmit(): void {
    if (this.employeeForm.valid) {
      this.isLoading = true;
      const id = Number(this.route.snapshot.paramMap.get('id'));
      const employeeData = this.employeeForm.value;

      this.employeeService.updateEmployee(id, employeeData).subscribe({
        next: () => {
          this.router.navigate(['/employees']);
        },
        error: (error: Error) => {
          this.errorMessage = 'Erro ao atualizar funcionário. Por favor, tente novamente.';
          this.isLoading = false;
          console.error('Error updating employee:', error);
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/employees']);
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
      if (controlName === 'phone') {
        return 'Telefone inválido';
      }
    }

    return 'Campo inválido';
  }
} 