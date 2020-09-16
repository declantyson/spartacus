import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { OrderApprovalPermissionType, Permission } from '@spartacus/core';
import { CustomFormValidators } from '@spartacus/storefront';

export enum PermissionType {
  ORDER = 'B2BOrderThresholdPermission',
  TIMESPAN = 'B2BOrderThresholdTimespanPermission',
  EXCEEDED = 'B2BBudgetExceededPermission',
}
@Injectable({
  providedIn: 'root',
})
export class PermissionFormService {
  getForm(model?: Permission): FormGroup {
    const form = new FormGroup({});
    this.build(form);
    if (model) {
      if (model.orderApprovalPermissionType) {
        this.adjustForm(form, model.orderApprovalPermissionType);
      }
      form.patchValue(model);
    }
    return form;
  }

  protected build(form: FormGroup) {
    form.setControl(
      'code',
      new FormControl('', [
        Validators.required,
        CustomFormValidators.noSpecialCharacters,
      ])
    );
    form.setControl(
      'orderApprovalPermissionType',
      new FormGroup({
        code: new FormControl(null, Validators.required),
      })
    );
    form.setControl(
      'orgUnit',
      new FormGroup({
        uid: new FormControl(undefined, Validators.required),
      })
    );
    this.setAdditionalFields(form);
  }

  /**
   * Depending on permission type form should render custom set of additional fields.
   * This method is used to re-create additonal ones in case they not exists
   * in `FormGroup` controls.
   */
  protected setAdditionalFields(form: FormGroup) {
    form.setControl('periodRange', new FormControl('', Validators.required));
    form.setControl(
      'currency',
      new FormGroup({
        isocode: new FormControl(undefined, Validators.required),
      })
    );
    form.setControl(
      'threshold',
      new FormControl('', [
        Validators.required,
        CustomFormValidators.mustBePositive,
      ])
    );
  }

  /**
   * Depending on permission type form should render custom set of additional fields.
   * This method removes redundant fields from `FormGroup` controls.
   */
  protected unsetFields(form: FormGroup, fieldNames: string[]) {
    fieldNames.forEach((name) => form.removeControl(name));
  }

  /**
   * Adjusting `FormGroup` controls model based on selected permission type.
   */
  public adjustForm(form: FormGroup, type: OrderApprovalPermissionType) {
    switch (type.code) {
      case PermissionType.EXCEEDED: {
        this.unsetFields(form, ['periodRange', 'currency', 'threshold']);
        break;
      }
      case PermissionType.TIMESPAN: {
        this.setAdditionalFields(form);
        break;
      }
      case PermissionType.ORDER: {
        this.setAdditionalFields(form);
        this.unsetFields(form, ['periodRange']);
      }
    }
  }
}
