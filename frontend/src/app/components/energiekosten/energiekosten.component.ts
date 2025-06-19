import {Component, OnDestroy, OnInit} from '@angular/core';
import {CostPreview, EnergyCost} from '../../models/energy-cost';
import {interval, Subscription} from 'rxjs';
import {FormsModule} from '@angular/forms';
import {CurrencyPipe, DatePipe, DecimalPipe, NgForOf, NgIf} from '@angular/common';
import {EnergiekostenService} from '../../services/energiekosten.service';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {NotificationService} from '../../services/notification.service';
import {AppComponent} from '../../app.component';
import {NavigationComponent} from '../navigation/navigation.component';

@Component({
  selector: 'app-energiekosten',
  imports: [
    FormsModule,
    NgIf,
    FaIconComponent,
    NgForOf,
    NavigationComponent,
    CurrencyPipe,
    DatePipe,
    DecimalPipe
  ],
  templateUrl: './energiekosten.component.html',
  styleUrl: './energiekosten.component.css'
})
export class EnergiekostenComponent implements OnInit, OnDestroy {
  todayCosts: EnergyCost | null = null;
  weeklyCosts: EnergyCost[] = [];
  costPreview: CostPreview | null = null;
  currentEnergyPrice: { price: number; currency: string } | null = null;

  previewCount = 10;
  isLoading = false;

  private subscriptions = new Subscription();
  private app: AppComponent;

  constructor(
    private energiekostenService: EnergiekostenService,
    private notificationService: NotificationService,
    app: AppComponent
  ) {
    this.app = app;
  }

  ngOnInit() {
    this.loadData();
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public isMainPage() {
    return this.app._isDashboard;
  }

  private loadData() {
    this.isLoading = true;
    const today = new Date().toISOString().split('T')[0];

    // Today's costs
    this.energiekostenService.getDailyCosts(today).subscribe({
      next: (costs) => {
        this.todayCosts = costs;
      },
      error: (error) => {
        console.error('Error loading today costs:', error);
        this.notificationService.warning('Tagesdaten', 'Heutige Kostendaten konnten nicht geladen werden.');
      }
    });

    // Initial preview
    this.updatePreview();
    this.isLoading = false;
  }

  private startAutoRefresh() {
    this.subscriptions.add(
      interval(300000).subscribe(() => {
        this.loadData();
      })
    );
  }

  updatePreview() {
    if (this.previewCount > 0) {
      this.isLoading = true;
      this.energiekostenService.getCostPreview(this.previewCount).subscribe({
        next: (preview) => {
          this.costPreview = preview;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading cost preview:', error);
          this.notificationService.warning('Vorschau', 'Produktionsvorschau konnte nicht geladen werden.');
          this.isLoading = false;
        }
      });
    }
  }

  // Getter für formatierte Zeitschätzung
  get estimatedStartDate(): string {
    if (!this.costPreview?.startTimestamp) return '';
    const date = new Date(this.costPreview.startTimestamp);
    return new Intl.DateTimeFormat('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  get estimatedCompletionDate(): string {
    if (!this.costPreview?.endTimestamp) return '';
    const date = new Date(this.costPreview.endTimestamp);
    return new Intl.DateTimeFormat('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  loadPreview(count: number) {
    this.energiekostenService.getCostPreview(count).subscribe(preview => {
      this.costPreview = preview;
    });
  }

  get productionDays(): number {
    if (!this.costPreview?.hoursNeeded) return 0;
    return Math.ceil(this.costPreview.hoursNeeded / 24);
  }

  get costPerPart(): string {
    if (!this.costPreview?.estimatedCosts || !this.costPreview?.partsCount) return '0,00 €';
    const cost = this.costPreview.estimatedCosts / this.costPreview.partsCount;
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(cost);
  }

  get isLongProduction(): boolean {
    return (this.costPreview?.hoursNeeded || 0) > 48;
  }

  get formattedEstimatedCosts(): string {
    if (!this.costPreview?.estimatedCosts) return 'Berechnung läuft...';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(this.costPreview.estimatedCosts);
  }

  get formattedEnergyUsage(): string {
    if (!this.costPreview?.estimatedEnergyUsage) return '0,0';
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(this.costPreview.estimatedEnergyUsage);
  }

  get formattedPartsCount(): string {
    if (!this.costPreview?.partsCount) return '0';
    return new Intl.NumberFormat('de-DE').format(this.costPreview.partsCount);
  }

  refreshData() {
    this.loadData();
  }
}
