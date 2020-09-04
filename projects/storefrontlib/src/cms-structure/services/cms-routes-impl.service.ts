import { Injectable } from '@angular/core';
import { Route, Router } from '@angular/router';
import {
  CmsComponentRoutesConfig,
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

    const componentRoutes = this.cmsComponentsService.getChildRoutes(
      componentTypes
    );
    const componentRoutesConfig = this.cmsComponentsService.getRoutesConfig(
      componentTypes
    );

    if (componentRoutes.length) {
      if (
        this.updateRouting(
          pageContext,
          currentPageLabel,
          componentRoutes,
          componentRoutesConfig
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
    routesConfig: CmsComponentRoutesConfig
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
          cxKey: 'PARENT', // by convention to match the routes configuration of the CMS mapping
          cxCmsRouteContext: {
            type: pageContext.type,
            id: pageLabel,
          },
        },
      };

      this.router.resetConfig([
        this.configureRoute(newRoute, routesConfig),
        ...this.router.config,
      ]);
      return true;
    }

    return false;
  }

  private configureRoutes(
    routes: Route[],
    routesConfig: CmsComponentRoutesConfig
  ): Route[] {
    return routes.map((route) => this.configureRoute(route, routesConfig));
  }

  private configureRoute(
    route: Route,
    routesConfig: CmsComponentRoutesConfig
  ): Route {
    const newRoute = { ...route }; // avoid mutating original objects

    const config = routesConfig[route.data?.cxKey] ?? {}; // SPIKE TODO new convention cxKey!

    // Noe we can configure: path, component and data.
    // In future we may easily support other properties
    newRoute.path = config.path ?? route.path;
    newRoute.component = config.component ?? route.component;
    newRoute.data = deepMerge({}, route.data ?? {}, config.data);

    newRoute.children = this.configureRoutes(
      route.children ?? [],
      routesConfig
    );
    return newRoute;
  }
}
