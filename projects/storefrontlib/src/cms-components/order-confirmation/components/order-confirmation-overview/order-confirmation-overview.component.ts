import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  Address,
  CheckoutService,
  CostCenter,
  DeliveryMode,
  Order,
  PaymentDetails,
  TranslationService,
} from '@spartacus/core';
import { combineLatest, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Card } from '../../../../shared/components/card/card.component';

@Component({
  selector: 'cx-order-confirmation-overview',
  templateUrl: './order-confirmation-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderConfirmationOverviewComponent implements OnInit, OnDestroy {
  order$: Observable<Order>;

  constructor(
    protected checkoutService: CheckoutService,
    private translation: TranslationService
  ) {}

  ngOnInit() {
    this.order$ = this.checkoutService.getOrderDetails();
  }

  ngOnDestroy() {
    this.checkoutService.clearCheckoutData();
  }

  getOrderCodeCardContent(orderCode: string): Observable<Card> {
    return this.translation
      .translate('checkoutOrderConfirmation.orderNumber')
      .pipe(
        filter(() => Boolean(orderCode)),
        map((textTitle) => ({
          title: textTitle,
          text: [orderCode],
        }))
      );
  }

  getOrderCurrentDateCardContent(isoDate: string): Observable<Card> {
    return this.translation
      .translate('checkoutOrderConfirmation.placedOn')
      .pipe(
        map((textTitle) => {
          const date = this.getDate(new Date(isoDate));

          return {
            title: textTitle,
            text: [date],
          };
        })
      );
  }

  getOrderStatusCardContent(status: string): Observable<Card> {
    return combineLatest([
      this.translation.translate('checkoutOrderConfirmation.status'),
      this.translation.translate('orderDetails.statusDisplay', {
        context: status,
      }),
    ]).pipe(
      map(([textTitle, textStatus]) => ({
        title: textTitle,
        text: [textStatus],
      }))
    );
  }

  getPurchaseOrderNumber(poNumber: string): Observable<Card> {
    return combineLatest([
      this.translation.translate('checkoutReview.poNumber'),
      this.translation.translate('checkoutPO.noPoNumber'),
    ]).pipe(
      map(([textTitle, noneTextTitle]) => ({
        title: textTitle,
        text: [poNumber ? poNumber : noneTextTitle],
      }))
    );
  }

  getMethodOfPaymentCardContent(
    hasPaymentInfo: PaymentDetails
  ): Observable<Card> {
    return combineLatest([
      this.translation.translate('checkoutProgress.methodOfPayment'),
      this.translation.translate('paymentTypes.paymentType_ACCOUNT'),
      this.translation.translate('paymentTypes.paymentType_CARD'),
    ]).pipe(
      map(([textTitle, textAccount, textCard]) => ({
        title: textTitle,
        text: [Boolean(hasPaymentInfo) ? textCard : textAccount],
      }))
    );
  }

  getCostCenterCardContent(costCenter: CostCenter): Observable<Card> {
    return this.translation.translate('checkoutPO.costCenter').pipe(
      filter(() => Boolean(costCenter)),
      map((textTitle) => ({
        title: textTitle,
        textBold: costCenter?.name,
        text: ['(' + costCenter?.unit?.name + ')'],
      }))
    );
  }

  getAddressCardContent(deliveryAddress: Address): Observable<Card> {
    return this.translation.translate('addressCard.shipTo').pipe(
      filter(() => Boolean(deliveryAddress)),
      map((textTitle) => ({
        title: textTitle,
        textBold: `${deliveryAddress.firstName} ${deliveryAddress.lastName}`,
        text: [deliveryAddress.formattedAddress, deliveryAddress.country.name],
      }))
    );
  }

  getDeliveryModeCardContent(deliveryMode: DeliveryMode): Observable<Card> {
    return this.translation.translate('checkoutShipping.shippingMethod').pipe(
      filter(() => Boolean(deliveryMode)),
      map((textTitle) => ({
        title: textTitle,
        textBold: deliveryMode.name,
        text: [
          deliveryMode.description,
          deliveryMode.deliveryCost?.formattedValue
            ? deliveryMode.deliveryCost?.formattedValue
            : '',
        ],
      }))
    );
  }

  getPaymentInfoCardContent(payment: PaymentDetails): Observable<Card> {
    return combineLatest([
      this.translation.translate('paymentForm.payment'),
      this.translation.translate('paymentCard.expires', {
        month: Boolean(payment) ? payment.expiryMonth : '',
        year: Boolean(payment) ? payment.expiryYear : '',
      }),
    ]).pipe(
      filter(() => Boolean(payment)),
      map(([textTitle, textExpires]) => ({
        title: textTitle,
        textBold: payment.accountHolderName,
        text: [payment.cardNumber, textExpires],
      }))
    );
  }

  getBillingAddressCardContent(billingAddress: Address): Observable<Card> {
    return this.translation.translate('paymentForm.billingAddress').pipe(
      filter(() => Boolean(billingAddress)),
      map((textTitle) => ({
        title: textTitle,
        textBold: `${billingAddress.firstName} ${billingAddress.lastName}`,
        text: [billingAddress.formattedAddress, billingAddress.country.name],
      }))
    );
  }

  private getDate(givenDate: Date): string {
    const date = givenDate.toDateString().split(' ');

    const month = date[1];
    const day = date[2];
    const year = date[3];

    return month + ' ' + day + ' ' + year;
  }
}
