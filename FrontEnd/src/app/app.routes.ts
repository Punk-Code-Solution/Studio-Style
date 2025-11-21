import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { EmployeesComponent } from './features/employees/employees.component';
import { EmployeeFormComponent } from './features/employees/employee-form/employee-form.component';

// Rotas públicas
const publicRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  }
];

// Rotas de pacientes
const patientRoutes: Routes = [
  {
    path: 'patients',
    canActivate: [RoleGuard],
    loadComponent: () => import('./features/patients/patients.component').then(m => m.PatientsComponent)
  }
];

// Rotas de consultas (Agendamentos)
const consultationRoutes: Routes = [
  {
    path: 'services',
    canActivate: [RoleGuard],
    children: [
      {
        path: '',
        canActivate: [RoleGuard],
        loadComponent: () => import('./features/schedules/schedules.component').then(m => m.SchedulesComponent)
      },
      {
        path: 'new',
        canActivate: [RoleGuard],
        loadComponent: () => import('./features/schedules/schedule-view-modal/schedule-view-modal.component').then(m => m.ScheduleViewModalComponent)
      },
      {
        path: ':id',
        canActivate: [RoleGuard],
        loadComponent: () => import('./features/schedules/schedule-view-modal/schedule-view-modal.component').then(m => m.ScheduleViewModalComponent)
      }
    ]
  }
];

// Rotas de funcionários
const employeeRoutes: Routes = [
  {
    path: 'employees',
    canActivate: [RoleGuard],
    children: [
      {
        path: '',
        canActivate: [RoleGuard],
        component: EmployeesComponent
      },
      {
        path: 'new',
        canActivate: [RoleGuard],
        component: EmployeeFormComponent
      },
      {
        path: ':id',
        canActivate: [RoleGuard],
        loadComponent: () => import('./features/employees/employee-edit/employee-edit.component').then(m => m.EmployeeEditComponent)
      }
    ]
  }
];

// Rotas protegidas principais
const protectedRoutes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        canActivate: [RoleGuard],
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      // Inclui as rotas agrupadas
      ...patientRoutes,
      ...consultationRoutes,
      ...employeeRoutes,
      // Outras rotas protegidas
      // MODIFICADO (Ponto 6, 8): Rotas removidas
      // {
      //   path: 'calendar',
      //   canActivate: [RoleGuard],
      //   loadComponent: () => import('./features/calendar/calendar.component').then(m => m.CalendarComponent)
      // },
      // {
      //   path: 'messages',
      //   canActivate: [RoleGuard],
      //   loadComponent: () => import('./features/messages/messages.component').then(m => m.MessagesComponent)
      // },
      // {
      //   path: 'documents',
      //   canActivate: [RoleGuard],
      //   loadComponent: () => import('./features/documents/documents.component').then(m => m.DocumentsComponent)
      // },
      {
        path: 'feedbacks',
        canActivate: [RoleGuard],
        loadComponent: () => import('./features/feedbacks/feedbacks.component').then(m => m.FeedbacksComponent)
      },
      {
        path: 'services-management',
        canActivate: [RoleGuard],
        loadComponent: () => import('./features/services/services.component').then(m => m.ServicesComponent)
      },
      {
        path: 'hair-types',
        canActivate: [RoleGuard],
        loadComponent: () => import('./features/hair-types/hair-types.component').then(m => m.HairTypesComponent)
      }
    ]
  }
];

// Rotas de fallback
const fallbackRoutes: Routes = [
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

// Exporta todas as rotas combinadas
export const routes: Routes = [
  ...publicRoutes,
  ...protectedRoutes,
  ...fallbackRoutes
];