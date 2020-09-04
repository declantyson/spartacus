import { Injectable } from '@angular/core';
import {
  CostCenter,
  DefaultRouteBreadcrumbResolver,
  TranslationService,
} from '@spartacus/core';
import { Observable } from 'rxjs';
import { CurrentCostCenterService } from './current-cost-center.service';

@Injectable({ providedIn: 'root' })
export class CostCenterRouteBreadcrumbResolver extends DefaultRouteBreadcrumbResolver {
  constructor(
    translation: TranslationService,
    protected service: CurrentCostCenterService
  ) {
    super(translation);
  }

  /** @override */
  protected resolveParams(): Observable<CostCenter> {
    return this.service.item$;
  }
}
