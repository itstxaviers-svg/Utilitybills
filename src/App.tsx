import {
  Archive,
  Bell,
  BellRing,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Droplets,
  Flame,
  Gem,
  ImagePlus,
  Lock,
  MoonStar,
  Pencil,
  Recycle,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
  Upload,
  WalletCards,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { AVATARS, BADGES, ENCOURAGEMENTS, MOODS, MOOD_SYMBOLS } from "./config";
import {
  STORAGE_KEY,
  V1_STORAGE_KEY,
  badgeById,
  buildAnnualSummary,
  claimReward,
  dailyCompletionCount,
  dateKeyToDate,
  evaluateReminder,
  formatDate,
  formatKopecks,
  formatMonth,
  getDeadline,
  getLocalDateKey,
  getLocalMonthKey,
  getRank,
  isMonthFinished,
  lifetimePoints,
  loadState,
  makeJournal,
  makeLedger,
  monthKeyToDate,
  monthTotal,
  nextDeadlineText,
  parseRublesToKopecks,
  pendingCelebrationMonth,
  pendingRewardMonth,
  pointsForMonth,
  reconcileState,
  saveState,
} from "./lib";
import type { AppNotice, AppState, CharacterId, UtilityId, UtilityTemplate } from "./types";

type Panel = "profile" | "archive" | "collection" | null;

const iconMap = {
  droplets: Droplets,
  flame: Flame,
  wrench: Wrench,
  building: Building2,
  zap: Zap,
  recycle: Recycle,
};

function UtilityIcon({ utility, size = 20 }: { utility: UtilityTemplate; size?: number }) {
  const Icon = iconMap[utility.icon];
  return <span className={`utility-icon tone-${utility.tone}`}><Icon size={size} strokeWidth={1.9} /></span>;
}

function Modal({ title, children, onClose, className = "" }: { title: string; children: ReactNode; onClose: () => void; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab" && ref.current) {
        const nodes = [...ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])')];
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    window.setTimeout(() => ref.current?.querySelector<HTMLElement>("[autofocus], button, input, textarea")?.focus(), 0);
    return () => { document.removeEventListener("keydown", onKey); previous?.focus(); };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={ref} className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-header"><div><span className="eyebrow">Focus Tool</span><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Закрыть"><X /></button></header>
        {children}
      </section>
    </div>
  );
}

function ArtImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className={`art-fallback ${className}`} role="img" aria-label={alt}><MoonStar /></span>;
  return <img className={className} src={src} alt={alt} onError={() => { console.warn(`Не найдено изображение: ${src}`); setFailed(true); }} />;
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 1000);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => { window.clearInterval(id); window.removeEventListener("focus", tick); document.removeEventListener("visibilitychange", tick); };
  }, []);
  return now;
}

function AvatarDisplay({ state, size = "normal" }: { state: AppState; size?: "normal" | "large" }) {
  const preset = AVATARS.find((item) => item.id === state.profile.selectedAvatarId) ?? AVATARS[0];
  const src = state.profile.avatarMode === "uploaded" && state.profile.uploadedAvatarDataUrl ? state.profile.uploadedAvatarDataUrl : preset.src;
  return <ArtImage className={`avatar avatar-${size}`} src={src} alt="Аватар профиля" />;
}

function resizePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!(["image/jpeg", "image/png", "image/webp"].includes(file.type)) || file.size > 12 * 1024 * 1024) return reject(new Error("Выберите JPG, PNG или WebP до 12 МБ."));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не удалось прочитать изображение."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Файл изображения повреждён."));
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 256; canvas.height = 256;
        const context = canvas.getContext("2d");
        if (!context) return reject(new Error("Не удалось обработать изображение."));
        const side = Math.min(image.width, image.height);
        context.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, 256, 256);
        resolve(canvas.toDataURL("image/webp", 0.82));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const now = useClock();
  const [state, setState] = useState<AppState>(() => loadState());
  const [panel, setPanel] = useState<Panel>(null);
  const [paymentTarget, setPaymentTarget] = useState<UtilityId | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [amountError, setAmountError] = useState("");
  const [selectedDay, setSelectedDay] = useState(() => getLocalDateKey());
  const [calendarMonth, setCalendarMonth] = useState(() => state.ui.selectedCalendarMonth ?? getLocalMonthKey());
  const [notice, setNotice] = useState<AppNotice | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [savedThought, setSavedThought] = useState(false);
  const [rewardMonth, setRewardMonth] = useState<string | null>(() => pendingRewardMonth(state));
  const [perfectMonth, setPerfectMonth] = useState<string | null>(() => pendingCelebrationMonth(state));
  const [reminderPulse, setReminderPulse] = useState(0);

  const monthKey = getLocalMonthKey(now);
  const dateKey = getLocalDateKey(now);
  const ledger = state.ledgers[monthKey] ?? makeLedger(monthKey);
  const journal = state.journals[dateKey] ?? makeJournal(dateKey);
  const totalPoints = lifetimePoints(state);
  const currentMonthPoints = pointsForMonth(state, monthKey);
  const paidCount = state.utilities.filter((utility) => utility.enabled && ledger.payments[utility.id]).length;
  const readingUtilities = state.utilities.filter((utility) => utility.enabled && utility.requiresMeterReading);
  const readingsCount = readingUtilities.filter((utility) => ledger.readings[utility.id]).length;
  const monthPaidTotal = monthTotal(state, monthKey);
  const activeBadge = badgeById(state.badgeCollection.activeBadgeId);
  const deadline = nextDeadlineText(state, now);
  const januaryAnnualSummary = now.getMonth() === 0 ? state.annualSummaries[String(now.getFullYear() - 1)] : null;

  useEffect(() => {
    const reconciled = reconcileState(state, now);
    if (!state.ledgers[monthKey] || JSON.stringify(reconciled.annualSummaries) !== JSON.stringify(state.annualSummaries)) setState(reconciled);
  }, [monthKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!saveState(state)) setToast("Не удалось сохранить данные: хранилище браузера переполнено.");
    }, 80);
    return () => window.clearTimeout(id);
  }, [state]);

  useEffect(() => {
    const id = window.setInterval(() => setReminderPulse((value) => value + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const reminder = evaluateReminder(state, now);
    if (!reminder) return;
    setNotice(reminder);
    setState((current) => ({ ...current, notificationLog: { ...current.notificationLog, [reminder.id]: true } }));
    if (state.profile.notificationPreference === "enabled" && "Notification" in window && Notification.permission === "granted") new Notification(reminder.title, { body: reminder.body });
  }, [now.getDate(), now.getHours(), state.completionEvents.length, reminderPulse]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (!rewardMonth) setRewardMonth(pendingRewardMonth(state)); if (!perfectMonth) setPerfectMonth(pendingCelebrationMonth(state)); }, [state]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!toast) return; const id = window.setTimeout(() => setToast(null), 4800); return () => window.clearTimeout(id); }, [toast]);

  const update = (recipe: (draft: AppState) => void) => setState((current) => { const draft = structuredClone(current); recipe(draft); return reconcileState(draft, now); });

  const addEventAndMilestone = (draft: AppState, eventId: string, utilityId: UtilityId, type: "payment" | "reading") => {
    draft.completionEvents = draft.completionEvents.filter((event) => event.id !== eventId);
    draft.completionEvents.push({ id: eventId, utilityId, type, happenedAt: now.getTime(), dateKey, monthKey });
    const dayJournal = draft.journals[dateKey] ?? makeJournal(dateKey);
    draft.journals[dateKey] = dayJournal;
    const count = dailyCompletionCount(draft, dateKey);
    if (count >= 3 && !dayJournal.threeTaskMilestoneShown) {
      const candidates = ENCOURAGEMENTS.map((_, index) => index).filter((index) => index !== draft.ui.lastEncouragementIndex);
      const index = candidates[Math.floor(Math.random() * candidates.length)];
      dayJournal.threeTaskMilestoneShown = true;
      dayJournal.threeTaskBonusGranted = true;
      draft.ui.lastEncouragementIndex = index;
      window.setTimeout(() => setToast(ENCOURAGEMENTS[index]), 50);
    }
  };

  const openPayment = (utilityId: UtilityId) => {
    const payment = ledger.payments[utilityId];
    setPaymentTarget(utilityId);
    setAmountInput(payment ? String((payment.amountKopecks / 100).toFixed(2)).replace(".", ",") : "");
    setAmountError("");
  };

  const savePayment = () => {
    if (!paymentTarget) return;
    const amountKopecks = parseRublesToKopecks(amountInput);
    if (!amountKopecks) return setAmountError("Введите сумму больше 0 ₽.");
    update((draft) => {
      const targetLedger = draft.ledgers[monthKey] ?? (draft.ledgers[monthKey] = makeLedger(monthKey));
      const existing = targetLedger.payments[paymentTarget];
      const paidAt = existing?.paidAt ?? now.getTime();
      targetLedger.payments[paymentTarget] = { utilityId: paymentTarget, amountKopecks, paidAt, deadlineAt: getDeadline(monthKey, 15), onTime: paidAt <= getDeadline(monthKey, 15), updatedAt: now.getTime() };
      if (!existing) addEventAndMilestone(draft, `payment:${monthKey}:${paymentTarget}`, paymentTarget, "payment");
    });
    setPaymentTarget(null);
    setToast("Оплата сохранена ✨");
  };

  const removePayment = () => {
    if (!paymentTarget) return;
    update((draft) => {
      delete draft.ledgers[monthKey].payments[paymentTarget];
      draft.completionEvents = draft.completionEvents.filter((event) => event.id !== `payment:${monthKey}:${paymentTarget}`);
    });
    setPaymentTarget(null);
    setToast("Оплата отменена");
  };

  const toggleReading = (utilityId: UtilityId) => {
    const existing = ledger.readings[utilityId];
    if (existing && !window.confirm("Отменить отметку о передаче показаний?")) return;
    update((draft) => {
      const targetLedger = draft.ledgers[monthKey] ?? (draft.ledgers[monthKey] = makeLedger(monthKey));
      if (existing) {
        delete targetLedger.readings[utilityId];
        draft.completionEvents = draft.completionEvents.filter((event) => event.id !== `reading:${monthKey}:${utilityId}`);
      } else {
        targetLedger.readings[utilityId] = { utilityId, submittedAt: now.getTime(), deadlineAt: getDeadline(monthKey, 20), onTime: now.getTime() <= getDeadline(monthKey, 20), updatedAt: now.getTime() };
        addEventAndMilestone(draft, `reading:${monthKey}:${utilityId}`, utilityId, "reading");
      }
    });
    setToast(existing ? "Отметка отменена" : "Показания отмечены ✨");
  };

  const chooseAvatar = (id: CharacterId) => update((draft) => { draft.profile.selectedAvatarId = id; draft.profile.avatarMode = "preset"; });
  const uploadPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const data = await resizePhoto(file);
      setPhotoError("");
      update((draft) => { draft.profile.uploadedAvatarDataUrl = data; draft.profile.avatarMode = "uploaded"; });
    } catch (error) { setPhotoError(error instanceof Error ? error.message : "Не удалось загрузить фото."); }
    event.target.value = "";
  };

  const enableNotifications = async () => {
    if (!("Notification" in window)) { setToast("Системные уведомления не поддерживаются этим браузером. Напоминания внутри приложения продолжат работать."); return; }
    const permission = await Notification.requestPermission();
    update((draft) => { draft.profile.notificationPreference = permission === "granted" ? "enabled" : "disabled"; });
    setToast(permission === "granted" ? "Системные уведомления включены" : "Разрешение не выдано. Напоминания внутри приложения останутся активны.");
  };

  const calendarDate = monthKeyToDate(calendarMonth);
  const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
  const leading = (new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay() + 6) % 7;
  const calendarCells = [...Array(leading).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  const selectedEvents = state.completionEvents.filter((event) => event.dateKey === selectedDay);
  const selectedEventRows = selectedEvents.map((event) => {
    const eventLedger = state.ledgers[event.monthKey];
    const utility = state.utilities.find((item) => item.id === event.utilityId)!;
    const payment = event.type === "payment" ? eventLedger?.payments[event.utilityId] : null;
    return { ...event, utility, payment };
  });
  const dateFormatter = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeFormatter = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const compactDateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" });

  return (
    <div className={`app ${state.profile.reducedEffects ? "effects-reduced" : ""}`}>
      <div className="ambient ambient-one" /><div className="ambient ambient-two" /><div className="star-field" aria-hidden="true">✦　·　✧　　✦　·　　✧</div>
      <header className="topbar">
        <div className="brand"><span className="brand-moon"><MoonStar /></span><div><strong>Focus Tool</strong><span>домашняя орбита порядка</span></div></div>
        <div className="top-date"><span>{dateFormatter.format(now)}</span><strong>{timeFormatter.format(now)}</strong></div>
        <div className="mobile-time"><span>{compactDateFormatter.format(now)}</span><strong>{timeFormatter.format(now)}</strong></div>
        <div className="top-actions">
          <button className="points-chip" onClick={() => setPanel("archive")} aria-label={`Очки: ${totalPoints}`}><Gem size={18} /><strong>{totalPoints}</strong><span>{getRank(totalPoints)}</span></button>
          <button className="icon-button notification-button" onClick={enableNotifications} aria-label="Настроить уведомления">{state.profile.notificationPreference === "enabled" ? <BellRing /> : <Bell />}{notice && <i />}</button>
          {activeBadge && <button className="badge-button" onClick={() => setPanel("collection")} aria-label={`Активная награда: ${activeBadge.name}`}><ArtImage src={activeBadge.src} alt={activeBadge.name} /></button>}
          <button className="avatar-button" onClick={() => setPanel("profile")} aria-label="Открыть профиль"><AvatarDisplay state={state} /></button>
        </div>
      </header>

      <main className="dashboard">
        <section className="left-column">
          <article className="card deadline-card mobile-first">
            <div className="deadline-orb"><MoonStar /></div><div><span className="eyebrow">Сегодня</span><h2>{deadline.title}</h2><p>{deadline.body}</p><small>{deadline.foot}</small></div>
          </article>

          <article className="card payment-card">
            <div className="section-heading"><div><span className="eyebrow">Главное на месяц</span><h1>К оплате <Sparkles size={20} /></h1><p>Оплатите все услуги до 15 числа</p></div><div className="progress-orb"><strong>{paidCount}</strong><span>/ 7</span></div></div>
            <div className="utility-list">
              {state.utilities.filter((utility) => utility.enabled).map((utility) => {
                const payment = ledger.payments[utility.id];
                const overdue = !payment && now.getTime() > getDeadline(monthKey, 15);
                return (
                  <div className={`utility-row ${payment ? "is-done" : ""}`} key={utility.id} data-testid={`payment-${utility.id}`}>
                    <UtilityIcon utility={utility} />
                    <div className="utility-copy"><strong>{utility.name}</strong><span className={payment ? (payment.onTime ? "status success" : "status late") : overdue ? "status overdue" : "status pending"}>{payment ? (payment.onTime ? "Оплачено вовремя" : "Оплачено с опозданием") : overdue ? "Просрочено" : "Не оплачено"}</span>{payment && <small>{formatKopecks(payment.amountKopecks)} · {formatDate(payment.paidAt)}</small>}</div>
                    <span className="deadline-chip">до 15</span>
                    <button className={payment ? "row-action done" : "row-action"} onClick={() => openPayment(utility.id)}>{payment ? <><Pencil size={15} /> Изменить</> : <><CircleDollarSign size={17} /> Оплатить</>}</button>
                  </div>
                );
              })}
            </div>
            {paidCount === 7 && <div className="earned-teaser"><Sparkles /> Все платежи месяца закрыты. Награда заработана и откроется после завершения месяца.</div>}
          </article>

          <article className="card readings-card">
            <div className="section-heading compact"><div><span className="eyebrow">До 20 числа</span><h2>Показания</h2><p>Отметьте факт передачи показаний</p></div><div className="mini-progress"><strong>{readingsCount}</strong> / {readingUtilities.length}</div></div>
            <div className="readings-grid">
              {readingUtilities.map((utility) => {
                const reading = ledger.readings[utility.id];
                const overdue = !reading && now.getTime() > getDeadline(monthKey, 20);
                return <button key={utility.id} className={`reading-item ${reading ? "is-done" : ""}`} onClick={() => toggleReading(utility.id)}><UtilityIcon utility={utility} size={18} /><span><strong>{utility.name}</strong><small>{reading ? (reading.onTime ? "Внесены вовремя" : "Внесены с опозданием") : overdue ? "Просрочено" : "Не внесены"}</small></span><i>{reading ? <Check /> : "+"}</i></button>;
              })}
            </div>
          </article>
        </section>

        <section className="center-column">
          <article className="card live-clock-card">
            <div className="clock-title"><span>✦</span><div><span className="eyebrow">Сейчас</span><h2>Focus Tool</h2></div><span>✦</span></div>
            <div className="clock-orbit" aria-label={`Текущее время ${timeFormatter.format(now)}`}>
              <span className="orbit-star orbit-star-one">✦</span><span className="orbit-star orbit-star-two">·</span><span className="orbit-moon">☾</span>
              <div className="clock-inner"><small>{new Intl.DateTimeFormat("ru-RU", { weekday: "long" }).format(now)}</small><strong>{timeFormatter.format(now)}</strong><span>{compactDateFormatter.format(now)}</span></div>
              <Gem className="clock-gem" />
            </div>
            <div className="clock-note"><MoonStar /><span><strong>{deadline.body}</strong><small>{deadline.foot}</small></span></div>
          </article>

          <article className="card month-summary-card">
            <div className="section-heading compact"><div><span className="eyebrow">Итоги месяца</span><h2>{formatMonth(monthKey)}</h2></div><Star className="gold-star" /></div>
            <div className="summary-total"><span>Оплачено</span><strong>{formatKopecks(monthPaidTotal)}</strong></div>
            <div className="summary-stats"><div><WalletCards /><span><strong>{paidCount} / 7</strong> услуг</span></div><div><CalendarDays /><span><strong>{readingsCount} / {readingUtilities.length}</strong> показаний</span></div><div><Gem /><span><strong>{currentMonthPoints}</strong> очков</span></div></div>
            <div className="reward-progress"><div><span>Лунный путь месяца</span><strong>{Math.round(((paidCount + readingsCount) / 11) * 100)}%</strong></div><span><i style={{ width: `${((paidCount + readingsCount) / 11) * 100}%` }} /></span></div>
            {januaryAnnualSummary && <div className="january-summary"><span>Итоги {now.getFullYear() - 1} года</span><strong>{formatKopecks(januaryAnnualSummary.totalPaidKopecks)}</strong><small>{januaryAnnualSummary.perfectMonths} идеальных месяцев · {januaryAnnualSummary.totalPoints} очков</small></div>}
            <button className="secondary wide" onClick={() => setPanel("archive")}><Archive /> Открыть архив</button>
          </article>
        </section>

        <aside className="right-column">
          <article className="card profile-mini-card">
            <div className="profile-mini-head"><AvatarDisplay state={state} size="large" /><div><span className="eyebrow">Личный день</span><h2>{state.profile.name ? `Добрый день, ${state.profile.name}!` : "Добрый день!"}</h2><button className="text-button" onClick={() => setPanel("profile")}>Изменить профиль <ChevronRight /></button></div></div>
            <div className="mood-preview"><span>Как я сегодня?</span><strong>{journal.mood ?? "Пока не отмечено"}</strong></div>
            <div className="thought-preview"><Sparkles /><p>{journal.thought || "Запишите одну мысль о сегодняшнем дне…"}</p></div>
          </article>

          <article className="card calendar-card">
            <div className="calendar-header"><button className="icon-button" aria-label="Предыдущий месяц" onClick={() => { const d = monthKeyToDate(calendarMonth); setCalendarMonth(getLocalMonthKey(new Date(d.getFullYear(), d.getMonth() - 1, 1))); }}><ChevronLeft /></button><div><span className="eyebrow">Календарь</span><h2>{formatMonth(calendarMonth)}</h2></div><button className="icon-button" aria-label="Следующий месяц" onClick={() => { const d = monthKeyToDate(calendarMonth); setCalendarMonth(getLocalMonthKey(new Date(d.getFullYear(), d.getMonth() + 1, 1))); }}><ChevronRight /></button></div>
            {calendarMonth !== monthKey && <button className="today-link" onClick={() => { setCalendarMonth(monthKey); setSelectedDay(dateKey); }}>Сегодня</button>}
            <div className="weekdays">{["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => <span key={day}>{day}</span>)}</div>
            <div className="calendar-grid">
              {calendarCells.map((day, index) => {
                if (!day) return <span key={`blank-${index}`} />;
                const cellDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
                const cellKey = getLocalDateKey(cellDate);
                const events = state.completionEvents.filter((event) => event.dateKey === cellKey);
                return <button key={cellKey} aria-label={`${day} ${formatMonth(calendarMonth)}`} className={`${cellKey === dateKey ? "today" : ""} ${cellKey === selectedDay ? "selected" : ""}`} onClick={() => setSelectedDay(cellKey)}><span>{day}</span><i>{day === 15 && <b className="deadline-dot payment" />}{day === 20 && <b className="deadline-dot reading" />}{events.some((event) => event.type === "payment") && <b className="event-dot payment" />}{events.some((event) => event.type === "reading") && <b className="event-dot reading" />}</i></button>;
              })}
            </div>
            <div className="calendar-legend"><span><i className="deadline-dot payment" /> срок оплаты</span><span><i className="deadline-dot reading" /> срок показаний</span></div>
            <div className="day-details"><strong>{new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(dateKeyToDate(selectedDay))}</strong>{selectedEventRows.length ? selectedEventRows.map((event) => <div key={event.id}><Check /> <span>{event.utility.name}{event.payment ? ` — ${formatKopecks(event.payment.amountKopecks)}` : " — показания внесены"}</span></div>) : <p>Действий в этот день пока нет.</p>}</div>
          </article>
        </aside>
      </main>

      {paymentTarget && (() => {
        const utility = state.utilities.find((item) => item.id === paymentTarget)!;
        const existing = ledger.payments[paymentTarget];
        return <Modal title="Сколько оплатили?" onClose={() => setPaymentTarget(null)} className="amount-modal"><div className="payment-dialog-service"><UtilityIcon utility={utility} size={24} /><div><strong>{utility.name}</strong><span>Срок оплаты — до 15 числа</span></div></div><label className="field"><span>Сумма платежа</span><div className="currency-input"><input autoFocus inputMode="decimal" value={amountInput} onChange={(event) => { setAmountInput(event.target.value); setAmountError(""); }} onKeyDown={(event) => event.key === "Enter" && savePayment()} placeholder="0,00" aria-describedby="amount-error" /><span>₽</span></div>{amountError && <small className="field-error" id="amount-error">{amountError}</small>}</label><div className="modal-actions">{existing && <button className="danger-subtle" onClick={() => window.confirm("Отменить эту оплату? Сумма и отметка будут удалены.") && removePayment()}><Trash2 /> Отменить оплату</button>}<button className="primary" onClick={savePayment}><Check /> Сохранить оплату</button></div></Modal>;
      })()}

      {panel === "profile" && <Modal title="Профиль" onClose={() => setPanel(null)} className="large-modal profile-modal">
        <div className="profile-hero"><div className="avatar-stack"><AvatarDisplay state={state} size="large" />{activeBadge && <ArtImage className="profile-active-badge" src={activeBadge.src} alt={activeBadge.name} />}</div><div><span className="eyebrow">Ваша домашняя орбита</span><h3>{state.profile.name || "Добавьте своё имя"}</h3><p>Данные хранятся только в этом браузере на этом устройстве.</p></div></div>
        <label className="field"><span>Имя</span><input value={state.profile.name} maxLength={60} onChange={(event) => update((draft) => { draft.profile.name = event.target.value; })} placeholder="Как к вам обращаться?" /></label>
        <section className="profile-section"><div className="subheading"><div><h3>Аватар</h3><p>Все 12 образов доступны сразу</p></div><label className="upload-button"><Upload /> {state.profile.avatarMode === "uploaded" ? "Изменить фото" : "Загрузить своё фото"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPhoto} /></label></div>{photoError && <p className="field-error">{photoError}</p>}<div className="avatar-grid">{AVATARS.map((avatar) => <button key={avatar.id} onClick={() => chooseAvatar(avatar.id)} className={state.profile.avatarMode === "preset" && state.profile.selectedAvatarId === avatar.id ? "selected" : ""}><ArtImage src={avatar.src} alt={avatar.name} /><span>{avatar.name}</span>{state.profile.avatarMode === "preset" && state.profile.selectedAvatarId === avatar.id && <i><Check /></i>}</button>)}</div>{state.profile.avatarMode === "uploaded" && <button className="text-button danger-text" onClick={() => update((draft) => { draft.profile.uploadedAvatarDataUrl = null; draft.profile.avatarMode = "preset"; })}><Trash2 /> Удалить фото</button>}</section>
        <section className="profile-section"><h3>Как я сегодня?</h3><div className="mood-grid">{MOODS.map((mood, index) => <button key={mood} className={journal.mood === mood ? "selected" : ""} onClick={() => update((draft) => { const item = draft.journals[dateKey] ?? makeJournal(dateKey); item.mood = mood; draft.journals[dateKey] = item; })}><strong>{MOOD_SYMBOLS[index]}</strong><span>{mood}</span></button>)}</div></section>
        <label className="field thought-field"><span>О чём я сегодня думаю</span><textarea maxLength={280} value={journal.thought} onChange={(event) => { const value = event.target.value; setSavedThought(false); update((draft) => { const item = draft.journals[dateKey] ?? makeJournal(dateKey); item.thought = value; draft.journals[dateKey] = item; }); window.setTimeout(() => setSavedThought(true), 450); }} placeholder="Например, о спокойном вечере…" /><small>{savedThought ? "Сохранено" : `${journal.thought.length} / 280`}</small></label>
        <section className="settings-list"><button onClick={enableNotifications}><Bell /> <span><strong>Системные уведомления</strong><small>{state.profile.notificationPreference === "enabled" ? "Включены" : "Только после вашего разрешения"}</small></span><ChevronRight /></button><label><Sparkles /><span><strong>Уменьшить декоративные эффекты</strong><small>Отключить движение орбит и мерцание</small></span><input type="checkbox" checked={state.profile.reducedEffects} onChange={(event) => update((draft) => { draft.profile.reducedEffects = event.target.checked; })} /></label><button onClick={() => setPanel("collection")}><Gem /><span><strong>Коллекция наград</strong><small>Собрано {state.badgeCollection.unlocked.length} из 12</small></span><ChevronRight /></button></section>
        <div className="profile-footer"><p>Системные уведомления зависят от браузера. Для гарантированных напоминаний при полностью закрытом приложении в будущем понадобятся Web Push и сервер расписаний.</p><button className="danger-subtle" onClick={() => setResetConfirm(true)}><RotateCcw /> Сбросить демо</button></div>
      </Modal>}

      {panel === "collection" && <Modal title="Коллекция наград" onClose={() => setPanel(null)} className="large-modal collection-modal"><div className="collection-top"><div><span>Собрано</span><strong>{state.badgeCollection.unlocked.length} / 12</strong></div><p>{state.badgeCollection.unlocked.length === 12 ? "Полная коллекция ✨" : "Закрывайте все семь платежей месяца, чтобы открывать новые значки."}</p></div><div className="constellation-progress"><i style={{ width: `${(state.badgeCollection.unlocked.length / 12) * 100}%` }} /></div><div className="badge-grid">{BADGES.map((badge) => { const unlock = state.badgeCollection.unlocked.find((item) => item.badgeId === badge.id); const active = state.badgeCollection.activeBadgeId === badge.id; return <button key={badge.id} disabled={!unlock} className={`${unlock ? "unlocked" : "locked"} ${active ? "active" : ""}`} onClick={() => unlock && update((draft) => { draft.badgeCollection.activeBadgeId = badge.id; })}>{unlock ? <ArtImage src={badge.src} alt={badge.name} /> : <span className="locked-art"><Lock /></span>}<strong>{badge.name}</strong><small>{unlock ? `${formatMonth(unlock.earnedForMonthKey)}${active ? " · Активная" : ""}` : "Пока закрыта"}</small></button>; })}</div></Modal>}

      {panel === "archive" && <Modal title="Архив" onClose={() => setPanel(null)} className="large-modal archive-modal"><ArchiveContent state={state} currentYear={now.getFullYear()} /></Modal>}

      {resetConfirm && <Modal title="Сбросить демо?" onClose={() => setResetConfirm(false)} className="confirm-modal"><p>Все сохранённые оплаты, показания, профиль, очки и архив на этом устройстве будут удалены.</p><div className="modal-actions"><button className="secondary" onClick={() => setResetConfirm(false)}>Отмена</button><button className="danger-solid" onClick={() => { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(V1_STORAGE_KEY); const fresh = loadState(); setState(fresh); setPanel(null); setResetConfirm(false); setToast("Демо-данные сброшены"); }}>Да, сбросить</button></div></Modal>}

      {rewardMonth && <Modal title="Новая награда!" onClose={() => setRewardMonth(null)} className="reward-modal"><div className="reward-reveal"><div className="reward-mystery"><Gem /></div><h3>Все платежи за {formatMonth(rewardMonth)} закрыты</h3><p>В лунной коллекции появился новый знак.</p></div><div className="modal-actions"><button className="primary" onClick={() => { const next = claimReward(state, rewardMonth); const newBadge = next.badgeCollection.unlocked.find((item) => item.earnedForMonthKey === rewardMonth); setState(next); setRewardMonth(null); setPanel("collection"); setToast(newBadge ? `Открыта награда «${badgeById(newBadge.badgeId)?.name}» ✨` : "Месячная награда добавлена"); }}><Sparkles /> Добавить в коллекцию</button></div></Modal>}

      {perfectMonth && <div className="celebration" role="dialog" aria-modal="true" aria-label="Идеальный месяц"><div className="confetti" aria-hidden="true">✦　·　✧　✦　·　✧　✦　·　✧</div><div className="celebration-panel"><span className="celebration-moon"><MoonStar /></span><span className="eyebrow">Идеальный месяц</span><h2>Орбита в полном порядке!</h2><p>Все оплачено вовремя. Показания внесены вовремя.</p><strong>{formatKopecks(monthTotal(state, perfectMonth))}</strong><button className="primary" onClick={() => { update((draft) => { draft.ledgers[perfectMonth].celebrationShown = true; draft.ledgers[perfectMonth].perfectMonthRewardGranted = true; }); setPerfectMonth(null); }}>Сохранить это сияние</button></div></div>}

      {notice && <div className={`toast notice ${notice.severity}`} role="status"><BellRing /><div><strong>{notice.title}</strong><span>{notice.body}</span></div><button onClick={() => setNotice(null)} aria-label="Закрыть напоминание"><X /></button></div>}
      {toast && <div className="toast success" role="status"><Sparkles /><span>{toast}</span><button onClick={() => setToast(null)} aria-label="Закрыть сообщение"><X /></button></div>}
    </div>
  );
}

function ArchiveContent({ state, currentYear }: { state: AppState; currentYear: number }) {
  const years = [...new Set(Object.keys(state.ledgers).map((key) => Number(key.slice(0, 4))))].sort((a, b) => b - a);
  const currentSummary = buildAnnualSummary(state, currentYear);
  return <div className="archive-content"><div className="archive-year-total"><span>За {currentYear} год</span><strong>{formatKopecks(currentSummary.totalPaidKopecks)}</strong><small>Очков: {currentSummary.totalPoints} · вовремя: {currentSummary.onTimePayments}</small></div>{years.map((year) => { const annual = year < currentYear ? (state.annualSummaries[String(year)] ?? buildAnnualSummary(state, year)) : null; const keys = Object.keys(state.ledgers).filter((key) => key.startsWith(`${year}-`)).sort().reverse(); return <section className="archive-year" key={year}><h3>{year}</h3>{annual && <article className="annual-summary"><div><span className="eyebrow">Годовой итог</span><strong>{formatKopecks(annual.totalPaidKopecks)}</strong></div><div><span>Среднее за месяц</span><strong>{formatKopecks(annual.averageMonthlyKopecks)}</strong></div><div><span>Идеальных месяцев</span><strong>{annual.perfectMonths}</strong></div></article>}{keys.map((key) => { const ledger = state.ledgers[key]; const payments = Object.values(ledger.payments).filter(Boolean); return <details key={key}><summary><span><strong>{formatMonth(key)}</strong><small>{payments.length} из 7 услуг · {pointsForMonth(state, key)} очков</small></span><strong>{formatKopecks(monthTotal(state, key))}</strong></summary><div className="archive-details">{state.utilities.map((utility) => { const payment = ledger.payments[utility.id]; const reading = ledger.readings[utility.id]; return <div key={utility.id}><span>{utility.name}</span><span>{payment ? `${formatKopecks(payment.amountKopecks)} · ${payment.onTime ? "вовремя" : "с опозданием"}` : "Не оплачено"}{utility.requiresMeterReading && ` · показания ${reading ? (reading.onTime ? "вовремя" : "с опозданием") : "не внесены"}`}</span></div>; })}</div></details>; })}</section>; })}</div>;
}
