import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './core/guards/auth.guard';
import { LandingComponent } from './features/landing/landing.component';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { SessionsComponent } from './features/sessions/sessions.component';
import { SubmitDocumentComponent } from './features/submit-document/submit-document.component';
import { TrackDocumentComponent } from './features/track-document/track-document.component';

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
    path: 'sessions',
    component: SessionsComponent,
    canActivate: [authGuard]
  },
  
  // Redirección catch-all
  {
    path: '**',
    redirectTo: ''
  }
];
