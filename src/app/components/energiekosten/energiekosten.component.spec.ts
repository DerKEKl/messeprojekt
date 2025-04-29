import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnergiekostenComponent } from './energiekosten.component';

describe('EnergiekostenComponent', () => {
  let component: EnergiekostenComponent;
  let fixture: ComponentFixture<EnergiekostenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnergiekostenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnergiekostenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
