import {Injectable, signal} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  darkMode = signal<boolean>(false);

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
      this.darkMode.set(savedTheme === 'dark');
    } else {
      this.darkMode.set(prefersDark);
    }

    this.updateTheme();
  }

  toggleTheme() {
    this.darkMode.set(!this.darkMode());
    localStorage.setItem('theme', this.darkMode() ? 'dark' : 'light');
    this.updateTheme();
  }

  setTheme(isDark: boolean) {
    this.darkMode.set(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    this.updateTheme();
  }

  private updateTheme() {
    if (this.darkMode()) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
