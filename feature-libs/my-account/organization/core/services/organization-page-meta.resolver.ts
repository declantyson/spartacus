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
import { combineLatest, defer, Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

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
    protected semanticPath: SemanticPathService,
    protected routingService: RoutingService,
    protected routingPageMetaResolver: RoutingPageMetaResolver
  ) {
    super(cms, translation);
  }

  /**
   * Breadcrumb of the homepage.
   */
  protected homepageBreadcrumb$: Observable<BreadcrumbMeta[]> = defer(() =>
    super.resolveBreadcrumbs()
  );

  /**
   * Breadcrumb of the Organization page.
   */
  protected organizationBreadcrumb$: Observable<
    BreadcrumbMeta[]
  > = this.translation.translate(this.ORGANIZATION_TRANSLATION_KEY).pipe(
    map((label) => [
      {
        label,
        link: this.semanticPath.get(this.ORGANIZATION_SEMANTIC_ROUTE),
      },
    ])
  );

  /**
   * Breadcrumbs calculated from Angular (sub)routes.
   */
  protected routesBreadcrumbs$: Observable<BreadcrumbMeta[]> = defer(() =>
    this.routingPageMetaResolver.resolveBreadcrumbs({
      includeCurrentRoute: true, // we will trim the breadcrumb of the current route later on
    })
  );

  /**
   * Breadcrumbs returned in the method #resolveBreadcrumbs.
   */
  private breadcrumbs$: Observable<BreadcrumbMeta[]> = combineLatest([
    this.homepageBreadcrumb$,
    this.organizationBreadcrumb$,
    this.routesBreadcrumbs$,
  ]).pipe(
    map(
      ([
        homepageBreadcrumb,
        organizationHomepageBreadcrumb,
        routesBreadcrumbs,
      ]) => [
        ...homepageBreadcrumb,
        ...organizationHomepageBreadcrumb,
        ...routesBreadcrumbs,
      ]
    ),
    map((routes) => routes.slice(0, -1)), // drop the breadcrumb of the current route (the last one)
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
