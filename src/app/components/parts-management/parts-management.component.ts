import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {CreatePartRequest, Part} from '../../models/part';
import {PartsService} from '../../services/parts.service';
import {CommonModule, DatePipe, NgForOf, NgIf} from '@angular/common';
import {FaIconComponent, FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {NavigationComponent} from '../navigation/navigation.component';

@Component({
  selector: 'app-parts-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FontAwesomeModule, NavigationComponent],
  templateUrl: './parts-management.component.html'
})

export class PartsManagementComponent implements OnInit, OnDestroy {
  parts: Part[] = [];
  filteredParts: Part[] = [];
  partForm: FormGroup;
  editingPart: Part | null = null;
  isLoading = false;
  isSubmitting = false;
  showForm = false;
  searchTerm = '';
  selectedColor = '';

  private subscriptions = new Subscription();

  constructor(
    private partsService: PartsService,
    private formBuilder: FormBuilder
  ) {
    this.partForm = this.formBuilder.group({
      partNumber: ['', [Validators.required, Validators.pattern(/^[A-Z]-\d{3}$/)]],
      color: ['', Validators.required],
      energyUsage: ['', [Validators.required, Validators.min(0.1), Validators.max(10)]]
    });
  }

  ngOnInit() {
    this.loadParts();
    this.subscribeToPartsUpdates();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private loadParts() {
    this.isLoading = true;
    this.partsService.getAllParts().subscribe({
      next: (parts) => {
        this.parts = parts;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading parts:', error);
        this.isLoading = false;
      }
    });
  }

  private subscribeToPartsUpdates() {
    this.subscriptions.add(
      this.partsService.parts$.subscribe(parts => {
        this.parts = parts;
        this.applyFilters();
      })
    );
  }

  applyFilters() {
    let filtered = [...this.parts];

    if (this.searchTerm) {
      filtered = filtered.filter(part =>
        part.partNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        part.color.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    if (this.selectedColor) {
      filtered = filtered.filter(part => part.color === this.selectedColor);
    }

    this.filteredParts = filtered;
  }

  onSubmit() {
    if (this.partForm.valid) {
      this.isSubmitting = true;
      const formData = this.partForm.value as CreatePartRequest;

      if (this.editingPart) {
        this.partsService.updatePart(this.editingPart.partNumber, formData).subscribe({
          next: () => {
            this.resetForm();
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error updating part:', error);
            this.isSubmitting = false;
          }
        });
      } else {
        // Create new part
        this.partsService.createPart(formData).subscribe({
          next: () => {
            this.resetForm();
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error creating part:', error);
            this.isSubmitting = false;
          }
        });
      }
    }
  }

  editPart(part: Part) {
    this.editingPart = part;
    this.partForm.patchValue({
      partNumber: part.partNumber,
      color: part.color,
      energyUsage: part.energyUsage
    });
    this.showForm = true;
  }

  deletePart(part: Part) {
    if (confirm(`Möchten Sie das Bauteil ${part.partNumber} wirklich löschen?`)) {
      this.partsService.deletePart(part.partNumber).subscribe({
        next: () => {
          // Parts werden automatisch über parts$ aktualisiert
        },
        error: (error) => {
          console.error('Error deleting part:', error);
          alert('Fehler beim Löschen des Bauteils');
        }
      });
    }
  }

  resetForm() {
    this.partForm.reset();
    this.editingPart = null;
    this.showForm = false;
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  getColorClass(color: string): string {
    const colorClasses = {
      'red': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'green': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'blue': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'yellow': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    };
    return colorClasses[color as keyof typeof colorClasses] || 'bg-gray-100 text-gray-800';
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
}
