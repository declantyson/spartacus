import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';
import { ActivatedRoutesService } from '../../../routing/services/activated-routes.service';
import {
  RoutingBreadcrumbsResolver,
  RoutingBreadcrumbsResolverOptions,
} from './routing-breadcrumbs.resolver';
import { RoutingPageMetaResolver } from './routing-page-meta.resolver';

const testActivatedRoutes = [
  { component: null }, // special 'root' route
  { component: 'parent' },
  { component: 'child' },
] as ActivatedRouteSnapshot[];

class MockActivatedRoutesService implements Partial<ActivatedRoutesService> {
  routes$ = of(testActivatedRoutes);
}

class MockRoutingBreadcrumbsResolver
  implements Partial<RoutingBreadcrumbsResolver> {
  resolveBreadcrumbs = jasmine
    .createSpy('resolveBreadcrumbs')
    .and.returnValue(of([{ label: 'test breadcrumb', link: '/' }]));
}

describe('RoutingPageMetaResolver', () => {
  let resolver: RoutingPageMetaResolver;
  let breadcrumbsResolver: RoutingBreadcrumbsResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ActivatedRoutesService,
          useClass: MockActivatedRoutesService,
        },
        {
          provide: RoutingBreadcrumbsResolver,
          useClass: MockRoutingBreadcrumbsResolver,
        },
      ],
    });

    resolver = TestBed.inject(RoutingPageMetaResolver);
    breadcrumbsResolver = TestBed.inject(RoutingBreadcrumbsResolver);
  });

  describe('resolveBreadcrumbs', () => {
    it('should call RoutingBreadcrumbsResolver with all activated routes, but not root route', async () => {
      const options: RoutingBreadcrumbsResolverOptions = {
        includeCurrentRoute: false,
      };
      const result = await resolver
        .resolveBreadcrumbs(options)
        .pipe(take(1))
        .toPromise();

      expect(result).toEqual([{ label: 'test breadcrumb', link: '/' }]);
      expect(breadcrumbsResolver.resolveBreadcrumbs).toHaveBeenCalledWith(
        [
          { component: 'parent' },
          { component: 'child' },
        ] as ActivatedRouteSnapshot[],
        options
      );
    });
  });
});
