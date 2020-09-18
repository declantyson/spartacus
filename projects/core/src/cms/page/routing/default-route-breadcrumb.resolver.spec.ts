import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { TranslationService } from '../../../i18n/translation.service';
import { DefaultRouteBreadcrumbResolver } from './default-route-breadcrumb.resolver';

class MockTranslationService implements Partial<TranslationService> {
  translate(key: string): Observable<string> {
    return of(`translated ${key}`);
  }
}

describe('DefaultRouteBreadcrumbResolver', () => {
  let resolver: DefaultRouteBreadcrumbResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TranslationService, useClass: MockTranslationService },
      ],
    });
    resolver = TestBed.inject(DefaultRouteBreadcrumbResolver);
  });

  describe(`resolveBreadcrumbs`, () => {
    it('should emit breadcrumb with given path and i18n key (as string)', async () => {
      expect(
        await resolver
          .resolveBreadcrumbs('testPath', 'test.key')
          .pipe(take(1))
          .toPromise()
      ).toEqual([
        {
          link: 'testPath',
          label: 'translated test.key',
        },
      ]);
    });

    it('should emit breadcrumb with given path and i18n key (as object property)', async () => {
      expect(
        await resolver
          .resolveBreadcrumbs('testPath', { i18n: 'test.key' })
          .pipe(take(1))
          .toPromise()
      ).toEqual([
        {
          link: 'testPath',
          label: 'translated test.key',
        },
      ]);
    });

    it('should emit breadcrumb with given path and raw text', async () => {
      expect(
        await resolver
          .resolveBreadcrumbs('testPath', { raw: 'raw test' })
          .pipe(take(1))
          .toPromise()
      ).toEqual([
        {
          link: 'testPath',
          label: 'raw test',
        },
      ]);
    });
  });
});
