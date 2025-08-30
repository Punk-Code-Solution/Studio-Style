import { Employee } from '../services/employee.service';

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 1,
    name: 'Dr. João Silva',
    email: 'joao.silva@experiencemed.com',
    role: 'medico',
    department: 'clinica',
    phone: '(11) 98765-4321',
    address: 'Rua das Flores, 123 - São Paulo, SP',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    name: 'Dra. Maria Santos',
    email: 'maria.santos@experiencemed.com',
    role: 'medico',
    department: 'pediatria',
    phone: '(11) 98765-4322',
    address: 'Av. Paulista, 1000 - São Paulo, SP',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 3,
    name: 'Dr. Carlos Oliveira',
    email: 'carlos.oliveira@experiencemed.com',
    role: 'medico',
    department: 'cardiologia',
    phone: '(11) 98765-4323',
    address: 'Rua Augusta, 500 - São Paulo, SP',
    status: 'on_leave',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-02-01T10:00:00Z'
  },
  {
    id: 4,
    name: 'Ana Costa',
    email: 'ana.costa@experiencemed.com',
    role: 'enfermeiro',
    department: 'clinica',
    phone: '(11) 98765-4324',
    address: 'Rua Consolação, 2000 - São Paulo, SP',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 5,
    name: 'Pedro Souza',
    email: 'pedro.souza@experiencemed.com',
    role: 'enfermeiro',
    department: 'pediatria',
    phone: '(11) 98765-4325',
    address: 'Av. Rebouças, 1500 - São Paulo, SP',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 6,
    name: 'Juliana Lima',
    email: 'juliana.lima@experiencemed.com',
    role: 'recepcionista',
    department: 'administrativo',
    phone: '(11) 98765-4326',
    address: 'Rua Oscar Freire, 800 - São Paulo, SP',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 7,
    name: 'Roberto Alves',
    email: 'roberto.alves@experiencemed.com',
    role: 'administrativo',
    department: 'administrativo',
    phone: '(11) 98765-4327',
    address: 'Av. Brigadeiro Faria Lima, 3000 - São Paulo, SP',
    status: 'inactive',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-02-15T10:00:00Z'
  },
  {
    id: 8,
    name: 'Dra. Fernanda Martins',
    email: 'fernanda.martins@experiencemed.com',
    role: 'medico',
    department: 'neurologia',
    phone: '(11) 98765-4328',
    address: 'Rua Haddock Lobo, 400 - São Paulo, SP',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  }
]; 