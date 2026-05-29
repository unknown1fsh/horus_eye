import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchBarComponent } from './search-bar.component';

describe('SearchBarComponent', () => {
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchBarComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should emit searchChange after debounce', async () => {
    const emitted: string[] = [];
    fixture.componentRef.setInput('results', []);
    fixture.componentRef.setInput('loading', false);
    fixture.detectChanges();

    component.searchChange.subscribe(term => emitted.push(term));

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'Turkey';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    await new Promise(resolve => setTimeout(resolve, 350));
    expect(emitted).toEqual(['Turkey']);
  });
});
