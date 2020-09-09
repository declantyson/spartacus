import { Injectable } from '@angular/core';
import {
  BreadcrumbMeta,
  CmsService,
  ContentPageMetaResolver,
  PageBreadcrumbResolver,
  PageTitleResolver,
  RoutingPageMetaResolver,
  RoutingService,
  SemanticPathService,
  TranslationService,
} from '@spartacus/core';
import { combineLatest, defer, Observable, of } from 'rxjs';
import {
  distinctUntilChanged,
  map,
  shareReplay,
  switchMap,
} from 'rxjs/operators';

/**
 * Resolves the page data for Organization Pages.
 *
 * Breadcrumbs are built in this implementation only.
 *
 * @property {string} ORGANIZATION_ROOT_PATH the default root path for organization pages.
 * @property {string} ORGANIZATION_TRANSLATION_KEY the default i18n key for the organization breadcrumb label.
 */
@Injectable({
  providedIn: 'root',
})
export class OrganizationPageMetaResolver extends ContentPageMetaResolver
  implements PageBreadcrumbResolver, PageTitleResolver {
  pageTemplate = 'CompanyPageTemplate';

  /**
   * Translation key for the breadcrumb of Organization home page
   */
  protected readonly ORGANIZATION_TRANSLATION_KEY = 'organization.breadcrumb';

  /**
   * Semantic route name of the Organization home page
   */
  protected readonly ORGANIZATION_SEMANTIC_ROUTE = 'organization';

  constructor(
    protected cms: CmsService,
    protected translation: TranslationService,
    protected routingPageMetaResolver: RoutingPageMetaResolver,
    protected semanticPath: SemanticPathService,
    protected routingService: RoutingService
  ) {
    super(cms, translation, routingPageMetaResolver);
  }

  /**
   * Breadcrumb of the Organization page.
   * It's empty when the current page is the Organization page.
   */
  protected organizationPageBreadcrumb$: Observable<
    BreadcrumbMeta[]
  > = this.routingService.getRouterState().pipe(
    map((routerState) => routerState?.state?.semanticRoute),
    distinctUntilChanged(),
    switchMap((semanticRoute) =>
      semanticRoute === this.ORGANIZATION_SEMANTIC_ROUTE
        ? of([])
        : this.translation.translate(this.ORGANIZATION_TRANSLATION_KEY).pipe(
            map((label) => [
              {
                label,
                link: this.semanticPath.get(this.ORGANIZATION_SEMANTIC_ROUTE),
              },
            ])
          )
    )
  );

  /**
   * Breadcrumbs returned in the method #resolveBreadcrumbs.
   */
  private breadcrumbs$: Observable<BreadcrumbMeta[]> = defer(() =>
    combineLatest([
      this.organizationPageBreadcrumb$,
      super.resolveBreadcrumbs(),
    ])
  ).pipe(
    map(([organizationPageBreadcrumb, breadcrumbs]) => {
      const [home, ...restBreadcrumbs] = breadcrumbs;
      return [home, ...organizationPageBreadcrumb, ...restBreadcrumbs];
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /**
   * Returns list of breadcrumbs for:
   * - the home page
   * - the organization home page
   * - the organization's child pages (i.e. cost center list)
   * - sub-routes of the organization's child pages (i.e. cost center details, edit cost center, ...)
   */
  resolveBreadcrumbs(): Observable<BreadcrumbMeta[]> {
    return this.breadcrumbs$;
  }
}
