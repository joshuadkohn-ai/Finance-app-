import { describe, it, expect } from "vitest";
import { buildPlan, simulate, projAtYears, getRothRooms } from "./engine";

const baseState = {
  rothYTD: { josh: 0, elana: 0 },
  rothLimit: 7500,
  budTotal: 4248,
};

describe("buildPlan", () => {
  it("set-aside is capped at half of monthly budget", () => {
    const plan = buildPlan(1000, { ...baseState, budTotal: 4248 });
    expect(plan.toExp).toBe(1000); // 1000 < perPay=2124, so all goes to expense
    expect(plan.alloc.jr).toBe(0);
    expect(plan.alloc.er).toBe(0);
    expect(plan.alloc.tb).toBe(0);
  });

  it("expense set-aside is exactly half of monthly budget when paycheck is large", () => {
    const plan = buildPlan(5000, baseState);
    expect(plan.toExp).toBe(2124); // 4248/2 = 2124
  });

  it("remaining after set-aside is split 50/50 between roths when both have room", () => {
    const plan = buildPlan(5000, baseState);
    const rem = 5000 - 2124; // 2876
    expect(plan.alloc.jr).toBeCloseTo(rem / 2, 1);
    expect(plan.alloc.er).toBeCloseTo(rem / 2, 1);
    expect(plan.alloc.tb).toBe(0);
  });

  it("caps Roth allocation at remaining contribution room", () => {
    const state = {
      ...baseState,
      rothYTD: { josh: 7000, elana: 0 }, // josh has only 500 room
    };
    const plan = buildPlan(5000, state);
    expect(plan.alloc.jr).toBeLessThanOrEqual(500 + 0.01);
  });

  it("redirects to other Roth when one is full", () => {
    const state = {
      ...baseState,
      rothYTD: { josh: 7500, elana: 0 }, // josh is full
    };
    const plan = buildPlan(5000, state);
    expect(plan.alloc.jr).toBe(0);
    const rem = 5000 - 2124;
    expect(plan.alloc.er).toBeCloseTo(Math.min(rem, 7500), 1);
  });

  it("overflow goes to taxable brokerage when both Roths are full", () => {
    const state = {
      ...baseState,
      rothYTD: { josh: 7500, elana: 7500 },
    };
    const plan = buildPlan(5000, state);
    expect(plan.alloc.jr).toBe(0);
    expect(plan.alloc.er).toBe(0);
    const rem = 5000 - 2124;
    expect(plan.alloc.tb).toBeCloseTo(rem, 1);
  });

  it("every dollar is accounted for", () => {
    const plan = buildPlan(3200, baseState);
    const total =
      plan.toExp +
      plan.alloc.jr +
      plan.alloc.er +
      plan.alloc.tb +
      plan.alloc.sv +
      plan.alloc.cr +
      plan.alloc.jc;
    expect(Math.abs(total - plan.amt)).toBeLessThan(0.02);
  });

  it("small paycheck: entire amount goes to set-aside", () => {
    const plan = buildPlan(500, baseState);
    expect(plan.toExp).toBe(500);
    expect(plan.alloc.jr).toBe(0);
    expect(plan.alloc.er).toBe(0);
    expect(plan.alloc.tb).toBe(0);
  });
});

describe("simulate", () => {
  it("returns null if target unreachable in 100 years", () => {
    const result = simulate(1e12, 100, { ret: 0, monthly: 0 });
    expect(result).toBeNull();
  });

  it("returns 0-ish months when already at target", () => {
    const result = simulate(100, 1000, { ret: 7, monthly: 0 });
    expect(result).toBe(0);
  });

  it("returns positive months for reachable target", () => {
    const result = simulate(1_000_000, 100_000, { ret: 9, monthly: 3000 });
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(360);
  });
});

describe("projAtYears", () => {
  it("returns at least the principal when return is 0", () => {
    const { v, p } = projAtYears(10, 10000, 10000, { ret: 0, monthly: 0 });
    expect(v).toBeCloseTo(10000, 0);
    expect(p).toBeCloseTo(10000, 0);
  });

  it("grows with positive return", () => {
    const { v } = projAtYears(10, 10000, 10000, { ret: 7, monthly: 0 });
    expect(v).toBeGreaterThan(10000);
  });

  it("principal tracks contributions correctly", () => {
    const { p } = projAtYears(1, 0, 0, { ret: 0, monthly: 1000 });
    expect(p).toBeCloseTo(12000, 0); // 12 months × $1000
  });
});

describe("getRothRooms", () => {
  it("returns correct room for both", () => {
    const { jRoom, eRoom } = getRothRooms({ josh: 3000, elana: 5000 }, 7500);
    expect(jRoom).toBe(4500);
    expect(eRoom).toBe(2500);
  });

  it("clamps at 0 when over limit", () => {
    const { jRoom } = getRothRooms({ josh: 8000, elana: 0 }, 7500);
    expect(jRoom).toBe(0);
  });
});
