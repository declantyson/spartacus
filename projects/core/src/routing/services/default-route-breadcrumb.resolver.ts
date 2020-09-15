import { Injectable } from '@angular/core';
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

  resolveBreadcrumbs(
    path: string,
    breadcrumbConfig: string | RouteBreadcrumbConfig
  ): Observable<BreadcrumbMeta[]> {
    const i18nKey =
      typeof breadcrumbConfig === 'string'
        ? breadcrumbConfig
        : breadcrumbConfig.i18n;

    const label$ = this.resolveParams().pipe(
      switchMap((params) => this.translation.translate(i18nKey, params ?? {}))
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
