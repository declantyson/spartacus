import { TestBed } from '@angular/core/testing';
import { RouterEvent } from '@angular/router';
import { Observable, of, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { TranslationService } from '../../i18n/translation.service';
import { DefaultRouteBreadcrumbResolver } from './default-route-breadcrumb.resolver';

class MockTranslationService implements Partial<TranslationService> {
  translate(key: string): Observable<string> {
    return of(`translated ${key}`);
  }
}

describe('DefaultRouteBreadcrumbResolver', () => {
  let resolver: DefaultRouteBreadcrumbResolver;
  let mockRouterEvents$: Subject<RouterEvent>;

  beforeEach(() => {
    mockRouterEvents$ = new Subject<RouterEvent>();

    TestBed.configureTestingModule({
      providers: [
        { provide: TranslationService, useClass: MockTranslationService },
      ],
    });
    resolver = TestBed.inject(DefaultRouteBreadcrumbResolver);
  });

  describe(`resolveBreadcrumbs`, () => {
    it('should emit breadcrumb containing given path and translated i18n key', async () => {
      expect(
        await resolver
          .resolveBreadcrumbs('testPath', { i18n: 'testTranslationKey' })
          .pipe(take(1))
          .toPromise()
      ).toEqual([
        {
          link: 'testPath',
          label: 'translated testTranslationKey',
        },
      ]);
    });
  });
});
