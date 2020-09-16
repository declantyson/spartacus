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

  /**
   * Resolves breadcrumb based on the given url and the breadcrumb config.
   *
   * - When breadcrumb config is empty, it returns an empty breadcrumb.
   * - When breadcrumb config is a string or object with `i18n` property,
   *    it translates it and use as a label of the returned breadcrumb.
   * - When breadcrumb config is an object with property `raw`, then
   *    it's used as a label of the returned breadcrumb.
   */
  resolveBreadcrumbs(
    url: string,
    breadcrumbConfig: string | RouteBreadcrumbConfig
  ): Observable<BreadcrumbMeta[]> {
    if (!breadcrumbConfig) {
      return of([]);
    }

    if (typeof breadcrumbConfig !== 'string' && breadcrumbConfig.raw) {
      return of([{ link: url, label: breadcrumbConfig.raw }]);
    }

    const i18nKey =
      typeof breadcrumbConfig === 'string'
        ? breadcrumbConfig
        : breadcrumbConfig.i18n;

    const label$ = this.resolveParams().pipe(
      switchMap((params) => this.translation.translate(i18nKey, params ?? {}))
    );

    return label$.pipe(map((label) => [{ label, link: url }]));
  }

  /**
   * Resolves dynamic params for the translation key.
   */
  protected resolveParams(): Observable<object> {
    return of({});
  }
}
