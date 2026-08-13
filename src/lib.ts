import { BADGES, POINTS, UTILITIES } from "./config";
import type { AnnualSummary, AppNotice, AppState, CharacterId, MeterUtilityId, MonthLedger, UtilityId } from "./types";

export const STORAGE_KEY = "focusTool.utilityPlanner.v2";
export const V1_STORAGE_KEY = "focusTool.utilityPlanner.v1";

const pad = (value: number) => String(value).padStart(2, "0");
export const getLocalDateKey = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const getLocalMonthKey = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
export const monthKeyToDate = (monthKey: string) => {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1);
};
export const dateKeyToDate = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
};
export const getDeadline = (monthKey: string, day: 15 | 20) => {
  const base = monthKeyToDate(monthKey);
  return new Date(base.getFullYear(), base.getMonth(), day, 23, 59, 59, 999).getTime();
};
export const isMonthFinished = (monthKey: string, now = new Date()) => {
  const date = monthKeyToDate(monthKey);
  return new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime() <= now.getTime();
};
export const formatMonth = (monthKey: string, withYear = true) => new Intl.DateTimeFormat("ru-RU", { month: "long", ...(withYear ? { year: "numeric" } : {}) }).format(monthKeyToDate(monthKey));
export const formatDate = (timestamp: number) => new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(timestamp);
export const formatKopecks = (value: number) => new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", minimumFractionDigits: 2 }).format(value / 100);
export function parseRublesToKopecks(input: string) {
  const normalized = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(?:\.\d{0,2})?$/.test(normalized)) return 0;
  const value = Math.round(Number(normalized) * 100);
  return Number.isSafeInteger(value) && value > 0 ? value : 0;
}

export const METER_UTILITY_IDS: MeterUtilityId[] = ["hot-water", "cold-water", "gas", "electricity"];

export const makeLedger = (monthKey: string, requiredReadingIds: MeterUtilityId[] = []): MonthLedger => ({
  monthKey,
  requiredReadingIds: [...requiredReadingIds],
  payments: {},
  readings: {},
  celebrationShown: false,
  perfectMonthRewardGranted: false,
  sailorBadgeEligible: false,
  sailorBadgeClaimed: false,
  sailorBadgeId: null,
});

export const makeJournal = (dateKey: string) => ({ dateKey, mood: null, thought: "", threeTaskMilestoneShown: false, threeTaskBonusGranted: false });

export function createDefaultState(now = new Date()): AppState {
  const monthKey = getLocalMonthKey(now);
  return {
    version: 2,
    profile: { name: "", avatarMode: "preset", selectedAvatarId: "sailor-moon", uploadedAvatarDataUrl: null, notificationPreference: "unknown", soundEnabled: false, reducedEffects: false },
    utilities: UTILITIES.map((utility) => ({ ...utility })),
    meterSettings: {
      configured: false,
      selected: { "hot-water": false, "cold-water": false, gas: false, electricity: false },
    },
    ledgers: { [monthKey]: makeLedger(monthKey) },
    journals: {},
    completionEvents: [],
    badgeCollection: { unlocked: [], activeBadgeId: null, claimedMonthKeys: [] },
    annualSummaries: {},
    notificationLog: {},
    ui: { lastEncouragementIndex: null, selectedCalendarMonth: null },
  };
}

