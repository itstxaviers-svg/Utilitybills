import { describe, expect, it } from "vitest";
import { createDefaultState, getDeadline, getLocalDateKey, getLocalMonthKey, isPerfectMonth, lifetimePoints, monthTotal, parseRublesToKopecks, pointsForMonth } from "./lib";

describe("деньги", () => {
  it("понимает запятую и точку", () => {
    expect(parseRublesToKopecks("1284,50")).toBe(128450);
    expect(parseRublesToKopecks("1284.5")).toBe(128450);
    expect(parseRublesToKopecks("0")).toBe(0);
  });
});

describe("локальные даты", () => {
  it("создаёт ключи без UTC-сдвига", () => {
    const date = new Date(2026, 7, 13, 0, 5);
    expect(getLocalDateKey(date)).toBe("2026-08-13");
    expect(getLocalMonthKey(date)).toBe("2026-08");
    expect(new Date(getDeadline("2026-08", 15)).getDate()).toBe(15);
  });
});

describe("производные итоги", () => {
  it("суммирует копейки и считает очки независимо от суммы", () => {
    const state = createDefaultState(new Date(2026, 7, 13));
    const key = "2026-08";
    state.ledgers[key].payments.gas = { utilityId: "gas", amountKopecks: 10, paidAt: 1, updatedAt: 1, deadlineAt: 2, onTime: true };
    state.ledgers[key].payments.electricity = { utilityId: "electricity", amountKopecks: 20, paidAt: 3, updatedAt: 3, deadlineAt: 2, onTime: false };
    expect(monthTotal(state, key)).toBe(30);
    expect(pointsForMonth(state, key)).toBe(50);
    expect(lifetimePoints(state)).toBe(50);
  });

  it("требует все семь платежей и четыре показания вовремя", () => {
    const state = createDefaultState(new Date(2026, 7, 13));
    const key = "2026-08";
    for (const utility of state.utilities) {
      state.ledgers[key].payments[utility.id] = { utilityId: utility.id, amountKopecks: 100, paidAt: 1, updatedAt: 1, deadlineAt: 2, onTime: true };
      if (utility.requiresMeterReading) state.ledgers[key].readings[utility.id] = { utilityId: utility.id, submittedAt: 1, updatedAt: 1, deadlineAt: 2, onTime: true };
    }
    expect(isPerfectMonth(state, key)).toBe(true);
    state.ledgers[key].readings.gas!.onTime = false;
    expect(isPerfectMonth(state, key)).toBe(false);
  });
});
