import { Type } from '@angular/core';
import { inject, TestBed } from '@angular/core/testing';
import { EntitiesModel } from '@spartacus/core';
import { Budget } from '../../../../model/budget.model';
import { OccConfig } from '../../../config/occ-config';
import { Occ } from '../../../occ-models/occ.models';
import { OccBudgetListNormalizer } from './occ-budget-list-normalizer';

const MockOccModuleConfig: OccConfig = {
  backend: {
    occ: {
      baseUrl: '',
      prefix: '',
    },
  },
};

describe('BudgetListNormalizer', () => {
  let service: OccBudgetListNormalizer;

  const budget: Occ.Budget = {
    name: 'Budget1',
    code: 'testCode',
  };

  const budgetList: Occ.BudgetsList = {
    budgets: [budget],
  };

  const targetBudget: Budget = {
    name: 'Budget1',
    code: 'testCode',
  };

  const targetBudgetList: EntitiesModel<Budget> = {
    values: [targetBudget],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OccBudgetListNormalizer,
        { provide: OccConfig, useValue: MockOccModuleConfig },
      ],
    });

    service = TestBed.get(
      OccBudgetListNormalizer as Type<OccBudgetListNormalizer>
    );
  });

  it('should inject OccBudgetListNormalizer', inject(
    [OccBudgetListNormalizer],
    (budgetListNormalizer: OccBudgetListNormalizer) => {
      expect(budgetListNormalizer).toBeTruthy();
    }
  ));

  it('should convert budget list', () => {
    const result = service.convert(budgetList);
    expect(result.values).toEqual(targetBudgetList.values);
  });

  it('should convert budget list with applied target', () => {
    const result = service.convert(budgetList, targetBudgetList);
    expect(result).toEqual(targetBudgetList);
  });
});