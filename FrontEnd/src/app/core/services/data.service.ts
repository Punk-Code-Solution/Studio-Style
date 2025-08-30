import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private pacientes = [
    { id: 1, nome: 'João Silva' },
    { id: 2, nome: 'Maria Oliveira' },
    { id: 3, nome: 'Carlos Souza' }
  ];

  private aberturas = [
    { id: 1, nome: 'João Silva', horario: '13:50', status: 'concluido', tempo: 45 },
    { id: 2, nome: 'Maria Oliveira', horario: '09:50', status: 'atrasado', tempo: 38 },
    { id: 3, nome: 'Carlos Souza', horario: '14:50', status: 'aguardando', tempo: 25 }
  ];

  public consultas = [
    { id: 1, pacienteId: 1, anotacoes: 'Consulta 1', prescricao: '', exames: '' },
    { id: 2, pacienteId: 2, anotacoes: 'Consulta 2', prescricao: '', exames: '' }
  ];

  constructor() { }

  // Pacientes
  getPacientes() {
    return [...this.pacientes];
  }
  getPacienteById(id: number) {
    return this.pacientes.find(p => p.id === id);
  }
  addPaciente(paciente: any) {
    paciente.id = this.pacientes.length + 1;
    this.pacientes.push(paciente);
  }
  updatePaciente(id: number, data: any) {
    const idx = this.pacientes.findIndex(p => p.id === id);
    if (idx > -1) this.pacientes[idx] = { ...this.pacientes[idx], ...data };
  }

  // Aberturas
  getAberturas() {
    return [...this.aberturas];
  }
  getAberturaById(id: number) {
    return this.aberturas.find(a => a.id === id);
  }

  // Consultas
  getConsultas() {
    return [...this.consultas];
  }
  getConsultaById(id: number) {
    return this.consultas.find(c => c.id === id);
  }
  addConsulta(consulta: any) {
    consulta.id = this.consultas.length + 1;
    this.consultas.push(consulta);
  }
}
