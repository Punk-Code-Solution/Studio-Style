export const fieldMappings = {
  patient: {
    id: 'id',
    name: 'nome',
    email: 'email',
    phone: 'telefone',
    crm: 'crm',
    status: {
      active: 'ativo',
      inactive: 'inativo'
    },
    lastVisit: 'ultimaVisita',
    nextAppointment: 'proximaConsulta'
  },
  consultation: {
    id: 'id',
    patientId: 'pacienteId',
    date: 'data',
    time: 'horario',
    status: {
      scheduled: 'agendada',
      inProgress: 'em_andamento',
      completed: 'concluida',
      cancelled: 'cancelada'
    },
    doctorName: 'medico',
    symptoms: 'sintomas',
    diagnosis: 'diagnostico',
    prescription: 'prescricao',
    notes: 'observacoes',
    attachments: 'anexos'
  }
}; 