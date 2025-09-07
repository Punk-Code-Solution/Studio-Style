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
    children: [
      {
        path: '',
        canActivate: [RoleGuard],
        loadComponent: () => import('./features/patients/patients.component').then(m => m.PatientsComponent)
      },
      {
        path: 'new',
        canActivate: [RoleGuard],
        loadComponent: () => import('./features/patients/patient-form/patient-form.component').then(m => m.PatientFormComponent)
      },
      {
        path: ':id',
        canActivate: [RoleGuard],
        loadComponent: () => import('./features/patients/patient-details/patient-details.component').then(m => m.PatientDetailsComponent)
      },
      {
        path: ':id/edit',
        canActivate: [RoleGuard],
        loadComponent: () => import('./features/patients/patient-form/patient-form.component').then(m => m.PatientFormComponent)
      }
    ]
  }
];

// Rotas de consultas
const consultationRoutes: Routes = [
  {
    path: 'services',
    canActivate: [RoleGuard],
    children: [
      {
        path: '',
        canActivate: [RoleGuard],
        loadComponent: () => import('./features/services/services.component').then(m => m.ConsultationsComponent)
      },
      {
        path: 'new',
        canActivate: [RoleGuard],
        loadComponent: () => import('./features/services/service-form/service-form.component').then(m => m.ConsultationFormComponent)
      },
      {
        path: ':id',
        canActivate: [RoleGuard],
        loadComponent: () => import('./features/services/services-details/services-details.component').then(m => m.ConsultationDetailsComponent)
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
      {
        path: 'calendar',
        canActivate: [RoleGuard],
        loadComponent: () => import('./features/calendar/calendar.component').then(m => m.CalendarComponent)
      },
      {
        path: 'messages',
        canActivate: [RoleGuard],
        loadComponent: () => import('./features/messages/messages.component').then(m => m.MessagesComponent)
      },
      {
        path: 'documents',
        canActivate: [RoleGuard],
        loadComponent: () => import('./features/documents/documents.component').then(m => m.DocumentsComponent)
      },
      {
        path: 'feedbacks',
        canActivate: [RoleGuard],
        loadComponent: () => import('./features/feedbacks/feedbacks.component').then(m => m.FeedbacksComponent)
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
