export type UtilityId =
  | "hot-water"
  | "cold-water"
  | "gas"
  | "capital-repair"
  | "housing-services"
  | "electricity"
  | "internet"
  | "waste";

export type MeterUtilityId = "hot-water" | "cold-water" | "gas" | "electricity";

export type CharacterId =
  | "sailor-moon"
  | "sailor-mercury"
  | "sailor-mars"
  | "sailor-venus"
  | "sailor-jupiter"
  | "sailor-saturn"
  | "sailor-uranus"
  | "sailor-neptune"
  | "sailor-pluto"
  | "sailor-chibi-moon"
  | "tuxedo-mask"
  | "luna-artemis";

export type UtilityTemplate = {
  id: UtilityId;
  name: string;
  shortName?: string;
  icon: "droplets" | "flame" | "wrench" | "building" | "zap" | "wifi" | "recycle";
  tone: string;
  requiresMeterReading: boolean;
  enabled: boolean;
};

export type PaymentRecord = {
  utilityId: UtilityId;
  amountKopecks: number;
  paidAt: number;
  deadlineAt: number;
  onTime: boolean;
  updatedAt: number;
};

export type ReadingRecord = {
  utilityId: UtilityId;
  submittedAt: number;
  deadlineAt: number;
  onTime: boolean;
  updatedAt: number;
};

export type MonthLedger = {
  monthKey: string;
  requiredReadingIds: MeterUtilityId[];
  payments: Partial<Record<UtilityId, PaymentRecord>>;
  readings: Partial<Record<UtilityId, ReadingRecord>>;
  celebrationShown: boolean;
  perfectMonthRewardGranted: boolean;
  sailorBadgeEligible: boolean;
  sailorBadgeClaimed: boolean;
  sailorBadgeId: CharacterId | null;
};

export type DailyJournal = {
  dateKey: string;
  mood: string | null;
  thought: string;
  threeTaskMilestoneShown: boolean;
  threeTaskBonusGranted: boolean;
};

export type CompletionEvent = {
  id: string;
  type: "payment" | "reading";
  happenedAt: number;
  dateKey: string;
  monthKey: string;
  utilityId: UtilityId;
};

export type BadgeUnlock = {
  badgeId: CharacterId;
  earnedForMonthKey: string;
  unlockedAt: number;
};

export type AnnualSummary = {
  year: number;
  totalPaidKopecks: number;
  averageMonthlyKopecks: number;
  highestCostMonthKey: string | null;
  highestCostMonthKopecks: number;
  onTimePayments: number;
  latePayments: number;
  perfectMonths: number;
  totalPoints: number;
  generatedAt: number;
};

export type AppState = {
  version: 2;
  profile: {
    name: string;
    avatarMode: "preset" | "uploaded";
    selectedAvatarId: CharacterId;
    uploadedAvatarDataUrl: string | null;
    notificationPreference: "unknown" | "enabled" | "disabled";
    soundEnabled: boolean;
    reducedEffects: boolean;
  };
  utilities: UtilityTemplate[];
  meterSettings: {
    configured: boolean;
    selected: Record<MeterUtilityId, boolean>;
  };
  ledgers: Record<string, MonthLedger>;
  journals: Record<string, DailyJournal>;
  completionEvents: CompletionEvent[];
  badgeCollection: {
    unlocked: BadgeUnlock[];
    activeBadgeId: CharacterId | null;
    claimedMonthKeys: string[];
  };
  annualSummaries: Record<string, AnnualSummary>;
  notificationLog: Record<string, boolean>;
  ui: {
    lastEncouragementIndex: number | null;
    selectedCalendarMonth: string | null;
  };
};

export type AppNotice = {
  id: string;
  severity: "info" | "warning" | "danger" | "success";
  title: string;
  body: string;
};
