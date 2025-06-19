import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {
  ColorDistribution,
  DailyReport,
  MonthlySummary,
  StatisticsService,
  WeeklySummary
} from '../../services/statistics.service';
import {EnergiekostenService} from '../../services/energiekosten.service';
import {CommonModule} from '@angular/common';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {FormsModule} from '@angular/forms';
import {NavigationComponent} from '../navigation/navigation.component';
import {NotificationService} from '../../services/notification.service';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, NavigationComponent],
  templateUrl: './statistics.component.html'
})
export class StatisticsComponent implements OnInit, OnDestroy {
  dailyReport: DailyReport | null = null;
  colorDistribution: ColorDistribution[] = [];
  weeklySummary: WeeklySummary | null = null;
  monthlySummary: MonthlySummary | null = null;

  selectedDate: string = '';
  selectedWeek: string = '';
  selectedMonth: string = '';
  selectedYear: number = new Date().getFullYear();

  isLoading = false;
  activeTab: 'daily' | 'weekly' | 'monthly' | 'colors' = 'daily';

  // Error states
  dailyError = false;
  weeklyError = false;
  monthlyError = false;
  colorError = false;

  private subscriptions = new Subscription();

  constructor(
    private statisticsService: StatisticsService,
    private energiekostenService: EnergiekostenService,
    private notificationService: NotificationService
  ) {
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
    this.dailyError = false;
    this.dailyReport = null;

    const subscription = this.statisticsService.getDailyReport(this.selectedDate).subscribe({
      next: (report) => {
        this.dailyReport = report;
        this.dailyError = report === null;
        this.isLoading = false;

        if (this.dailyError) {
          this.notificationService.error(``, 'Keine Daten für das ausgewählte Datum verfügbar');
        }
      },
      error: (error) => {
        console.error('Error loading daily report:', error);
        this.dailyError = true;
        this.dailyReport = null;
        this.isLoading = false;
        this.notificationService.error(``, 'Fehler beim Laden des Tagesberichts');
      }
    });

    this.subscriptions.add(subscription);
  }

  loadWeeklyReports() {
    if (!this.selectedWeek) return;

    this.isLoading = true;
    this.weeklyError = false;
    this.weeklySummary = null;

    const subscription = this.statisticsService.getWeeklyReport(this.selectedWeek).subscribe({
      next: (summary) => {
        this.weeklySummary = summary;
        this.weeklyError = summary === null;
        this.isLoading = false;

        if (this.weeklyError) {
          this.notificationService.error(``, 'Keine Daten für die ausgewählte Woche verfügbar');
        }
      },
      error: (error) => {
        console.error('Error loading weekly reports:', error);
        this.weeklyError = true;
        this.weeklySummary = null;
        this.isLoading = false;
        this.notificationService.error(``, 'Fehler beim Laden der Wochenübersicht');
      }
    });

    this.subscriptions.add(subscription);
  }

  loadMonthlyReports() {
    const [year, month] = this.selectedMonth.split('-').map(Number);

    this.isLoading = true;
    this.monthlyError = false;
    this.monthlySummary = null;

    const subscription = this.statisticsService.getMonthlyReport(year, month).subscribe({
      next: (summary) => {
        this.monthlySummary = summary;
        this.monthlyError = summary === null;
        this.isLoading = false;

        if (this.monthlyError) {
          this.notificationService.error(``, 'Keine Daten für den ausgewählten Monat verfügbar');
        }
      },
      error: (error) => {
        console.error('Error loading monthly reports:', error);
        this.monthlyError = true;
        this.monthlySummary = null;
        this.isLoading = false;
        this.notificationService.error(``, 'Fehler beim Laden der Monatsübersicht');
      }
    });

    this.subscriptions.add(subscription);
  }

  loadColorDistribution() {
    const subscription = this.statisticsService.getColorDistribution().subscribe({
      next: (distribution) => {
        this.colorDistribution = distribution;
        this.colorError = distribution.length === 0;
      },
      error: (error) => {
        console.error('Error loading color distribution:', error);
        this.colorError = true;
        this.colorDistribution = [];
        this.notificationService.error(``, 'Fehler beim Laden der Farbverteilung');
      }
    });

    this.subscriptions.add(subscription);
  }

  setActiveTab(tab: 'daily' | 'weekly' | 'monthly' | 'colors') {
    this.activeTab = tab;

    switch (tab) {
      case 'daily':
        if (!this.dailyReport) {
          this.loadDailyReport();
        }
        break;
      case 'weekly':
        if (!this.weeklySummary) {
          this.loadWeeklyReports();
        }
        break;
      case 'monthly':
        if (!this.monthlySummary) {
          this.loadMonthlyReports();
        }
        break;
      case 'colors':
        if (this.colorDistribution.length === 0) {
          this.loadColorDistribution();
        }
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

  exportData() {
    let dataToExport: any = {};

    switch (this.activeTab) {
      case 'daily':
        dataToExport = {
          type: 'daily',
          date: this.selectedDate,
          data: this.dailyReport
        };
        break;
      case 'weekly':
        dataToExport = {
          type: 'weekly',
          week: this.selectedWeek,
          data: this.weeklySummary
        };
        break;
      case 'monthly':
        dataToExport = {
          type: 'monthly',
          month: this.selectedMonth,
          data: this.monthlySummary
        };
        break;
      case 'colors':
        dataToExport = {
          type: 'colors',
          data: this.colorDistribution
        };
        break;
    }

    // Erstelle und lade CSV-Datei herunter
    const csvContent = this.convertToCSV(dataToExport);
    const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `statistiken_${this.activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.notificationService.success(``, 'Daten erfolgreich exportiert');
  }

  private convertToCSV(data: any): string {
    let csv = '';

    switch (data.type) {
      case 'daily':
        if (data.data) {
          csv = 'Datum,Teile,Häufigste Farbe,Produktionsstart,Produktionsende,Energieverbrauch,Durchschnitt pro Teil\n';
          csv += `${data.data.date},${data.data.partsCount},${data.data.mostCommonColor},${data.data.productionStart},${data.data.productionEnd},${data.data.totalEnergyUsage || 0},${data.data.averageEnergyPerPart || 0}\n`;
        }
        break;
      case 'weekly':
        if (data.data) {
          csv = 'Woche Start,Woche Ende,Gesamte Teile,Gesamtenergie,Durchschnitt pro Tag,Produktivster Tag\n';
          csv += `${data.data.weekStart},${data.data.weekEnd},${data.data.totalParts},${data.data.totalEnergy},${data.data.averagePartsPerDay},${data.data.mostProductiveDay}\n`;
        }
        break;
      case 'monthly':
        if (data.data) {
          csv = 'Jahr,Monat,Gesamte Teile,Gesamtenergie,Durchschnitt pro Tag,Produktivster Tag,Arbeitstage\n';
          csv += `${data.data.year},${data.data.month},${data.data.totalParts},${data.data.totalEnergy},${data.data.averagePartsPerDay},${data.data.mostProductiveDay},${data.data.workingDays}\n`;
        }
        break;
      case 'colors':
        csv = 'Farbe,Anzahl,Prozentsatz\n';
        data.data.forEach((item: ColorDistribution) => {
          csv += `${item.color},${item.count},${item.percentage}\n`;
        });
        break;
    }

    return csv;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getTotalColorCount(colors: any[]): number {
    return colors.reduce((sum, color) => sum + color.count, 0);
  }


  getMonthName(month: number): string {
    const months = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    return months[month - 1] || '';
  }
}
