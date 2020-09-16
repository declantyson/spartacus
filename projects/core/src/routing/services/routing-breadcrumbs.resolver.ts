import { Injectable, Injector } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { combineLatest, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { BreadcrumbMeta } from '../../cms/model/page.model';
import { TranslationService } from '../../i18n';
import { DefaultRouteBreadcrumbResolver } from './default-route-breadcrumb.resolver';
import {
  ActivatedRouteSnapshotWithPageMeta,
  RouteBreadcrumbConfig,
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
@Injectable({ providedIn: 'root' })
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
          routes.map((route, index) =>
            this.resolveRouteBreadcrumb(route, routes.slice(0, index))
          )
        ).pipe(map((breadcrumbArrays) => breadcrumbArrays.flat()))
      : of([]);
  }

  /**
   * Returns the URL path for the given array of activated routes.
   *
   * It concatenates their url segments, separating them with slash.
   */
  protected getUrl(routes: ActivatedRouteSnapshot[]): string {
    return (
      '/' + // prepend slash to make the final url absolute
      routes
        .map((route) =>
          route.url.map((urlSegment) => urlSegment.path).join('/')
        )
        // Some activated routes may have configured an empty path ''. We filter them out.
        // Otherwise it would generate double slash ...//... in the url.
        .filter((urlPart) => !!urlPart)
        .join('/')
    );
  }

  /**
   * Resolves breadcrumbs based on the breadcrumb config placed in Route's `data` property.
   *
   * - When the breadcrumb config contains the property `resolver` with `RouteBreadcrumbResolver` class,
   *    resolving is delegated to it.
   * - Otherwise, it delegates resolving to the the closest defined resolver defined in the ancestors routes
   * - If no ancestor defines resolver, resolving is delegated to `DefaultRouteBreadcrumbResolver`
   *
   * @see `RouteBreadcrumbResolver`
   * @see `DefaultRouteBreadcrumbResolver`
   *
   * @param route route to resolve
   * @param ancestorRoutes ancestor routes of the route to resolve
   */
  protected resolveRouteBreadcrumb(
    route: ActivatedRouteSnapshotWithPageMeta,
    ancestorRoutes: ActivatedRouteSnapshotWithPageMeta[]
  ): Observable<BreadcrumbMeta[]> {
    const url = this.getUrl([...ancestorRoutes, route]);
    const breadcrumbConfig = this.getBreadcrumbConfig(route);

    const resolver = this.getBreadcrumbResolver(route, ancestorRoutes);
    return resolver.resolveBreadcrumbs(url, breadcrumbConfig, route);
  }

  /**
   * Returns the RouteBreadcrumbResolver for the given activate route.
   *
   * * When no resolver defined, it tries to find recursively the closest the resolver in the route's ancestors.
   * * When no ancestor defines the resolver, it fallbacks to the `DefaultRouteBreadcrumbResolver`.
   *
   * @param route route to resolve
   * @param ancestorRoutes ancestor routes of the route to resolve
   */
  protected getBreadcrumbResolver(
    route: ActivatedRouteSnapshotWithPageMeta,
    ancestorRoutes: ActivatedRouteSnapshotWithPageMeta[]
  ): RouteBreadcrumbResolver {
    const routes = [...ancestorRoutes, route];

    // try to inject the first defined resolver, start for the current route
    for (let i = routes.length - 1; i >= 0; i--) {
      const breadcrumbConfig = this.getBreadcrumbConfig(routes[i]);

      const resolver: RouteBreadcrumbResolver =
        typeof breadcrumbConfig !== 'string' &&
        breadcrumbConfig?.resolver &&
        this.injector.get(breadcrumbConfig.resolver, null);

      if (resolver) {
        return resolver;
      }
    }

    // fallback to default, when couldn't find any resolver in route or its ancestors
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
    while (routes[i]?.url.length === 0 && i >= 0) {
      i--;
    }

    // Finally we trim the last route with non-empty path
    return routes.slice(0, i); // we trim: routes[i],...,routes[length-1]
  }

  /**
   * Returns the breadcrumb config placed in the route's `data` configuration.
   */
  private getBreadcrumbConfig(
    route: ActivatedRouteSnapshotWithPageMeta
  ): string | RouteBreadcrumbConfig {
    // Note: we use `route.routeConfig.data` (not `route.data`) to save us from
    // an edge case bug. In Angular, by design the `data` of ActivatedRoute is inherited
    // from the parent route, if only the child has an empty path ''.
    // But in any case we don't want the breadcrumb configs to be inherited, so we
    // read data from the original `routeConfig` which is static.
    return route?.routeConfig?.data?.cxPageMeta?.breadcrumb;
  }
}
