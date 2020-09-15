import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { BreadcrumbMeta } from '../../cms/model/page.model';
import { ActivatedRoutesService } from './activated-routes.service';
import {
  RoutingBreadcrumbsResolver,
  RoutingBreadcrumbsResolverOptions,
} from './routing-breadcrumbs.resolver';

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
    protected routingBreadcrumbResolver: RoutingBreadcrumbsResolver
  ) {}

  /**
   * Emits an array of activated routes
   */
  protected readonly routes$ = this.activatedRoutesService.routes$.pipe(
    map((routes) => (routes = routes.slice(1, routes.length))) // drop the first route - the special `root` route
  );

  /**
   * Array of breadcrumbs defined for all the activated routes (from the root route to the leaf route).
   * It emits on every completed routing navigation.
   */
  resolveBreadcrumbs(
    options?: RoutingBreadcrumbsResolverOptions
  ): Observable<BreadcrumbMeta[]> {
    return this.routes$.pipe(
      switchMap((routes) =>
        this.routingBreadcrumbResolver.resolveBreadcrumbs(routes, options)
      )
    );
  }
}
