export interface AccountRow {
  slug: string;
  name: string;
  group: string;
  bal: number;
  updatedAt: Date;
}

export interface BudgetCategoryRow {
  slug: string;
  name: string;
  amt: number;
  spent: number;
  updatedAt: Date;
}

export interface AppStateRow {
  id: number;
  contributed: number;
  basePrincipal: number | null;
  rothYTDJosh: number;
  rothYTDElana: number;
  currentMonth: string;
  updatedAt: Date;
}

export interface SettingsRow {
  id: number;
  efTarget: number;
  rothLimit: number;
  voo: number;
  qqqm: number;
  stk: number;
  ret: number;
  inflation: number;
  age: number;
  retireAge: number;
  monthly: number;
  updatedAt: Date;
}

export interface SnapPoint {
  t: number;
  nw: number;
  principal: number;
}

export interface StepItem {
  k: string;
  v: number;
}

export interface LogEntry {
  id: number;
  t: number;
  amt: number;
  steps: StepItem[];
}

export interface FullState {
  appState: AppStateRow & { resolvedBasePrincipal: number };
  settings: SettingsRow;
  accounts: AccountRow[];
  budget: BudgetCategoryRow[];
  snaps: SnapPoint[];
  log: LogEntry[];
}
