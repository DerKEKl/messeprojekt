import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';
import {Subscription} from 'rxjs';
import {DatePipe, NgForOf, NgIf} from '@angular/common';
import {Part} from '../../models/part';
import {PartsService} from '../../services/parts.service';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {NotificationService} from '../../services/notification.service';
import {NavigationComponent} from '../navigation/navigation.component';
import {AppComponent} from '../../app.component';

@Component({
  selector: 'app-messdaten-liste',
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    FaIconComponent,
    NgIf,
    NgForOf,
    NavigationComponent,

  ],
  templateUrl: './messdaten-liste.component.html',
  styleUrl: './messdaten-liste.component.css'
})
export class MessdatenListeComponent implements OnInit, OnDestroy {
  messdaten: Part[] = [];
  filteredData: Part[] = [];
  paginatedData: Part[] = [];

  searchControl = new FormControl('');
  selectedColor: string = '';
  selectedDate: string = '';

  isLoading = false;
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  private subscriptions = new Subscription();
  private app: AppComponent;

  constructor(private partsService: PartsService, private notificationService: NotificationService, app: AppComponent
  ) {
    this.app = app;
  }

  ngOnInit() {
    this.loadData();
    this.setupSearch();
    this.subscribeToPartsUpdates();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public isMainPage() {
    return this.app._isDashboard;
  }

  private loadData() {
    this.isLoading = true;
    this.partsService.getAllParts().subscribe({
      next: (data: Part[]) => {
        this.messdaten = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading parts:', error);
        this.isLoading = false;
      }
    });
  }

  private setupSearch() {
    this.subscriptions.add(
      this.searchControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(() => {
        this.applyFilters();
      })
    );
  }

  private subscribeToPartsUpdates() {
    this.subscriptions.add(
      this.partsService.parts$.subscribe((parts: Part[]) => {
        this.messdaten = parts;
        this.applyFilters();
      })
    );
  }

  applyFilters() {
    let filtered = [...this.messdaten];

    // Textsuche
    const searchTerm = this.searchControl.value?.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.partNumber.toLowerCase().includes(searchTerm) ||
        item.color.toLowerCase().includes(searchTerm)
      );
    }

    // Farbfilter
    if (this.selectedColor) {
      filtered = filtered.filter(item => item.color === this.selectedColor);
    }

    // Datumsfilter
    if (this.selectedDate) {
      filtered = filtered.filter(item =>
        item.timestamp?.startsWith(this.selectedDate)
      );
    }

    this.filteredData = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  private updatePagination() {
    this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedData = this.filteredData.slice(startIndex, endIndex);
  }

  sortBy(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.filteredData.sort((a: Part, b: Part) => {
      let aValue = a[field as keyof Part];
      let bValue = b[field as keyof Part];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      // @ts-ignore
      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      // @ts-ignore
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.updatePagination();
  }

  clearFilters() {
    this.searchControl.setValue('');
    this.selectedColor = '';
    this.selectedDate = '';
    this.applyFilters();
  }

  refreshData() {
    this.loadData();
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  trackByPartNumber(index: number, item: Part): string {
    return item.partNumber;
  }

  getColorClass(color: string): string {
    const colorClasses = {
      'red': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'green': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'blue': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'yellow': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    };
    return colorClasses[color as keyof typeof colorClasses] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
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

  get Math() {
    return Math;
  }
}
