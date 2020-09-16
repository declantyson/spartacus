import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';
import { I18nTestingModule } from '../../i18n/testing/i18n-testing.module';
import { DefaultRouteBreadcrumbResolver } from './default-route-breadcrumb.resolver';
import {
  ActivatedRouteSnapshotWithPageMeta,
  RouteBreadcrumbConfig,
  RouteBreadcrumbResolver,
} from './route-page-meta.model';
import { RoutingBreadcrumbsResolver } from './routing-breadcrumbs.resolver';

class MockDefaultRouteBreadcrumbResolver
  implements Partial<DefaultRouteBreadcrumbResolver> {
  resolveBreadcrumbs(
    url: string,
    breadcrumbsConfig: string | RouteBreadcrumbConfig
  ) {
    const label =
      typeof breadcrumbsConfig === 'string'
        ? breadcrumbsConfig
        : breadcrumbsConfig?.i18n;
    return of([{ link: url, label }]);
  }
}

class CustomResolver implements RouteBreadcrumbResolver {
  resolveBreadcrumbs(
    url: string,
    breadcrumbsConfig: string | RouteBreadcrumbConfig
  ) {
    const label =
      typeof breadcrumbsConfig === 'string'
        ? breadcrumbsConfig
        : breadcrumbsConfig?.i18n;

    return of([{ label: `custom.${label}`, link: url }]);
  }
}

