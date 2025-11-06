import { Routes } from '@angular/router';
import { authGuard, publicGuard, permissionGuard } from './core/guards/auth.guard';
import { LandingComponent } from './features/landing/landing.component';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { BandejaComponent } from './features/bandeja/bandeja.component';
import { ArchivadosComponent } from './features/archivados/archivados.component';
import { SessionsComponent } from './features/sessions/sessions.component';
import { SubmitDocumentComponent } from './features/submit-document/submit-document.component';
import { TrackDocumentComponent } from './features/track-document/track-document.component';
import { AdminLayoutComponent } from './features/admin/admin-layout/admin-layout.component';
import { AreasListComponent } from './features/admin/areas/areas-list.component';
import { RolesListComponent } from './features/admin/roles/roles-list.component';
import { UsersListComponent } from './features/admin/users/users-list.component';
import { CategoriesListComponent } from './features/admin/categories/categories-list.component';
import { DocumentTypesListComponent } from './features/admin/document-types/document-types-list.component';
import { ReportsComponent } from './features/admin/reports/reports.component';

export const routes: Routes = [
  // Landing Page (Página de inicio)
  {
    path: '',
    component: LandingComponent
  },
  
  // Rutas públicas (sin autenticación)
  {
    path: 'submit',
    component: SubmitDocumentComponent
  },
  {
    path: 'track',
    component: TrackDocumentComponent
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [publicGuard]
  },
  
  // Rutas protegidas (requieren autenticación)
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'bandeja',
    component: BandejaComponent,
    canActivate: [authGuard]
  },
  {
    path: 'archivados',
    component: ArchivadosComponent,
    canActivate: [authGuard]
  },
  {
    path: 'sessions',
    component: SessionsComponent,
    canActivate: [authGuard]
  },
  
  // Rutas de administración (requieren autenticación)
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'areas',
        pathMatch: 'full'
      },
      {
        path: 'areas',
        component: AreasListComponent,
        canActivate: [permissionGuard],
        data: { requiredPermission: 'areas.view.all' }
      },
      {
        path: 'roles',
        component: RolesListComponent,
        canActivate: [permissionGuard],
        data: { requiredPermission: 'roles.view' }
      },
      {
        path: 'users',
        component: UsersListComponent,
        canActivate: [permissionGuard],
        data: { requiredPermissions: ['users.view.all', 'users.view.area'] }
      },
      {
        path: 'categories',
        component: CategoriesListComponent,
        canActivate: [permissionGuard],
        data: { requiredPermission: 'categories.view' }
      },
      {
        path: 'document-types',
        component: DocumentTypesListComponent,
        canActivate: [permissionGuard],
        data: { requiredPermission: 'document_types.view' }
      },
      {
        path: 'reports',
        component: ReportsComponent,
        canActivate: [permissionGuard],
        data: { requiredPermissions: ['reports.view.all', 'reports.view.area'] }
      }
    ]
  },
  
  // Redirección catch-all
  {
    path: '**',
    redirectTo: ''
  }
];
