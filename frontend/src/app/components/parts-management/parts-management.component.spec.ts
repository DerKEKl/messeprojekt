import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PartsManagementComponent} from './parts-management.component';

describe('PartsManagementComponent', () => {
  let component: PartsManagementComponent;
  let fixture: ComponentFixture<PartsManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartsManagementComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PartsManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
