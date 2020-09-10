import { TestBed } from '@angular/core/testing';
import { CostCenter, I18nTestingModule } from '@spartacus/core';
import { Observable, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { CostCenterRouteBreadcrumbResolver } from '.';
import { CurrentCostCenterService } from './current-cost-center.service';

class MockCurrentCostCenterService
  implements Partial<CurrentCostCenterService> {
  item$: Observable<CostCenter> = of({ name: 'testName' });
}

describe('CostCenterRouteBreadcrumbResolver', () => {
  let resolver: CostCenterRouteBreadcrumbResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [I18nTestingModule],
      providers: [
        {
          provide: CurrentCostCenterService,
          useClass: MockCurrentCostCenterService,
        },
      ],
    });

    resolver = TestBed.inject(CostCenterRouteBreadcrumbResolver);
  });

  it('should emit breadcrumb with translated i18n key, using cost center model as params', async () => {
    expect(
      await resolver
        .resolveBreadcrumbs('testPath', { i18n: 'testTranslation' })
        .pipe(take(1))
        .toPromise()
    ).toEqual([{ label: 'testTranslation name:testName', link: 'testPath' }]);
  });
});
