import { TestBed, ComponentFixture, async } from '@angular/core/testing';
// import { Observable } from 'rxjs/internal/Observable';
// import { WindowRef } from '@spartacus/core';
// import { of } from 'rxjs';

import { UnitTreeNavigationUIComponent } from './unit-tree-navigation-ui.component';

import { BreakpointService } from '../../../../layout/breakpoint/breakpoint.service';
import { BREAKPOINT } from '../../../../layout/config/layout-config';
import { of, Observable } from 'rxjs';
import { map } from 'rxjs/internal/operators/map';
import { I18nTestingModule, CmsNavigationComponent } from '@spartacus/core';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Input,
  DebugElement,
} from '@angular/core';
import { NavigationNode } from '../../../navigation/navigation/navigation-node.model';
import { CmsComponentData } from 'projects/storefrontlib/src/cms-structure';
import { By } from '@angular/platform-browser';

@Component({
  template: '',
  selector: 'cx-unit-tree-navigation-ui',
})
class MockNavigationComponent {
  @Input() node: NavigationNode;
  selectedNode: NavigationNode;
  @Input() defaultExpandLevel: number;
}

class MockBreakpointService {
  get breakpoint$(): Observable<BREAKPOINT> {
    return of();
  }
  get breakpoints(): BREAKPOINT[] {
    return [
      BREAKPOINT.xs,
      BREAKPOINT.sm,
      BREAKPOINT.md,
      BREAKPOINT.lg,
      BREAKPOINT.xl,
    ];
  }
  isDown(breakpoint: BREAKPOINT) {
    return this.breakpoint$.pipe(
      map((br) =>
        this.breakpoints
          .slice(0, this.breakpoints.indexOf(breakpoint) + 1)
          .includes(br)
      )
    );
  }
}

const mockNode: NavigationNode = {
  title: 'test',
  children: [
    {
      title: 'Root 1',
      url: '/root-1',
      children: [
        {
          title: 'Child 1',
          children: [
            {
              title: 'Sub child 1',
              children: [
                {
                  title: 'Sub sub child 1',
                  url: '/sub-sub-child-1',
                },
                {
                  title: 'Sub sub child 1',
                  url: '/sub-sub-child-1',
                },
                {
                  title: 'Sub sub child 1',
                  url: '/sub-sub-child-1',
                },
                {
                  title: 'Sub sub child 1',
                  url: '/sub-sub-child-1',
                },
              ],
            },
          ],
        },
        {
          title: 'Child 2',
          url: '/child-2',
        },
      ],
    },
    {
      title: 'Root 2',
      url: '/root-2',
    },
  ],
};

fdescribe('UnitTreeNavigationUIComponent', () => {
  let component: UnitTreeNavigationUIComponent;
  let fixture: ComponentFixture<UnitTreeNavigationUIComponent>;
  let element: DebugElement;
  let breakpointService: MockBreakpointService;

  const mockCmsComponentData = <CmsNavigationComponent>{
    styleClass: 'footer-styling',
  };
  const MockCmsNavigationComponent = <CmsComponentData<any>>{
    data$: of(mockCmsComponentData),
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [UnitTreeNavigationUIComponent, MockNavigationComponent],
      imports: [I18nTestingModule],
      providers: [
        UnitTreeNavigationUIComponent,
        {
          provide: CmsComponentData,
          useValue: MockCmsNavigationComponent,
        },
        {
          provide: BreakpointService,
          useClass: MockBreakpointService,
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
    breakpointService = TestBed.inject(BreakpointService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UnitTreeNavigationUIComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    component.node = mockNode;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('executing constructor and calling breakpoint service', () => {
    beforeEach(() => {
      spyOnProperty(breakpointService, 'breakpoint$').and.returnValue(
        of(BREAKPOINT.md)
      );
    });
  });

  it('should render refreshUIDMappedElements function', () => {
    spyOn(component, 'mapUlElementToExpand');
    component.refreshUIWithMappedElements();
    expect(component.mapUlElementToExpand).toHaveBeenCalled();
  });

  describe('UI view testing', () => {
    beforeEach(() => {
      component.selectedNode = mockNode;
      fixture.detectChanges();
    });

    it('should title be rendered in a DOM', () => {
      const button: HTMLElement = element.queryAll(By.css('.node-title'))[0]
        .nativeElement;
      console.log(button); // contains HTML of button (see console log)
      expect(button.innerText).toContain(mockNode.title);
    });

    it('should call setTreeBranchesState on expandAll button click', () => {
      const clickMock = spyOn(component, 'setTreeBranchesState');
      element
        .queryAll(By.css('.btn-link'))[0]
        .triggerEventHandler('click', null);
      expect(clickMock).toHaveBeenCalledWith(true);
    });

    it('should call setTreeBranchesState on collapseAll button click', () => {
      const clickMock = spyOn(component, 'setTreeBranchesState');
      element
        .queryAll(By.css('.btn-link'))[1]
        .triggerEventHandler('click', null);
      expect(clickMock).toHaveBeenCalledWith(false);
    });

    // it('should render if selectedNode is true', async(async () => {
    //   spyOn(component, 'back');
    //   fixture.detectChanges();
    //   const button: HTMLElement = element.queryAll(By.css('.node-title'))[0].nativeElement;
    //   button.click();
    //   await fixture.whenStable();
    //   fixture.detectChanges();

    //   expect(button).toBeTruthy();
    //   expect(component.back).toHaveBeenCalled();
    //   // a.click();
    //   // fixture.detectChanges();
    //   // expect(component.back).toHaveBeenCalled();
    // }));
    // it('should not render if selectedNode is false', async () => {
    //   component.selectedNode = null;
    //   fixture.detectChanges();
    //   const htmlElement: HTMLElement = fixture.nativeElement;
    //   const a = htmlElement.querySelector('a');
    //   const selectedNodeElement = element.queryAll(By.css('.node-title'))[0].nativeElement;
    //   console.log(selectedNodeElement);
    //   expect(a).toBeUndefined();
    // });
  });
});