function sanitizeState(value: unknown, now = new Date()): AppState {
  const defaults = createDefaultState(now);
  if (!value || typeof value !== "object") return defaults;
  const raw = value as Partial<AppState>;
  const profile = raw.profile && typeof raw.profile === "object" ? raw.profile : defaults.profile;
  const meterSettings = raw.meterSettings && typeof raw.meterSettings === "object" ? raw.meterSettings : defaults.meterSettings;
  const state: AppState = {
    ...defaults,
    ...raw,
    version: 2,
    profile: { ...defaults.profile, ...profile },
    utilities: defaults.utilities.map((utility) => ({ ...utility, ...(Array.isArray(raw.utilities) ? raw.utilities.find((item) => item?.id === utility.id) : null) })),
    meterSettings: {
      configured: Boolean(meterSettings.configured),
      selected: { ...defaults.meterSettings.selected, ...(meterSettings.selected ?? {}) },
    },
    ledgers: raw.ledgers && typeof raw.ledgers === "object" ? raw.ledgers : defaults.ledgers,
    journals: raw.journals && typeof raw.journals === "object" ? raw.journals : {},
    completionEvents: Array.isArray(raw.completionEvents) ? raw.completionEvents : [],
    badgeCollection: { ...defaults.badgeCollection, ...(raw.badgeCollection ?? {}) },
    annualSummaries: raw.annualSummaries && typeof raw.annualSummaries === "object" ? raw.annualSummaries : {},
    notificationLog: raw.notificationLog && typeof raw.notificationLog === "object" ? raw.notificationLog : {},
    ui: { ...defaults.ui, ...(raw.ui ?? {}) },
  };
  const currentMonth = getLocalMonthKey(now);
  const selected = getSelectedMeterIds(state);
  for (const [monthKey, ledger] of Object.entries(state.ledgers)) {
    if (!Array.isArray(ledger.requiredReadingIds)) {
      ledger.requiredReadingIds = monthKey === currentMonth ? selected : METER_UTILITY_IDS.filter((id) => Boolean(ledger.readings[id]));
    }
  }
  if (!state.ledgers[currentMonth]) state.ledgers[currentMonth] = makeLedger(currentMonth, selected);
  return state;
}

export function loadState(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return reconcileState(sanitizeState(JSON.parse(stored)));
    const old = localStorage.getItem(V1_STORAGE_KEY);
    if (old) {
      const migrated = reconcileState(sanitizeState(JSON.parse(old)));
      saveState(migrated);
      localStorage.removeItem(V1_STORAGE_KEY);
      return migrated;
    }
  } catch (error) {
    console.warn("Не удалось прочитать локальные данные Focus Tool", error);
  }
  return createDefaultState();
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.warn("Не удалось сохранить локальные данные Focus Tool", error);
    return false;
  }
}

export function resetAppState(now = new Date()) {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(V1_STORAGE_KEY);
  return createDefaultState(now);
}

export function getSelectedMeterIds(state: AppState, monthKey?: string): MeterUtilityId[] {
  if (monthKey && Array.isArray(state.ledgers[monthKey]?.requiredReadingIds)) return state.ledgers[monthKey].requiredReadingIds;
  if (!state.meterSettings.configured) return [];
  return METER_UTILITY_IDS.filter((id) => state.meterSettings.selected[id]);
}

export function monthTotal(state: AppState, monthKey: string) {
  return Object.values(state.ledgers[monthKey]?.payments ?? {}).reduce((sum, payment) => sum + (payment?.amountKopecks ?? 0), 0);
}

export function isPerfectMonth(state: AppState, monthKey: string) {
  const ledger = state.ledgers[monthKey];
  if (!ledger) return false;
  const enabled = state.utilities.filter((utility) => utility.enabled);
  return enabled.every((utility) => Boolean(ledger.payments[utility.id]?.onTime)) && getSelectedMeterIds(state, monthKey).every((id) => Boolean(ledger.readings[id]?.onTime));
}

export function pointsForMonth(state: AppState, monthKey: string) {
  const ledger = state.ledgers[monthKey];
  if (!ledger) return 0;
  let total = Object.values(ledger.payments).reduce((sum, payment) => sum + (payment ? POINTS.paymentBase + (payment.onTime ? POINTS.paymentOnTimeBonus : 0) : 0), 0);
  total += Object.values(ledger.readings).reduce((sum, reading) => sum + (reading ? POINTS.readingBase + (reading.onTime ? POINTS.readingOnTimeBonus : 0) : 0), 0);
  total += Object.values(state.journals).filter((journal) => journal.dateKey.startsWith(monthKey) && journal.threeTaskBonusGranted).length * POINTS.threeTasksDailyBonus;
  if (ledger.perfectMonthRewardGranted) total += POINTS.perfectMonthBonus;
  return total;
}

