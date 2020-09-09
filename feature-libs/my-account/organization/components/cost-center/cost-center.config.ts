import {
  AuthGuard,
  CmsConfig,
  ParamsMapping,
  RoutingConfig,
} from '@spartacus/core';
import {
  BREAKPOINT,
  SplitViewDeactivateGuard,
  TableConfig,
} from '@spartacus/storefront';
import { ROUTE_PARAMS } from '../constants';
import { OrganizationTableType } from '../shared/organization.model';
import { CostCenterAssignBudgetsComponent } from './budgets/assign/cost-center-assign-budgets.component';
import { CostCenterBudgetListComponent } from './budgets/list/cost-center-budget-list.component';
import { CostCenterRouteBreadcrumbResolver } from './cost-center-route-breadcrumb.resolver';
import { CostCenterCreateComponent } from './create/cost-center-create.component';
import { CostCenterDetailsComponent } from './details/cost-center-details.component';
import { CostCenterEditComponent } from './edit/cost-center-edit.component';
import { CostCenterListComponent } from './list/cost-center-list.component';

// TODO:#my-account-architecture - Number.MAX_VALUE?
const MAX_OCC_INTEGER_VALUE = 2147483647;

const listPath = `organization/cost-centers/:${ROUTE_PARAMS.costCenterCode}`;
const paramsMapping: ParamsMapping = {
  costCenterCode: 'code',
};

// TODO: this doesn't work with lazy loaded feature
export const costCenterRoutingConfig: RoutingConfig = {
  routing: {
    routes: {
      costCenter: {
        paths: ['organization/cost-centers'],
      },
      costCenterCreate: {
        paths: ['organization/cost-centers/create'],
      },
      costCenterDetails: {
        paths: [`${listPath}`],
        paramsMapping,
      },
      costCenterBudgets: {
        paths: [`${listPath}/budgets`],
        paramsMapping,
      },
      costCenterAssignBudgets: {
        paths: [`${listPath}/budgets/assign`],
        paramsMapping,
      },
      costCenterEdit: {
        paths: [`${listPath}/edit`],
        paramsMapping,
      },
    },
  },
};

export const costCenterCmsConfig: CmsConfig = {
  cmsComponents: {
    ManageCostCentersListComponent: {
      component: CostCenterListComponent,
      childRoutesHost: {
        data: {
          cxPageMeta: {
            breadcrumb: {
              i18n: 'costCenter.breadcrumbs.list',
              resolver: CostCenterRouteBreadcrumbResolver,
            },
          },
        },
      },
      childRoutes: [
        {
          path: 'create',
          component: CostCenterCreateComponent,
          canDeactivate: [SplitViewDeactivateGuard],
          data: {
            cxPageMeta: {
              breadcrumb: {
                i18n: 'costCenter.breadcrumbs.create',
              },
            },
          },
        },
        {
          path: `:${ROUTE_PARAMS.costCenterCode}`,
          canDeactivate: [SplitViewDeactivateGuard],
          data: {
            cxPageMeta: {
              breadcrumb: { i18n: 'costCenter.breadcrumbs.details' },
            },
          },
          children: [
            {
              path: '',
              component: CostCenterDetailsComponent,
              canDeactivate: [SplitViewDeactivateGuard],

              children: [
                {
                  path: 'budgets',
                  component: CostCenterBudgetListComponent,
                  canDeactivate: [SplitViewDeactivateGuard],
                  data: {
                    cxPageMeta: {
                      breadcrumb: {
                        i18n: 'costCenter.breadcrumbs.budgets',
                      },
                    },
                  },
                  children: [
                    {
                      path: 'assign',
                      component: CostCenterAssignBudgetsComponent,
                      canDeactivate: [SplitViewDeactivateGuard],
                      data: {
                        cxPageMeta: {
                          breadcrumb: {
                            i18n: 'costCenter.breadcrumbs.assignBudgets',
                          },
                        },
                      },
                    },
                  ],
                },
              ],
            },
            {
              path: `edit`,
              component: CostCenterEditComponent,
              canDeactivate: [SplitViewDeactivateGuard],
              data: {
                pageMeta: {
                  breadcrumb: { i18n: 'costCenter.breadcrumbs.edit' },
                },
              },
            },
          ],
        },
      ],
      guards: [AuthGuard],
    },
  },
};

export function costCenterTableConfigFactory(): TableConfig {
  return costCenterTableConfig;
}

export const costCenterTableConfig: TableConfig = {
  table: {
    [OrganizationTableType.COST_CENTER]: [
      {
        headers: [{ key: 'name' }],
        pagination: {
          sort: 'byName',
        },
      },
      {
        breakpoint: BREAKPOINT.xs,
        hideHeader: true,
      },
      {
        breakpoint: BREAKPOINT.lg,
        headers: [
          { key: 'name', sortCode: 'byName' },
          { key: 'code', sortCode: 'byCode' },
          { key: 'currency' },
          { key: 'unit', sortCode: 'byUnit' },
        ],
      },
    ],

    [OrganizationTableType.COST_CENTER_BUDGETS]: [
      {
        headers: [{ key: 'summary' }, { key: 'link' }, { key: 'unassign' }],
        hideHeader: true,
        pagination: {
          pageSize: MAX_OCC_INTEGER_VALUE,
        },
      },
    ],
    [OrganizationTableType.COST_CENTER_ASSIGN_BUDGETS]: [
      {
        pagination: {
          sort: 'byName',
        },
      },
      {
        breakpoint: BREAKPOINT.xs,
        headers: [{ key: 'selected' }, { key: 'summary' }, { key: 'link' }],
        hideHeader: true,
      },
      {
        breakpoint: BREAKPOINT.lg,
        headers: [
          { key: 'name', sortCode: 'byName' },
          { key: 'code', sortCode: 'byCode' },
          { key: 'amount', sortCode: 'byValue' },
          { key: 'dateRange' },
        ],
      },
    ],
  },
};
