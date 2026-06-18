export const DEST_NAMES: Record<string, string> = {
  jr: "Josh Roth IRA",
  er: "Elana Roth IRA",
  tb: "Taxable brokerage",
  sv: "Savings / emergency fund",
  cr: "Cash reserve",
  jc: "Keep in checking",
};

export interface Alloc {
  jr: number;
  er: number;
  tb: number;
  sv: number;
  cr: number;
  jc: number;
}

export interface Plan {
  amt: number;
  toExp: number;
  alloc: Alloc;
}

export interface BuildPlanState {
  rothYTD: { josh: number; elana: number };
  rothLimit: number;
  budTotal: number;
}

export interface ProjectionSettings {
  ret: number;
  monthly: number;
  age: number;
  retireAge: number;
  inflation: number;
}

export interface StepItem {
  k: string;
  v: number;
}

export interface MilestoneData {
  t: number;
  pct: number;
  m: number | null;
  d: Date | null;
}

export interface ProjChartPoint {
  age: number;
  total: number;
  principal: number;
}

const r2 = (v: number) => Math.round(v * 100) / 100;

export function buildPlan(amt: number, state: BuildPlanState): Plan {
  const { rothYTD, rothLimit, budTotal } = state;
  const perPay = budTotal / 2;
  const jRoom = Math.max(0, rothLimit - rothYTD.josh);
  const eRoom = Math.max(0, rothLimit - rothYTD.elana);

  let rem = amt;
  const toExp = r2(Math.min(rem, perPay));
  rem -= toExp;

  let toJ = Math.min(rem / 2, jRoom);
  let toE = Math.min(rem / 2, eRoom);
  let left = rem - toJ - toE;

  if (left > 0.005) {
    const xj = Math.min(left, jRoom - toJ);
    toJ += xj;
    left -= xj;
    const xe = Math.min(left, eRoom - toE);
    toE += xe;
    left -= xe;
  }

  return { amt, toExp, alloc: { jr: r2(toJ), er: r2(toE), tb: r2(left), sv: 0, cr: 0, jc: 0 } };
}

export function buildSteps(plan: Plan): StepItem[] {
  const { toExp, alloc } = plan;
  const steps: StepItem[] = [{ k: "Expense set-aside", v: toExp }];
  for (const [k, v] of Object.entries(alloc)) {
    if (v > 0.005) steps.push({ k: DEST_NAMES[k], v });
  }
  return steps.filter((x) => x.v > 0.005);
}

export function simulate(
  target: number,
  nw: number,
  settings: { ret: number; monthly: number }
): number | null {
  const r = settings.ret / 100 / 12;
  let v = nw;
  let m = 0;
  while (v < target && m < 1200) {
    v = v * (1 + r) + settings.monthly;
    m++;
  }
  return m >= 1200 ? null : m;
}

export function projAtYears(
  years: number,
  nw: number,
  principal: number,
  settings: { ret: number; monthly: number }
): { v: number; p: number } {
  const r = settings.ret / 100 / 12;
  let v = nw;
  let p = principal;
  for (let m = 0; m < years * 12; m++) {
    v = v * (1 + r) + settings.monthly;
    p += settings.monthly;
  }
  return { v, p };
}

export function computeMilestones(
  nw: number,
  settings: { ret: number; monthly: number }
): MilestoneData[] {
  const targets = [250_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000];
  return targets.map((t) => {
    const m = nw >= t ? 0 : simulate(t, nw, settings);
    return {
      t,
      pct: Math.min(100, (nw / t) * 100),
      m,
      d: m ? new Date(Date.now() + m * 30.44 * 864e5) : null,
    };
  });
}

export function buildProjChart(
  nw: number,
  principal: number,
  settings: ProjectionSettings
): ProjChartPoint[] {
  const years = settings.retireAge - settings.age;
  const out: ProjChartPoint[] = [];
  for (let y = 0; y <= years; y++) {
    const { v, p } = projAtYears(y, nw, principal, settings);
    out.push({ age: settings.age + y, total: Math.round(v), principal: Math.round(p) });
  }
  return out;
}

export function getRothRooms(rothYTD: { josh: number; elana: number }, rothLimit: number) {
  return {
    jRoom: Math.max(0, rothLimit - rothYTD.josh),
    eRoom: Math.max(0, rothLimit - rothYTD.elana),
  };
}
