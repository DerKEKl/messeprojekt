import {Component, OnDestroy, OnInit} from '@angular/core';
import {CostPreview, EnergyCost} from '../../models/energy-cost';
import {interval, Subscription} from 'rxjs';
import {FormsModule} from '@angular/forms';
import {DatePipe, NgForOf, NgIf} from '@angular/common';
import {EnergiekostenService} from '../../services/energiekosten.service';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-energiekosten',
  imports: [
    FormsModule,
    DatePipe,
    NgIf,
    FaIconComponent,
    NgForOf
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

  constructor(private energiekostenService: EnergiekostenService) {
  }

  ngOnInit() {
    this.loadData();
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private loadData() {
    this.isLoading = true;
    const today = new Date().toISOString().split('T')[0];
    const weekStart = this.getWeekStart().toISOString().split('T')[0];

    // Today's costs
    this.energiekostenService.getDailyCosts(today).subscribe({
      next: (costs) => {
        this.todayCosts = costs;
      },
      error: (error) => {
        console.error('Error loading today costs:', error);
      }
    });

    // Weekly costs
    this.energiekostenService.getWeeklyCosts(weekStart).subscribe({
      next: (costs) => {
        this.weeklyCosts = costs;
      },
      error: (error) => {
        console.error('Error loading weekly costs:', error);
      }
    });

    // Current energy price
    this.energiekostenService.getCurrentEnergyPrice().subscribe({
      next: (price) => {
        this.currentEnergyPrice = price;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading energy price:', error);
        this.isLoading = false;
      }
    });

    // Initial preview
    this.updatePreview();
  }

  private startAutoRefresh() {
    this.subscriptions.add(
      interval(300000).subscribe(() => {
        this.loadData();
      })
    );
  }

  private getWeekStart(): Date {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  }

  updatePreview() {
    if (this.previewCount > 0) {
      this.energiekostenService.getCostPreview(this.previewCount).subscribe({
        next: (preview) => {
          this.costPreview = preview;
        },
        error: (error) => {
          console.error('Error loading cost preview:', error);
        }
      });
    }
  }

  refreshData() {
    this.loadData();
  }

  getWeeklyTotal(field: 'costs' | 'energyUsage'): number {
    return this.weeklyCosts.reduce((sum, day) => sum + day[field], 0);
  }
}