describe('RoutingBreadcrumbsResolver', () => {
  let resolver: RoutingBreadcrumbsResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [I18nTestingModule],
      providers: [
        {
          provide: DefaultRouteBreadcrumbResolver,
          useClass: MockDefaultRouteBreadcrumbResolver,
        },
        CustomResolver,
      ],
    });
    resolver = TestBed.inject(RoutingBreadcrumbsResolver);
  });

  describe(`resolveBreadcrumbs`, () => {
    it(`should return empty breadcrumb when given no routes`, async () => {
      expect(
        await resolver.resolveBreadcrumbs([]).pipe(take(1)).toPromise()
      ).toEqual([]);
    });

    it(`should NOT return breadcrumb for the current route`, async () => {
      const testRoutes = [
        {
          url: [{ path: 'test' }],
          routeConfig: {
            data: { cxPageMeta: { breadcrumb: 'test.breadcrumb' } },
          },
        },
      ] as ActivatedRouteSnapshotWithPageMeta[];

      expect(
        await resolver.resolveBreadcrumbs(testRoutes).pipe(take(1)).toPromise()
      ).toEqual([]);
    });

    it(`should NOT return breadcrumb for the current route '(case with '' path)`, async () => {
      const testRoutes = [
        {
          url: [{ path: 'test' }],
          routeConfig: {
            data: { cxPageMeta: { breadcrumb: 'test.breadcrumb' } },
          },
        },
        {
          url: [],
        },
      ] as ActivatedRouteSnapshotWithPageMeta[];

      expect(
        await resolver.resolveBreadcrumbs(testRoutes).pipe(take(1)).toPromise()
      ).toEqual([]);
    });

    it(`should return breadcrumbs only for the ancestor routes`, async () => {
      const testRoutes = [
        {
          url: [{ path: 'grandparent' }],
          routeConfig: {
            data: { cxPageMeta: { breadcrumb: 'grandparent.breadcrumb' } },
          },
        },
        {
          url: [{ path: 'parent' }],
          routeConfig: {
            data: { cxPageMeta: { breadcrumb: 'parent.breadcrumb' } },
          },
        },
        {
          url: [{ path: 'child' }],
          routeConfig: {
            data: { cxPageMeta: { breadcrumb: 'child.breadcrumb' } },
          },
        },
      ] as ActivatedRouteSnapshotWithPageMeta[];

      expect(
        await resolver.resolveBreadcrumbs(testRoutes).pipe(take(1)).toPromise()
      ).toEqual([
        { link: 'grandparent', label: 'grandparent.breadcrumb' },
        { link: 'grandparent/parent', label: 'parent.breadcrumb' },
      ]);
    });

    it(`should return breadcrumbs only for the ancestor routes (case with '' path)`, async () => {
      const testRoutes = [
        {
          url: [{ path: 'grandparent' }],
          routeConfig: {
            data: { cxPageMeta: { breadcrumb: 'grandparent.breadcrumb' } },
          },
        },
        {
          url: [{ path: 'parent' }],
          routeConfig: {
            data: { cxPageMeta: { breadcrumb: 'parent.breadcrumb' } },
          },
        },
        {
          url: [{ path: 'child' }],
          routeConfig: {
            data: { cxPageMeta: { breadcrumb: 'child.breadcrumb' } },
          },
        },
        {
          url: [],
        },
      ] as ActivatedRouteSnapshotWithPageMeta[];

      expect(
        await resolver.resolveBreadcrumbs(testRoutes).pipe(take(1)).toPromise()
      ).toEqual([
        { link: 'grandparent', label: 'grandparent.breadcrumb' },
        { link: 'grandparent/parent', label: 'parent.breadcrumb' },
      ]);
    });

    describe('when passed option includeCurrentRoute = true', () => {
      it(`should return breadcrumbs for all activated routes`, async () => {
        const testRoutes = [
          {
            url: [{ path: 'grandparent' }],
            routeConfig: {
              data: { cxPageMeta: { breadcrumb: 'grandparent.breadcrumb' } },
            },
          },
          {
            url: [{ path: 'parent' }],
            routeConfig: {
              data: { cxPageMeta: { breadcrumb: 'parent.breadcrumb' } },
            },
          },
          {
            url: [{ path: 'child' }],
            routeConfig: {
              data: { cxPageMeta: { breadcrumb: 'child.breadcrumb' } },
            },
          },
        ] as ActivatedRouteSnapshotWithPageMeta[];

        expect(
          await resolver
            .resolveBreadcrumbs(testRoutes, { includeCurrentRoute: true })
            .pipe(take(1))
            .toPromise()
        ).toEqual([
          { link: 'grandparent', label: 'grandparent.breadcrumb' },
          { link: 'grandparent/parent', label: 'parent.breadcrumb' },
          { link: 'grandparent/parent/child', label: 'child.breadcrumb' },
        ]);
      });
    });
  });

  it(`should use resolver from route's breadcrumb config`, async () => {
    const testRoutes = [
      {
        url: [{ path: 'parent' }],
        routeConfig: {
          data: {
            cxPageMeta: {
              breadcrumb: {
                i18n: 'parent.breadcrumb',
                resolver: CustomResolver,
              },
            },
          },
        },
      },
      {
        url: [{ path: 'child' }],
      },
    ] as ActivatedRouteSnapshotWithPageMeta[];

    expect(
      await resolver.resolveBreadcrumbs(testRoutes).pipe(take(1)).toPromise()
    ).toEqual([{ link: 'parent', label: 'custom.parent.breadcrumb' }]);
  });

  it(`should try to find the closest resolver defined by the ancestor routes`, async () => {
    const testRoutes = [
      {
        url: [{ path: 'grandparent' }],
        routeConfig: {
          data: {
            cxPageMeta: {
              breadcrumb: {
                i18n: 'grandparent.breadcrumb',
                resolver: CustomResolver,
              },
            },
          },
        },
      },
      {
        url: [{ path: 'parent' }],
        routeConfig: {
          data: { cxPageMeta: { breadcrumb: 'parent.breadcrumb' } },
        },
      },
      {
        url: [{ path: 'child' }],
        routeConfig: {
          data: { cxPageMeta: { breadcrumb: 'child.breadcrumb' } },
        },
      },
    ] as ActivatedRouteSnapshotWithPageMeta[];

    expect(
      await resolver
        .resolveBreadcrumbs(testRoutes, { includeCurrentRoute: true })
        .pipe(take(1))
        .toPromise()
    ).toEqual([
      { link: 'grandparent', label: 'custom.grandparent.breadcrumb' },
      { link: 'grandparent/parent', label: 'custom.parent.breadcrumb' },
      { link: 'grandparent/parent/child', label: 'custom.child.breadcrumb' },
    ]);
  });
});
