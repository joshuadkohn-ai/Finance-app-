import type {
  User,
  FinancialAccount,
  Transaction,
  Category,
  CategoryGroup,
  Budget,
  BudgetCategory,
  Goal,
  RecurringTransaction,
  InvestmentHolding,
  Debt,
  Notification,
  Rule,
  HouseholdMember,
} from "@prisma/client";

// Re-export prisma types
export type {
  User,
  FinancialAccount,
  Transaction,
  Category,
  CategoryGroup,
  Budget,
  BudgetCategory,
  Goal,
  RecurringTransaction,
  InvestmentHolding,
  Debt,
  Notification,
  Rule,
  HouseholdMember,
};

// Extended types with relations
export type TransactionWithRelations = Transaction & {
  category?: Category | null;
  account?: FinancialAccount;
};

export type BudgetWithCategories = Budget & {
  categories: (BudgetCategory & { category: Category })[];
};

export type AccountWithHoldings = FinancialAccount & {
  holdings?: InvestmentHolding[];
};

// Dashboard summary types
export type NetWorthSummary = {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
};

export type SpendingSummary = {
  totalSpent: number;
  totalIncome: number;
  topCategories: { name: string; amount: number; color?: string | null }[];
};

export type BudgetSummary = {
  planned: number;
  actual: number;
  remaining: number;
  percentUsed: number;
};

// API response wrapper
export type ApiResponse<T> =
  | { data: T; error?: never }
  | { error: string; data?: never };

// Form types
export type AccountFormData = {
  name: string;
  type: string;
  subtype?: string;
  institution?: string;
  balance: number;
  currency?: string;
  interestRate?: number;
  minimumPayment?: number;
  creditLimit?: number;
  color?: string;
  note?: string;
};

export type TransactionFormData = {
  date: string;
  merchant: string;
  amount: number;
  type: string;
  accountId: string;
  categoryId?: string;
  notes?: string;
  tags?: string[];
};

export type BudgetCategoryFormData = {
  categoryId: string;
  planned: number;
  rollover: boolean;
  isFixed: boolean;
};

export type GoalFormData = {
  name: string;
  type: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate?: string;
  monthlyContrib?: number;
  accountId?: string;
  note?: string;
};
