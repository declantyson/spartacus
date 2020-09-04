import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { BreadcrumbMeta } from '../../cms/model/page.model';
import { TranslationService } from '../../i18n';
import {
  RouteBreadcrumbConfig,
  RouteBreadcrumbResolver,
} from './route-page-meta.model';

/**
 * Resolves the breadcrumb for the Angular ActivatedRouteSnapshot
 */
@Injectable({ providedIn: 'root' })
export abstract class DefaultRouteBreadcrumbResolver
  implements RouteBreadcrumbResolver {
  constructor(protected translation: TranslationService) {}

  /**
   * Turns the route definition (with its breadcrumb config) into the resolved breadcrumb.
   *
   * @param breadcrumbConfig Route's breadcrumb config
   * @param route The Angular ActivatedRouteSnapshot
   * @param path the string URL path to the ActivatedRouteSnapshot
   */
  resolveBreadcrumbs(
    _route: ActivatedRouteSnapshot,
    breadcrumbConfig: RouteBreadcrumbConfig,
    path: string
  ): Observable<BreadcrumbMeta[]> {
    const label$ = this.resolveParams().pipe(
      switchMap((params) =>
        this.translation.translate(breadcrumbConfig.i18n, params ?? {})
      )
    );

    return label$.pipe(map((label) => [{ label, link: path }]));
  }

  /**
   * Resolves dynamic params for the translation key.
   */
  protected resolveParams(): Observable<object> {
    return of({});
  }
}
