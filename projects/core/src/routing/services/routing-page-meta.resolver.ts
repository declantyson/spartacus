import { Injectable, Injector } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { combineLatest, Observable, of } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { BreadcrumbMeta } from '../../cms/model/page.model';
import { TranslationService } from '../../i18n';
import { ActivatedRoutesService } from './activated-routes.service';
import { DefaultRouteBreadcrumbResolver } from './default-route-breadcrumb.resolver';
import {
  RouteBreadcrumbResolver,
  RouteWithPageMetaConfig,
} from './route-page-meta.model';

export interface RoutingBreadcrumbResolverOptions {
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
export class RoutingPageMetaResolver {
  constructor(
    protected activatedRoutesService: ActivatedRoutesService,
    protected injector: Injector,
    protected translation: TranslationService
  ) {}

  /**
   * Array of breadcrumbs defined for all the activated routes (from the root route to the leaf route).
   * It emits on every completed routing navigation.
   */
  resolveBreadcrumbs(
    options: RoutingBreadcrumbResolverOptions
  ): Observable<BreadcrumbMeta[]> {
    return this.activatedRoutesService.routes$.pipe(
      map((routes) =>
        options?.includeCurrentRoute ? routes : routes.slice(0, -1)
      ), // SPIKE TODO: consider don't take current route (leaf route) into account
      switchMap((routes) =>
        routes.length
          ? combineLatest(
              routes.map((route) => this.resolveRouteBreadcrumb(route))
            )
          : of([])
      ),
      map((routesBreadcrumbs) => routesBreadcrumbs.flat()),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /**
   * Returns the URL path for the given activated route.
   *
   * It can be used to build URL path not only for the leaf activated route,
   * but also for the intermediate ones, in between the root and the leaf route.
   */
  protected getPath(activatedRoute: ActivatedRouteSnapshot): string {
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
   * - Otherwise, resolving is delegated to the `DefaultRouteBreadcrumbResolver`.
   *
   * @see `RouteBreadcrumbResolver`
   * @see `DefaultRouteBreadcrumbResolver`
   */
  protected resolveRouteBreadcrumb(
    route: ActivatedRouteSnapshot & RouteWithPageMetaConfig
  ): Observable<BreadcrumbMeta[]> {
    const path = this.getPath(route);

    const breadcrumbConfig = route.data?.cxPageMeta?.breadcrumb;

    if (!breadcrumbConfig) {
      return of([]);
    }

    if (typeof breadcrumbConfig === 'string') {
      return of([{ link: path, label: breadcrumbConfig }]);
    }

    const resolver: RouteBreadcrumbResolver =
      this.injector.get(breadcrumbConfig.resolver, null) ||
      this.injector.get(DefaultRouteBreadcrumbResolver, null);

    return resolver.resolveBreadcrumbs(path, breadcrumbConfig, route);
  }
}
