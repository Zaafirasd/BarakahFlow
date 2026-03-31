import type { Category } from '@/types';

const NEEDS_CATEGORIES = ['housing', 'utilities', 'groceries & food', 'transportation', 'healthcare'];
const WANTS_CATEGORIES = ['dining out', 'entertainment', 'clothing', 'subscriptions'];
const GIVING_CATEGORIES = ['zakat al-mal', 'sadaqah'];

// Weights expressed as % of Total Monthly Income
const WEIGHT_MAP: Record<string, number> = {
  // Needs (50% Total)
  'housing': 0.30,
  'utilities': 0.05,
  'groceries & food': 0.075,
  'transportation': 0.05,
  'healthcare': 0.025,
  
  // Wants (25% Total)
  'dining out': 0.10,
  'entertainment': 0.075,
  'clothing': 0.05,
  'subscriptions': 0.025,
  
  // Giving (10% Total)
  'zakat al-mal': 0.05,
  'sadaqah': 0.05,
};

function normalizeCategoryName(name: string) {
  return name.trim().toLowerCase();
}

export function buildAutoBudgetPlan(categories: Pick<Category, 'id' | 'name'>[], monthlyIncome: number) {
  if (monthlyIncome <= 0) {
    return [] as Array<{ categoryId: string; amount: number }>;
  }

  const plan: Array<{ categoryId: string; amount: number }> = [];

  categories.forEach((category) => {
    const normalizedName = normalizeCategoryName(category.name);
    const weight = WEIGHT_MAP[normalizedName];
    
    if (weight !== undefined) {
      plan.push({ 
        categoryId: category.id, 
        amount: Math.round(monthlyIncome * weight) 
      });
    } else {
      // Default to 0 for unknown categories in auto-plan
      plan.push({ categoryId: category.id, amount: 0 });
    }
  });

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

  const budgetAmounts = new Map(
    budgets
      .filter((budget) => Boolean(getCategoryName(budget.category)))
      .map((budget) => [normalizeCategoryName(getCategoryName(budget.category)!), budget.amount])
  );

  // Check if every budget entry matches the Weight Map
  const isAuto = Array.from(budgetAmounts.entries()).every(([name, actual]) => {
    const weight = WEIGHT_MAP[name];
    if (weight === undefined) return actual === 0;
    
    const expected = Math.round(monthlyIncome * weight);
    return Math.abs(actual - expected) < 2; // Allow small rounding diff
  });

  return isAuto ? 'Auto recommended split' : 'Custom';
}

export { GIVING_CATEGORIES, NEEDS_CATEGORIES, WANTS_CATEGORIES, WEIGHT_MAP };
