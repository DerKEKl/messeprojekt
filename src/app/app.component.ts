import {Component, OnInit} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {DashboardComponent} from './components/dashboard/dashboard.component';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DashboardComponent, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  sunIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="w-5 h-5">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M16.95 16.95l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M16.95 7.05l1.42-1.42" />
    </svg>
  `;

  moonIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-5 h-5">
      <path d="M21 12.79A9 9 0 0112.21 3 7 7 0 0012 17a7 7 0 009-4.21z" />
    </svg>
  `;
  isDarkMode = false;

  ngOnInit() {
    const savedMode = localStorage.getItem('darkMode');
    this.isDarkMode = savedMode === 'true';
    this.updateBodyClass();
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', this.isDarkMode.toString());
    this.updateBodyClass();
  }


  private updateBodyClass() {
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
