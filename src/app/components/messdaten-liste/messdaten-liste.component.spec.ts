import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MessdatenListeComponent} from './messdaten-liste.component';


describe('MessdatenListeComponent', () => {
  let component: MessdatenListeComponent;
  let fixture: ComponentFixture<MessdatenListeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessdatenListeComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MessdatenListeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
