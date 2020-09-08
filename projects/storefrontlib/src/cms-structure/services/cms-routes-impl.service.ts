import { Injectable } from '@angular/core';
import { Route, Router } from '@angular/router';
import {
  CmsComponentChildRoutesConfig,
  CmsComponentRoutesConfig,
  CmsComponentRoutesStructure,
  CmsRoute,
  deepMerge,
  PageContext,
  PageType,
} from '@spartacus/core';
import { PageLayoutComponent } from '../page/page-layout/page-layout.component';
import { CmsComponentsService } from './cms-components.service';

// This service should be exposed in public API only after the refactor planned in https://github.com/SAP/spartacus/issues/7070
@Injectable({ providedIn: 'root' })
export class CmsRoutesImplService {
  constructor(
    private router: Router,
    private cmsComponentsService: CmsComponentsService
  ) {
    // SPIKE TODO REMOVE:
    window['router'] = router;
  }

  private cmsRouteExists(url: string): boolean {
    const isCmsDrivenRoute = url.startsWith('/');

    if (!isCmsDrivenRoute) {
      return false;
    }

    const routePath = url.substr(1);

    return (
      isCmsDrivenRoute &&
      !!this.router.config.find(
        (route: CmsRoute) =>
          route.data && route.data.cxCmsRouteContext && route.path === routePath
      )
    );
  }

  /**
   * Contains Cms driven routing logic intended for use use in guards, especially in canActivate method.
   *
   * Will return true, when logic wont have to modify routing (so canActivate could be easily resolved to true)
   * or will return false, when routing configuration was updated and redirection to newly generated route was initiated.
   *
   * @param pageContext
   * @param currentUrl
   */
  handleCmsRoutesInGuard(
    pageContext: PageContext,
    componentTypes: string[],
    currentUrl: string,
    currentPageLabel: string
  ): boolean {
    if (this.cmsRouteExists(currentPageLabel)) {
      return true;
    }

    const childRoutesConfig = this.cmsComponentsService.getChildRoutes(
      componentTypes
    );

    // SPIKE TODO: deprecate Route[]. When support for it is dropped, we can remove this check:
    const childRoutes: Route[] = Array.isArray(childRoutesConfig)
      ? childRoutesConfig
      : // when it's not array, it's a object config needed to build routes
        this.buildChildRoutes(
          childRoutesConfig.structure,
          childRoutesConfig.routes
        );

    if (childRoutes.length) {
      if (
        this.updateRouting(
          pageContext,
          currentPageLabel,
          childRoutes,
          Array.isArray(childRoutesConfig) ? null : childRoutesConfig //deprecate Route[]. When support for it is dropped, we can remove this check and return `childRoutesConfig`
        )
      ) {
        this.router.navigateByUrl(currentUrl);
        return false;
      }
    }
    return true;
  }

  private updateRouting(
    pageContext: PageContext,
    pageLabel: string,
    routes: Route[],
    childRoutesConfig?: CmsComponentChildRoutesConfig
  ): boolean {
    if (
      pageContext.type === PageType.CONTENT_PAGE &&
      pageLabel.startsWith('/') &&
      pageLabel.length > 1
    ) {
      const newRoute: CmsRoute = {
        path: pageLabel.substr(1),
        component: PageLayoutComponent,
        children: routes,
        data: {
          cxCmsRouteContext: {
            type: pageContext.type,
            id: pageLabel,
          },
        },
      };

      // Configurablity of the parent route limited to only extending the `data` property.

      // SPIKE TODO: 'PARENT' to match the parent by convention
      // we can mutate original object, because it's already fresh
      deepMerge(
        newRoute.data,
        childRoutesConfig?.routes?.['PARENT']?.data ?? {}
      );

      this.router.resetConfig([newRoute, ...this.router.config]);
      return true;
    }

    return false;
  }

  private buildChildRoutes(
    routesStructure: CmsComponentRoutesStructure[],
    routesConfig: CmsComponentRoutesConfig
  ): Route[] {
    return routesStructure.map((route) => this.buildRoute(route, routesConfig));
  }

  private buildRoute(
    structure: CmsComponentRoutesStructure,
    routesConfig: CmsComponentRoutesConfig
  ): Route {
    // avoid mutating the original config object
    const newRoute = { ...(routesConfig[structure.key] ?? {}) } as Route; // SPIKE TODO new convention: key!
    newRoute.children = this.buildChildRoutes(
      structure.children ?? [],
      routesConfig
    );
    return newRoute;
  }
}
