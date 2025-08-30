import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../core/services/data.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-consultation-form',
  templateUrl: './consultation-form.component.html',
  styleUrls: ['./consultation-form.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule]
})
export class ConsultationFormComponent {
  consultationForm: FormGroup;
  abertura: any = null;
  consulta: any = null;
  sucesso = false;

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private dataService: DataService) {
    this.consultationForm = this.fb.group({
      anotacoes: ['', Validators.required],
      prescricao: ['', Validators.required],
      exames: ['', Validators.required]
    });

    this.route.paramMap.subscribe(params => {
      const consultaId = params.get('id');
      if (consultaId) {
        const consulta = this.dataService.getConsultaById(Number(consultaId));
        this.consulta = consulta;
        if (consulta) {
          this.consultationForm.patchValue(consulta);
        }
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['aberturaId']) {
        const abertura = this.dataService.getAberturaById(Number(params['aberturaId']));
        this.abertura = abertura;
        if (abertura) {
          this.consultationForm.patchValue({
            anotacoes: `Consulta referente à abertura #${abertura.id} - ${abertura.nome} (${abertura.horario}, ${abertura.status})`
          });
        }
      }
    });
  }

  onSubmit() {
    if (this.consultationForm.valid) {
      if (this.consulta) {
        Object.assign(this.consulta, this.consultationForm.value);
      } else {
        this.dataService.addConsulta(this.consultationForm.value);
      }
      this.sucesso = true;
      setTimeout(() => this.sucesso = false, 3000);
      this.consultationForm.reset();
    } else {
      this.consultationForm.markAllAsTouched();
    }
  }
}
