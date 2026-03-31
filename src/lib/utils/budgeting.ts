import type { Category } from '@/types';

const NEEDS_CATEGORIES = ['housing', 'utilities', 'groceries & food', 'transportation', 'healthcare'];
const WANTS_CATEGORIES = ['dining out', 'entertainment', 'clothing', 'subscriptions'];
const GIVING_CATEGORIES = ['zakat al-mal', 'sadaqah'];

function normalizeCategoryName(name: string) {
  return name.trim().toLowerCase();
}

export function buildAutoBudgetPlan(categories: Pick<Category, 'id' | 'name'>[], monthlyIncome: number) {
  if (monthlyIncome <= 0) {
    return [] as Array<{ categoryId: string; amount: number }>;
  }

  const normalizedCategories = categories.map((category) => ({
    categoryId: category.id,
    name: normalizeCategoryName(category.name),
  }));

  const needs = normalizedCategories.filter((category) => NEEDS_CATEGORIES.includes(category.name));
  const wants = normalizedCategories.filter((category) => WANTS_CATEGORIES.includes(category.name));
  const giving = normalizedCategories.filter((category) => GIVING_CATEGORIES.includes(category.name));

  const plan: Array<{ categoryId: string; amount: number }> = [];

  if (needs.length > 0) {
    const amount = monthlyIncome * 0.5 / needs.length;
    needs.forEach((category) => plan.push({ categoryId: category.categoryId, amount }));
  }

  if (wants.length > 0) {
    const amount = monthlyIncome * 0.25 / wants.length;
    wants.forEach((category) => plan.push({ categoryId: category.categoryId, amount }));
  }

  if (giving.length > 0) {
    const amount = monthlyIncome * 0.1 / giving.length;
    giving.forEach((category) => plan.push({ categoryId: category.categoryId, amount }));
  }

  return plan;
}

type BudgetStyleEntry = {
  amount: number;
  category?: Pick<Category, 'name'> | Pick<Category, 'name'>[] | null;
};

function getCategoryName(category: BudgetStyleEntry['category']) {
  if (Array.isArray(category)) {
    return category[0]?.name;
  }

  return category?.name;
}

export function inferBudgetStyle(budgets: BudgetStyleEntry[], monthlyIncome: number | null) {
  if (!budgets.length || !monthlyIncome || monthlyIncome <= 0) {
    return 'Not set';
  }

  const plan = buildAutoBudgetPlan(
    budgets
      .filter((budget) => Boolean(getCategoryName(budget.category)))
      .map((budget, index) => ({
        id: `budget-style-${index}`,
        name: getCategoryName(budget.category)!,
      })),
    monthlyIncome
  );

  if (!plan.length) {
    return 'Custom';
  }

  const budgetAmounts = new Map(
    budgets
      .filter((budget) => Boolean(getCategoryName(budget.category)))
      .map((budget) => [normalizeCategoryName(getCategoryName(budget.category)!), budget.amount])
  );

  const expectedAmounts = new Map<string, number>();
  budgets.forEach((budget) => {
    const name = getCategoryName(budget.category);
    if (!name) return;
    const normalized = normalizeCategoryName(name);
    const inNeeds = NEEDS_CATEGORIES.includes(normalized);
    const inWants = WANTS_CATEGORIES.includes(normalized);
    const inGiving = GIVING_CATEGORIES.includes(normalized);
    if (!inNeeds && !inWants && !inGiving) return;

    const group = inNeeds ? NEEDS_CATEGORIES : inWants ? WANTS_CATEGORIES : GIVING_CATEGORIES;
    const share = inNeeds ? 0.5 : inWants ? 0.25 : 0.1;
    const inBudgetGroup = budgets.filter((entry) => {
      const categoryName = getCategoryName(entry.category);
      return categoryName ? group.includes(normalizeCategoryName(categoryName)) : false;
    });
    if (!inBudgetGroup.length) return;

    expectedAmounts.set(normalized, monthlyIncome * share / inBudgetGroup.length);
  });

  const isAuto = Array.from(expectedAmounts.entries()).every(([name, expectedAmount]) => {
    const actual = budgetAmounts.get(name);
    return typeof actual === 'number' && Math.abs(actual - expectedAmount) < 1;
  });

  return isAuto ? 'Auto recommended split' : 'Custom';
}

export { GIVING_CATEGORIES, NEEDS_CATEGORIES, WANTS_CATEGORIES };
