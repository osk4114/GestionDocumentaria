import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {
  
  constructor(private router: Router) {}

  navigateToSubmit() {
    this.router.navigate(['/submit']);
  }

  navigateToTrack() {
    this.router.navigate(['/track']);
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
