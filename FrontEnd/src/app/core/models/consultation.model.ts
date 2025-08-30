export interface Consultation {
  id: number;
  pacienteId: number;
  data: string;
  horario: string;
  status: 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';
  medico: string;
  sintomas?: string;
  diagnostico?: string;
  prescricao?: string;
  observacoes?: string;
  anexos?: string[];
} 