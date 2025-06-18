import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {ColorDistribution, DailyReport, StatisticsService} from '../../services/statistics.service';
import {EnergiekostenService} from '../../services/energiekosten.service';
import {CommonModule} from '@angular/common';
import {FaIconLibrary, FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {FormsModule} from '@angular/forms';
import {NavigationComponent} from '../navigation/navigation.component';
import {faBolt, faCalendarAlt, faChartBar, faClock, faDownload, faFilter} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, NavigationComponent],
  templateUrl: './statistics.component.html'
})

export class StatisticsComponent implements OnInit, OnDestroy {
  dailyReport: DailyReport | null = null;
  colorDistribution: ColorDistribution[] = [];
  weeklyReports: DailyReport[] = [];
  monthlyReports: DailyReport[] = [];

  selectedDate: string = '';
  selectedWeek: string = '';
  selectedMonth: string = '';
  selectedYear: number = new Date().getFullYear();

  isLoading = false;
  activeTab: 'daily' | 'weekly' | 'monthly' | 'colors' = 'daily';

  private subscriptions = new Subscription();

  constructor(
    private statisticsService: StatisticsService,
    private energiekostenService: EnergiekostenService,
    library: FaIconLibrary,
  ) {
    library.addIcons(faChartBar, faCalendarAlt, faDownload, faFilter, faClock, faBolt);
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.selectedWeek = this.getWeekStart().toISOString().split('T')[0];
    this.selectedMonth = `${this.selectedYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  }

  ngOnInit() {
    this.loadDailyReport();
    this.loadColorDistribution();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private getWeekStart(): Date {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  }

  loadDailyReport() {
    if (!this.selectedDate) return;

    this.isLoading = true;
    this.statisticsService.getDailyReport(this.selectedDate).subscribe({
      next: (report) => {
        this.dailyReport = report;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading daily report:', error);
        this.isLoading = false;
      }
    });
  }

  loadWeeklyReports() {
    if (!this.selectedWeek) return;

    this.isLoading = true;
    this.statisticsService.getWeeklyReport(this.selectedWeek).subscribe({
      next: (reports) => {
        this.weeklyReports = reports;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading weekly reports:', error);
        this.isLoading = false;
      }
    });
  }

  loadMonthlyReports() {
    const [year, month] = this.selectedMonth.split('-').map(Number);

    this.isLoading = true;
    this.statisticsService.getMonthlyReport(year, month).subscribe({
      next: (reports) => {
        this.monthlyReports = reports;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading monthly reports:', error);
        this.isLoading = false;
      }
    });
  }

  loadColorDistribution() {
    this.statisticsService.getColorDistribution().subscribe({
      next: (distribution) => {
        this.colorDistribution = distribution;
      },
      error: (error) => {
        console.error('Error loading color distribution:', error);
      }
    });
  }

  setActiveTab(tab: 'daily' | 'weekly' | 'monthly' | 'colors') {
    this.activeTab = tab;

    switch (tab) {
      case 'daily':
        this.loadDailyReport();
        break;
      case 'weekly':
        this.loadWeeklyReports();
        break;
      case 'monthly':
        this.loadMonthlyReports();
        break;
      case 'colors':
        this.loadColorDistribution();
        break;
    }
  }

  getColorClass(color: string): string {
    const colorClasses = {
      'red': 'bg-red-500',
      'green': 'bg-green-500',
      'blue': 'bg-blue-500',
      'yellow': 'bg-yellow-500'
    };
    return colorClasses[color as keyof typeof colorClasses] || 'bg-gray-500';
  }

  getColorName(color: string): string {
    const colorNames = {
      'red': 'Rot',
      'green': 'Grün',
      'blue': 'Blau',
      'yellow': 'Gelb'
    };
    return colorNames[color as keyof typeof colorNames] || color;
  }

  getWeeklyTotal(field: keyof DailyReport): number {
    if (field === 'partsCount') {
      return this.weeklyReports.reduce((sum, report) => sum + report.partsCount, 0);
    }
    if (field === 'totalEnergyUsage') {
      return this.weeklyReports.reduce((sum, report) => sum + (report.totalEnergyUsage || 0), 0);
    }
    return 0;
  }

  getMonthlyTotal(field: keyof DailyReport): number {
    if (field === 'partsCount') {
      return this.monthlyReports.reduce((sum, report) => sum + report.partsCount, 0);
    }
    if (field === 'totalEnergyUsage') {
      return this.monthlyReports.reduce((sum, report) => sum + (report.totalEnergyUsage || 0), 0);
    }
    return 0;
  }

  exportData() {
    // Implementierung für Datenexport
    console.log('Export data functionality');
  }
}