export const lifetimePoints = (state: AppState) => Object.keys(state.ledgers).reduce((sum, key) => sum + pointsForMonth(state, key), 0);

export function buildAnnualSummary(state: AppState, year: number): AnnualSummary {
  const keys = Object.keys(state.ledgers).filter((key) => key.startsWith(`${year}-`) && Object.keys(state.ledgers[key].payments).length > 0);
  const totals = keys.map((key) => [key, monthTotal(state, key)] as const);
  const totalPaidKopecks = totals.reduce((sum, [, total]) => sum + total, 0);
  const highest = totals.reduce<readonly [string | null, number]>((best, item) => item[1] > best[1] ? item : best, [null, 0]);
  const payments = keys.flatMap((key) => Object.values(state.ledgers[key].payments).filter(Boolean));
  return {
    year,
    totalPaidKopecks,
    averageMonthlyKopecks: keys.length ? Math.round(totalPaidKopecks / keys.length) : 0,
    highestCostMonthKey: highest[0],
    highestCostMonthKopecks: highest[1],
    onTimePayments: payments.filter((payment) => payment?.onTime).length,
    latePayments: payments.filter((payment) => payment && !payment.onTime).length,
    perfectMonths: keys.filter((key) => isPerfectMonth(state, key)).length,
    totalPoints: keys.reduce((sum, key) => sum + pointsForMonth(state, key), 0),
    generatedAt: Date.now(),
  };
}

export function reconcileState(input: AppState, now = new Date()) {
  const state = structuredClone(input);
  const currentMonth = getLocalMonthKey(now);
  if (!state.ledgers[currentMonth]) state.ledgers[currentMonth] = makeLedger(currentMonth, getSelectedMeterIds(state));
  for (const [monthKey, ledger] of Object.entries(state.ledgers)) {
    const allPaid = state.utilities.filter((utility) => utility.enabled).every((utility) => Boolean(ledger.payments[utility.id]));
    ledger.sailorBadgeEligible = allPaid;
    if (isMonthFinished(monthKey, now) && isPerfectMonth(state, monthKey)) ledger.perfectMonthRewardGranted = true;
  }
  const currentYear = now.getFullYear();
  for (const year of new Set(Object.keys(state.ledgers).map((key) => Number(key.slice(0, 4))))) {
    if (year < currentYear) state.annualSummaries[String(year)] = buildAnnualSummary(state, year);
  }
  return state;
}

export function claimReward(state: AppState, monthKey: string) {
  const ledger = state.ledgers[monthKey];
  if (!ledger?.sailorBadgeEligible || ledger.sailorBadgeClaimed || !isMonthFinished(monthKey)) return state;
  const next = structuredClone(state);
  const unlocked = new Set(next.badgeCollection.unlocked.map((item) => item.badgeId));
  const available = BADGES.filter((badge) => !unlocked.has(badge.id));
  const badge = available[Math.floor(Math.random() * available.length)];
  if (badge) {
    next.ledgers[monthKey].sailorBadgeId = badge.id;
    next.badgeCollection.unlocked.push({ badgeId: badge.id, earnedForMonthKey: monthKey, unlockedAt: Date.now() });
    if (!next.badgeCollection.activeBadgeId) next.badgeCollection.activeBadgeId = badge.id;
  }
  next.ledgers[monthKey].sailorBadgeClaimed = true;
  next.badgeCollection.claimedMonthKeys.push(monthKey);
  return next;
}

export function pendingRewardMonth(state: AppState) {
  return Object.keys(state.ledgers).sort().find((key) => state.ledgers[key].sailorBadgeEligible && !state.ledgers[key].sailorBadgeClaimed && isMonthFinished(key)) ?? null;
}

export function pendingCelebrationMonth(state: AppState) {
  return Object.keys(state.ledgers).sort().find((key) => isMonthFinished(key) && isPerfectMonth(state, key) && !state.ledgers[key].celebrationShown) ?? null;
}

export function dailyCompletionCount(state: AppState, dateKey: string) {
  return new Set(state.completionEvents.filter((event) => event.dateKey === dateKey).map((event) => event.id)).size;
}

