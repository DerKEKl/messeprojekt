import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {ThemeService} from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <router-outlet></router-outlet>
    </div>
  `
})
export class AppComponent implements OnInit {
  title = 'messeprojekt';

  constructor(private themeService: ThemeService) {
  }

  ngOnInit() {
    // Theme Service initialisiert sich automatisch
  }
}
