export interface Patient {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  status: 'ativo' | 'inativo';
  ultimaVisita?: string;
  proximaConsulta?: string;
  avatar?: string;
}