export function nextDeadlineText(state: AppState, now = new Date()) {
  const monthKey = getLocalMonthKey(now);
  const ledger = state.ledgers[monthKey] ?? makeLedger(monthKey);
  const paymentsLeft = state.utilities.filter((utility) => utility.enabled && !ledger.payments[utility.id]).length;
  const selectedMeterIds = getSelectedMeterIds(state, monthKey);
  const readingsLeft = selectedMeterIds.filter((id) => !ledger.readings[id]).length;
  const monthName = new Intl.DateTimeFormat("ru-RU", { month: "long" }).format(now);
  if (paymentsLeft) return { title: "Ближайший срок", body: `Оплата услуг — до 15 ${monthName}`, foot: `Осталось ${paymentsLeft} из ${state.utilities.filter((utility) => utility.enabled).length}` };
  if (readingsLeft) return { title: "Ближайший срок", body: `Показания — до 20 ${monthName}`, foot: `Осталось ${readingsLeft} из ${selectedMeterIds.length}` };
  return { title: "На этот месяц всё готово ✨", body: "Можно спокойно выдохнуть", foot: "Все обязательства закрыты" };
}

export function evaluateReminder(state: AppState, now = new Date()): AppNotice | null {
  const day = now.getDate();
  const monthKey = getLocalMonthKey(now);
  const dateKey = getLocalDateKey(now);
  const ledger = state.ledgers[monthKey] ?? makeLedger(monthKey);
  const paymentsLeft = state.utilities.filter((utility) => utility.enabled && !ledger.payments[utility.id]).length;
  const selectedMeterIds = getSelectedMeterIds(state, monthKey);
  const readingsLeft = selectedMeterIds.filter((id) => !ledger.readings[id]).length;
  let notice: AppNotice | null = null;
  if (paymentsLeft && day >= 16) notice = { id: `${dateKey}:payment-overdue`, severity: "danger", title: "Срок оплаты прошёл", body: `Не оплачено услуг: ${paymentsLeft}.` };
  else if (paymentsLeft && day === 15) notice = { id: `${dateKey}:payment-due`, severity: "warning", title: "Сегодня последний день оплаты", body: `Осталось оплатить ${paymentsLeft} услуг.` };
  else if (paymentsLeft && day === 14) notice = { id: `${dateKey}:payment-day-before`, severity: "warning", title: "Завтра срок оплаты", body: `Осталось оплатить ${paymentsLeft} услуг.` };
  else if (paymentsLeft && day === 10) notice = { id: `${dateKey}:payment-gentle`, severity: "info", title: "Проверим платежи?", body: `До 15 числа осталось оплатить ${paymentsLeft} услуг.` };
  else if (readingsLeft && day >= 21) notice = { id: `${dateKey}:readings-overdue`, severity: "danger", title: "Показания просрочены", body: `Не внесено показаний: ${readingsLeft}.` };
  else if (readingsLeft && day === 20) notice = { id: `${dateKey}:readings-due`, severity: "warning", title: "Сегодня последний день передачи показаний", body: `Осталось внести ${readingsLeft}.` };
  else if (readingsLeft && day === 19) notice = { id: `${dateKey}:readings-day-before`, severity: "warning", title: "Завтра срок передачи показаний", body: `Осталось внести ${readingsLeft}.` };
  else if (readingsLeft && day === 17) notice = { id: `${dateKey}:readings-gentle`, severity: "info", title: "Пора передать показания", body: `До 20 числа осталось внести ${readingsLeft}.` };
  return notice && !state.notificationLog[notice.id] ? notice : null;
}

export const getRank = (points: number) => points >= 1200 ? "Кристальная орбита" : points >= 700 ? "Сияющая луна" : points >= 350 ? "Полумесяц" : points >= 120 ? "Серп" : "Новолуние";
export const utilityById = (state: AppState, id: UtilityId) => state.utilities.find((utility) => utility.id === id)!;
export const badgeById = (id: CharacterId | null) => BADGES.find((badge) => badge.id === id) ?? null;
