import { Injectable, Injector } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { combineLatest, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { BreadcrumbMeta } from '../../cms/model/page.model';
import { TranslationService } from '../../i18n';
import { DefaultRouteBreadcrumbResolver } from './default-route-breadcrumb.resolver';
import {
  ActivatedRouteSnapshotWithPageMeta,
  RouteBreadcrumbResolver,
} from './route-page-meta.model';

export interface RoutingBreadcrumbsResolverOptions {
  /**
   * When true, includes in the breadcrumbs the page title of the current route. False by default.
   */
  includeCurrentRoute?: boolean;
}

/**
 * Resolves the page meta based on the Angular Activated Route
 * (or even child routes).
 */
@Injectable({
  providedIn: 'root',
})
export class RoutingBreadcrumbsResolver {
  constructor(
    protected injector: Injector,
    protected translation: TranslationService
  ) {}

  /**
   * Array of breadcrumbs defined for all the activated routes (from the root route to the leaf route).
   * It emits on every completed routing navigation.
   */
  resolveBreadcrumbs(
    routes: ActivatedRouteSnapshotWithPageMeta[],
    options?: RoutingBreadcrumbsResolverOptions
  ): Observable<BreadcrumbMeta[]> {
    routes = options?.includeCurrentRoute
      ? routes
      : this.trimCurrentRoute(routes);

    return routes.length
      ? combineLatest(
          routes.map((route) => this.resolveRouteBreadcrumb(route))
        ).pipe(map((breadcrumbArrays) => breadcrumbArrays.flat()))
      : of([]);
  }

  /**
   * Returns the URL path for the given activated route.
   *
   * It can be used to build URL path not only for the leaf activated route,
   * but also for the intermediate ones, in between the root and the leaf route.
   */
  protected getUrl(activatedRoute: ActivatedRouteSnapshot): string {
    return activatedRoute.pathFromRoot
      .map((route) => route.url.map((urlSegment) => urlSegment.path).join('/'))
      .join('/');
  }

  /**
   * Resolves breadcrumbs based on the breadcrumb config placed in Route's `data` property.
   *
   * - When the breadcrumb config is a string, the resolved breadcrumb is this string.
   * - When the breadcrumb config contains the property `resolver` with `RouteBreadcrumbResolver` class,
   *    resolving is delegated to it.
   * - Otherwise, it delegates resolving to the the closest defined resolver defined in the ancestors routes
   * - If no ancestor defines resolver, resolving is delegated to `DefaultRouteBreadcrumbResolver`
   *
   * @see `RouteBreadcrumbResolver`
   * @see `DefaultRouteBreadcrumbResolver`
   */
  protected resolveRouteBreadcrumb(
    route: ActivatedRouteSnapshotWithPageMeta
  ): Observable<BreadcrumbMeta[]> {
    const url = this.getUrl(route);

    // Note: we use `route.routeConfig.data` (not `route.data`). Otherwise it could work incorrect
    // for route with path '', who is a child of path-full parent route. It's because
    // in Angular routes with empty path inherit the `data` from the parent route.
    // But in our case we don't want the inheritance of `data`.
    const breadcrumbConfig = route?.routeConfig?.data?.cxPageMeta?.breadcrumb;

    if (!breadcrumbConfig) {
      return of([]);
    }

    if (typeof breadcrumbConfig !== 'string' && breadcrumbConfig.raw) {
      return of([{ link: url, label: breadcrumbConfig.raw }]);
    }

    const resolver = this.getBreadcrumbResolver(route);
    return resolver.resolveBreadcrumbs(url, breadcrumbConfig, route);
  }

  /**
   * Returns the RouteBreadcrumbResolver for the given activate route.
   *
   * * When no resolver defined, it tries to find recursively the closest the resolver in the route's ancestors.
   * * When no ancestor defines the resolver, it fallbacks to the `DefaultRouteBreadcrumbResolver`.
   */
  protected getBreadcrumbResolver(
    route: ActivatedRouteSnapshot & ActivatedRouteSnapshotWithPageMeta
  ): RouteBreadcrumbResolver {
    const breadcrumbConfig = route.data?.cxPageMeta?.breadcrumb;

    if (typeof breadcrumbConfig !== 'string' && breadcrumbConfig?.resolver) {
      const resolver = this.injector.get(
        breadcrumbConfig.resolver,
        null
      ) as RouteBreadcrumbResolver;
      if (resolver) {
        return resolver;
      }
    }

    // fallback to parent's resolver
    if (route.parent) {
      return this.getBreadcrumbResolver(route.parent);
    }

    // fallback to default, when couldn't find recursively any parent's resolver
    return this.injector.get(DefaultRouteBreadcrumbResolver);
  }

  /**
   * By default in breadcrumbs list we don't want to show a link to the current page, so this function
   * trims the last breadcrumb (the breadcrumb of the current route).
   *
   * This function also handles special case when the current route has a configured empty path ('' route).
   * In that case, we trim not only the last route, but also the parent path-wise route (who likely defines
   * the breadcrumb).
   */
  private trimCurrentRoute(
    routes: ActivatedRouteSnapshot[]
  ): ActivatedRouteSnapshot[] {
    // If the last route is '', we trim:
    // - the '' route
    // - any '' routes in the short ancestors line - if any exist

    let i = routes.length - 1;
    while (routes[i]?.routeConfig?.path === '' && i >= 0) {
      i--;
    }

    // Finally we slice the last route with non-empty path (not '')
    return routes.slice(0, i); // return elements from 0 to i-1
  }
}
