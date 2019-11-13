import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthGuard, CmsConfig, ConfigModule } from '@spartacus/core';
import { PageLayoutComponent } from '../../../../../cms-structure/page/page-layout/page-layout.component';
import { CmsPageGuard } from '../../../../../cms-structure/guards/cms-page.guard';
import { CancellationReturnItemsModule } from '../cancellation-return-items/cancellation-return-items.module';
import { ReturnOrderComponent } from './return-order.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: 'my-account/order/:orderCode/return',
        canActivate: [CmsPageGuard],
        component: PageLayoutComponent,
        data: { pageLabel: '/my-account/order/return' },
      },
      {
        path: 'my-account/order/:orderCode/return/confirmation',
        canActivate: [CmsPageGuard],
        component: PageLayoutComponent,
        data: { pageLabel: '/my-account/order/return/confirmation' },
      },
    ]),
    ConfigModule.withConfig(<CmsConfig>{
      cmsComponents: {
        ReturnOrderComponent: {
          component: ReturnOrderComponent,
          guards: [AuthGuard],
        },
      },
    }),
    CancellationReturnItemsModule,
  ],
  declarations: [ReturnOrderComponent],
  exports: [ReturnOrderComponent],
  entryComponents: [ReturnOrderComponent],
})
export class ReturnOrderModule {}
