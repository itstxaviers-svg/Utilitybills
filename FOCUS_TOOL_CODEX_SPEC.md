# Focus Tool — Utility Bills + To‑Pay List + Gamification

> **Implementation brief for Codex.** Build a polished, responsive, local-first web app called **Focus Tool** for managing utility bills, meter-reading deadlines, payment history, a live date/time dashboard, personal daily state, profile/avatar selection, and gentle gamification. **This is a utility-bill control app, not a Pomodoro/focus-timer app.**
>
> **Core constraint:** all user data lives in the browser via `localStorage`. No backend, no auth server, no database, no external analytics.
>
> **Design direction:** premium magical-girl / moon-prism aesthetic inspired by the visual language of Sailor Moon transformation objects and anniversary merchandise — moon and star geometry, crystal highlights, pink/lilac/blue glassy surfaces, restrained gold foil lines, guardian-planet style symbols, pearls/sparkles — **without turning the product into a literal anime fan page**. The app must remain a calm productivity/finance utility first.

---

## 0. Execution rules for Codex

1. **Inspect the existing repository first.** Do not replace the current stack or redesign unrelated files.
2. If the repository is empty, use **Vite + React + TypeScript**.
3. Prefer a small dependency surface. Recommended if not already present:
   - `lucide-react` for clear operational UI icons;
   - `motion` / `framer-motion` only if it materially improves polished transitions;
   - `date-fns` only if date logic becomes noticeably cleaner than native `Date`.
4. Use CSS variables/design tokens instead of hardcoded colors scattered through components.
5. **LANGUAGE IS A HARD REQUIREMENT: the entire user-facing interface must be in Russian.** This includes navigation, buttons, tooltips, placeholders, empty states, statuses, reminders, notifications, calendar labels, month/day names, modal windows, success messages, validation messages, archive/statistics labels, avatar/reward selectors and demo/reset controls. Internal code, types, variables and comments may be English.
6. **Terminology rule:** `ТКО` means **«Твёрдые коммунальные отходы»**. In the main utility list, settings, details and first meaningful mention, show **«Твёрдые коммунальные отходы (ТКО)»**. The short form `ТКО` may be used only where space is limited after the meaning is clear.
7. No fake backend, no mock API, no Firebase/Supabase, no login/auth server, no database, no external analytics.
8. **The user-provided reference image is the visual source of truth.** Before styling the app, locate and inspect the reference image in `assets/` (prefer a filename beginning with `reference`). Reproduce its visual hierarchy, proportions, softness, palette, card geometry, gold accents, crystal/moon language and spacing while keeping the real functionality in this spec.
9. **Do not invent replacement art if a matching file already exists in `assets/`.** Inspect existing filenames first. Use the 12 `avatar-*` files as selectable account images and the 12 `badge-*` files as monthly reward art.
10. **Do not rasterize ordinary UI.** Cards, gradients, borders, gold outlines, buttons, status pills, progress bars, calendar markers, checkboxes, simple stars/sparkles and routine icons should be CSS/SVG/Lucide whenever practical. Raster assets are reserved for the supplied reference-driven character avatars, collectible reward emblems and genuinely unique decorative illustrations.
11. Do not use raster text from images as functional labels. All visible functional text must be real HTML text for accessibility/responsiveness.
12. Keep animations smooth and calm. Never allow decoration to make bill status, deadlines or payment totals harder to read.
13. Support `prefers-reduced-motion` and reduce/disable nonessential sparkles, orbit motion, fireworks and large transforms when requested by the OS/browser.
14. **There is no countdown/focus/Pomodoro timer in this version.** Do not create 15/25/45/60 minute presets, Start/Pause/Reset controls, focus sessions or focus-session points. If the reference contains a large circular timer in the middle, reinterpret that exact visual area as a **live real-world clock showing hours, minutes and seconds**.
15. Before finishing, test the acceptance checklist at the end of this file. Avoid unrelated refactors.

---

# 1. Product concept

Focus Tool is a single-user home utility dashboard with five connected jobs:

1. **To Pay:** see every utility payment due this month, mark it paid, and record the exact amount.
2. **Meter readings:** remember to submit readings before the monthly deadline.
3. **Calendar + live time:** always see the real current date/time, deadlines, today, completed actions and month history.
4. **Profile:** choose one of 12 supplied account avatars or upload a personal photo, set today’s mood and write a short daily thought.
5. **Gentle gamification:** points, 30 encouragement messages, perfect-month celebration and a 12-item Sailor reward collection.

The emotional goal is: **“adult responsibilities, but made beautiful and satisfying.”** It should feel premium, soft, magical and orderly — not childish, noisy or casino-like.

The product must read immediately as a **utility-bill / ЖКХ control app**. The large central visual may resemble the circular magical centerpiece from the reference, but functionally it is a real clock, not a productivity timer.

---

# 2. Required utility list

Create these seven default payment items in this exact semantic set. **All labels below are the canonical Russian UI labels:**

| ID | Russian label | Default icon | Meter readings required by default |
|---|---|---|---|
| `hot-water` | Горячая вода | `Droplets` + warm accent | yes |
| `cold-water` | Холодная вода | `Droplets` + cool accent | yes |
| `gas` | Газ | `Flame` | yes |
| `capital-repair` | Капитальный ремонт | `Wrench` | no |
| `housing-services` | Услуги ЖКХ | `Building2` | no |
| `electricity` | Электричество | `Zap` | yes |
| `waste` | Твёрдые коммунальные отходы (ТКО) | `Recycle` | no |

Do not require the user to recreate these each month. They are recurring monthly templates.

For future flexibility, each utility object must contain `requiresMeterReading: boolean`, even though only four are enabled by default.

---

# 3. Deadlines and monthly recurrence

## Payment deadline

- All seven utility bills are due **by the 15th day of every calendar month**.
- A payment is **on time** if `paidAt` is no later than local time `23:59:59` on the 15th.
- Payment on the 16th or later is marked `late`.

## Meter-reading deadline

- Required readings must be submitted **by the 20th day of every calendar month**.
- A reading submission is **on time** if `submittedAt` is no later than local time `23:59:59` on the 20th.
- Submission on the 21st or later is marked `late`.

## Month rollover

On the first visit in a new month:

1. preserve all past records;
2. create the current month ledger lazily from utility templates;
3. all new monthly payment/readings states start incomplete;
4. never overwrite previous month amounts or completion timestamps.

---

# 4. Main layout and information hierarchy

Use a responsive dashboard, not a long boring form. The supplied reference image is the composition reference; preserve its pleasant three-zone/card rhythm while replacing any countdown-timer semantics with utility-relevant information.

## Desktop / tablet wide layout

Recommended structure:

- **Top bar**
  - Focus Tool logo / moon mark;
  - today’s date;
  - live local time with seconds (compact form is allowed if the large center clock is present);
  - monthly/lifetime points chip;
  - notification button/state;
  - profile avatar + active reward badge.
- **Left / main payments area**
  - `К оплате` / payment list is the most important card;
  - all seven services visible with amount/status/deadline;
  - `Показания` summary nearby.
- **Center visual anchor**
  - large **live clock** in the visual position where the reference shows the circular timer;
  - format `HH:MM:SS`;
  - no countdown, no presets, no Start/Pause/Reset;
  - subtle moon/crystal/orbit animation around it;
  - optional small text beneath: nearest deadline or `На этот месяц всё готово`.
- **Right column**
  - profile/day mood/thought;
  - calendar with the 15th and 20th marked clearly.
- **Bottom summary**
  - current month total;
  - payment/readings progress;
  - points;
  - monthly reward / collection progress;
  - archive shortcut;
  - milestone message area when relevant.

## Mobile layout

The mobile experience is a first-class requirement.

- Single-column vertical scroll.
- Sticky compact top bar containing:
  - current time with seconds;
  - profile/avatar;
  - active reward badge;
  - notification indicator.
- Order:
  1. Today / nearest deadline summary;
  2. To Pay;
  3. Meter readings;
  4. compact live clock card;
  5. calendar;
  6. month total / points / reward progress;
  7. archive.
- Tap targets at least about 44×44 px.
- No horizontal scrolling.
- Payment cards should collapse cleanly; amount/status stays readable.

Suggested breakpoints:

- `< 640px`: mobile;
- `640–1023px`: tablet;
- `>= 1024px`: dashboard grid.

---

# 5. Visual system — Sailor Moon-inspired, but usable

## 5.1 Design references to translate into UI

Use these visual ideas as inspiration:

- crescent moon silhouette;
- faceted crystal / jewel centerpieces;
- circular transformation-compact geometry;
- small stars and orbit dots;
- soft pink, lilac, pearl white and cool blue;
- refined gold linework / foil accents;
- planetary/guardian-symbol feeling for small status marks;
- shimmer and iridescence in **small controlled areas**;
- round medallion-style icon containers;
- elegant ribbon/arc shapes used as separators or progress arcs;
- sparkle particles only on meaningful success moments.

Do **not** make the entire background a loud galaxy. Use large quiet surfaces and concentrated magical accents.

## 5.2 Base palette

Create CSS tokens approximately in this direction, then tune them to the supplied reference image after inspecting it.

```css
:root {
  --bg: #fbf8fc;
  --surface: #fffdfd;
  --surface-glass: rgba(255, 255, 255, 0.74);
  --text: #292747;
  --text-soft: #6f6a87;

  --pink-100: #fde7f1;
  --pink-300: #f5b7d1;
  --pink-500: #e986b5;

  --lilac-100: #eeeafa;
  --lilac-300: #c7c0ef;
  --lilac-500: #9991d9;

  --blue-100: #e6f4fb;
  --blue-300: #addbf0;
  --blue-500: #70b5d9;

  --gold-300: #ead9a5;
  --gold-500: #c9a85d;

  --success: #63ad8c;
  --warning: #c7904c;
  --danger: #bd5f78;

  --shadow-soft: 0 14px 40px rgba(70, 57, 104, 0.10);
  --shadow-hover: 0 18px 52px rgba(70, 57, 104, 0.15);
}
```

Rules:

- Primary text remains dark navy/plum for contrast.
- Gold is an accent for borders, tiny stars, live-clock ring highlights and special states — never long body text.
- Use green only for clearly completed/healthy states, not as a major theme color.
- Overdue red should be muted and elegant but unmistakable.

## 5.3 Typography

Preferred local package option:

- display/headings: `Cormorant Garamond` or a similar elegant high-contrast serif;
- UI/body/numbers: `Manrope`, `Inter`, or system sans.

If adding web fonts would create unnecessary external network dependencies, use a system fallback. Font loading must not block the app.

Example:

```css
--font-display: "Cormorant Garamond", Georgia, serif;
--font-ui: "Manrope", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Use display font only for large titles, month title, celebration headline. Everything operational uses the clean UI font.

## 5.4 Cards / “плашечки”

Cards are a major part of the desired look.

- radius: 20–28 px for primary cards;
- radius: 12–16 px for small chips/buttons;
- soft translucent pearl-white surface;
- 1 px very subtle lilac/pink border;
- small top-edge highlight to mimic polished glass;
- soft shadow, not neon glow;
- inner content aligned to a clean 8 px spacing system.

Small chips should exist for:

- `До 15 числа`;
- `До 20 числа`;
- `Оплачено`;
- `Просрочено`;
- `Показания внесены`;
- amount;
- points gained;
- on-time badge.

## 5.5 Buttons

Buttons need a clear icon + label unless the meaning is universal and tooltip/aria-label is present.

Button categories:

- primary: pink → lilac gentle gradient;
- secondary: white/glass + lilac border;
- success: subtle green surface;
- destructive/reset: neutral surface with muted danger text, not a huge red button.

Hover/press:

- hover lift max 2 px;
- slight specular highlight;
- press scale ~0.98;
- transition 160–240 ms.

## 5.6 Icons

Use `lucide-react` with consistent stroke width around `1.8–2`.

Do not mix random emoji with line icons in core controls. Mood selection may use expressive illustrated mini-icons or emoji only if it matches the reference sheet.

## 5.7 Decorative animation language

Allowed:

- slow floating star at 6–10 s duration;
- subtle gradient movement;
- tiny sparkle burst when a task completes;
- slow circular live-clock orbit / breathing halo motion;
- smooth card expand/collapse;
- number count-up for totals;
- soft “crystal shine” sweep over completed badge, max once;
- month-perfect fireworks/confetti.

Avoid:

- continuous flashing;
- excessive parallax;
- spinning icons everywhere;
- large anime character movement behind financial text;
- constant confetti;
- bouncy spring on every control.

---

# 6. Reference image + existing `assets/` integration

The project will contain a **reference image** plus already-prepared individual assets. **Do not treat the reference as a background image and do not rebuild ordinary UI as raster screenshots.** It is a design reference for composition, spacing, surfaces, palette and atmosphere.

## 6.1 Reference image is the visual source of truth

Before implementing the visual layer:

1. inspect the `assets/` directory;
2. locate the supplied reference image (prefer a filename beginning with `reference`; extension may be `.png`, `.jpg`, `.jpeg` or `.webp`);
3. compare the implementation to the reference for:
   - overall three-column/hero composition;
   - pale pink/lilac/blue glass surfaces;
   - restrained golden linework;
   - soft celestial background;
   - circular central centerpiece;
   - spacing and card proportions;
   - readable dark-violet typography;
   - gentle magical highlights rather than harsh neon;
4. reproduce those traits with CSS/layout first;
5. use actual raster assets only where listed below.

If the reference shows a large `25:00` countdown or Start/Pause controls, **do not reproduce that functionality**. Preserve the visual shape only and replace its content with the current local `HH:MM:SS` clock.

## 6.2 Asset-location rule

The user has already renamed and placed files in the project `assets/` folder. **Inspect actual filenames before coding and do not rename/regenerate them unnecessarily.**

If the current framework requires assets to live under a public/static directory, mirror/copy them while preserving their filenames. Keep one central registry (`src/config/assets.ts`) so components never scatter literal asset paths.

## 6.3 Required account-avatar assets — 12 files

These are **profile/account pictures**, available from the first launch. They are not rewards and are never locked.

Expected logical filenames:

```text
assets/
  avatar-sailor-moon.png
  avatar-sailor-mercury.png
  avatar-sailor-mars.png
  avatar-sailor-venus.png
  avatar-sailor-jupiter.png
  avatar-sailor-saturn.png
  avatar-sailor-uranus.png
  avatar-sailor-neptune.png
  avatar-sailor-pluto.png
  avatar-sailor-chibi-moon.png
  avatar-tuxedo-mask.png
  avatar-luna-artemis.png
```

Use these as the 12 selectable preset account images during the first profile setup and later from `Профиль → Изменить аватар`.

## 6.4 Required monthly reward assets — 12 files

These are **collectible reward emblems/badges**. They are separate from the account avatar artwork and start locked.

```text
assets/
  badge-sailor-moon.png
  badge-sailor-mercury.png
  badge-sailor-mars.png
  badge-sailor-venus.png
  badge-sailor-jupiter.png
  badge-sailor-saturn.png
  badge-sailor-uranus.png
  badge-sailor-neptune.png
  badge-sailor-pluto.png
  badge-sailor-chibi-moon.png
  badge-tuxedo-mask.png
  badge-luna-artemis.png
```

If actual extensions differ, use the exact files present rather than silently converting them.

## 6.5 Asset registry

Create one source of truth, e.g. `src/config/assets.ts` plus `src/config/avatars.ts` and `src/config/badges.ts` if cleaner.

Example shape:

```ts
export const avatarAssets = {
  "sailor-moon": "/assets/avatar-sailor-moon.png",
  "sailor-mercury": "/assets/avatar-sailor-mercury.png",
  "sailor-mars": "/assets/avatar-sailor-mars.png",
  "sailor-venus": "/assets/avatar-sailor-venus.png",
  "sailor-jupiter": "/assets/avatar-sailor-jupiter.png",
  "sailor-saturn": "/assets/avatar-sailor-saturn.png",
  "sailor-uranus": "/assets/avatar-sailor-uranus.png",
  "sailor-neptune": "/assets/avatar-sailor-neptune.png",
  "sailor-pluto": "/assets/avatar-sailor-pluto.png",
  "sailor-chibi-moon": "/assets/avatar-sailor-chibi-moon.png",
  "tuxedo-mask": "/assets/avatar-tuxedo-mask.png",
  "luna-artemis": "/assets/avatar-luna-artemis.png",
} as const;

export const badgeAssets = {
  "sailor-moon": "/assets/badge-sailor-moon.png",
  "sailor-mercury": "/assets/badge-sailor-mercury.png",
  "sailor-mars": "/assets/badge-sailor-mars.png",
  "sailor-venus": "/assets/badge-sailor-venus.png",
  "sailor-jupiter": "/assets/badge-sailor-jupiter.png",
  "sailor-saturn": "/assets/badge-sailor-saturn.png",
  "sailor-uranus": "/assets/badge-sailor-uranus.png",
  "sailor-neptune": "/assets/badge-sailor-neptune.png",
  "sailor-pluto": "/assets/badge-sailor-pluto.png",
  "sailor-chibi-moon": "/assets/badge-sailor-chibi-moon.png",
  "tuxedo-mask": "/assets/badge-tuxedo-mask.png",
  "luna-artemis": "/assets/badge-luna-artemis.png",
} as const;
```

If the repository serves static assets from a different prefix, adapt only the path prefix, not component logic.

## 6.6 What should stay CSS/SVG instead of becoming image assets

Do **not** create separate raster files for:

- card backgrounds and glass panels;
- pastel/galaxy gradients;
- thin gold borders;
- rounded buttons and chips;
- payment checkboxes;
- status pills;
- calendar circles for the 13th/15th/20th;
- progress bars/rings;
- ordinary water/gas/electricity/home/recycle icons;
- simple crescent/star/sparkle ornaments;
- live-clock circular progress/halo;
- shadows, glows and hover states;
- fireworks/confetti particles.

Use CSS, SVG, Lucide icons, gradients and lightweight particle effects for these.

## 6.7 Copyright/source rule for implementation

Do not download replacement fan art, official renders, logos or screenshots from the web into the project. Use the artwork the user has explicitly supplied in `assets/`, plus original CSS/SVG decorations created in code.

---

# 7. Live date/time

Time exists only as **real-world current time** for orientation inside the utility dashboard. It is not a countdown and is not tied to completing a task.

Always derive the user’s **browser-local** date/time.

Example:

```text
Четверг, 13 августа 2026
14:37:42
```

Requirements:

- show hours, minutes and seconds: `HH:MM:SS`;
- seconds visibly update every second;
- no hardcoded timezone;
- use the device/browser local timezone and Russian date formatting;
- derive every displayed tick from `new Date()` rather than decrementing a counter;
- do not write clock ticks to localStorage;
- clean up intervals on component unmount;
- handle tab backgrounding without drift by re-reading current time when rendering/ticking;
- if a large clock is displayed in the central reference-style ring, the small top bar may show a compact duplicate or just the date; on mobile the sticky top bar must still expose current time.

## 7.1 Central clock visual

Where the reference has its large circular timer, create an ornamental **live clock**:

- large digits `14:37:42`;
- optional small line above/below: weekday/date or nearest utility deadline;
- moon/crystal ring visual inspired by the supplied reference;
- very slow continuous halo/orbit motion, e.g. 8–14 s per decorative cycle;
- tiny sparkle/shimmer accents may appear occasionally;
- ring animation is **purely decorative** and must not suggest remaining time/progress;
- no Start/Pause/Reset buttons;
- no 15/25/45/60 presets;
- no user interaction required;
- `prefers-reduced-motion` changes it to a static elegant ring.

---

# 8. Profile window

Open profile from the avatar/user icon in the top bar.

Use an elegant modal or side sheet.

## Required fields

### Name

- label: `Имя`;
- text input;
- persist immediately or on Save;
- greeting uses the name: `Добрый день, Вера` / neutral `Привет, Вера`.

### Today’s mood

Label: `Как я сегодня?`

Provide 6 clear mood choices, for example:

- `Вдохновлённо`;
- `Спокойно`;
- `Собранно`;
- `Нейтрально`;
- `Устало`;
- `Немного тревожно`.

Mood is stored **per date**, not globally, so tomorrow starts blank/neutral while yesterday remains in local history.

### Today’s thought

Label exactly or near-exactly:

`О чём я сегодня думаю`

- textarea;
- recommended max 280 characters;
- autosave with debounce;
- stored by date;
- show a subtle `Сохранено` state, not a disruptive toast on every keystroke.

Optional profile settings within the same panel:

- notifications enabled state;
- sound on/off;
- reduced decorative effects toggle.

## 8.1 Account avatar + personal photo + active collectible reward

The profile has **two independent visual systems**:

1. **Account avatar** — the user’s profile picture. All 12 supplied `avatar-*` images are available immediately, and the user may alternatively upload a personal photo.
2. **Active collectible badge** — an earned monthly reward shown next to the avatar. Reward badges come from the separate `badge-*` files and remain locked until earned.

### Preset account avatars

On first profile setup, show a polished 3×4 avatar picker on desktop/tablet and 3×4 or 2×6 on narrow mobile.

All 12 are selectable from the start:

- Сейлор Мун;
- Сейлор Меркурий;
- Сейлор Марс;
- Сейлор Венера;
- Сейлор Юпитер;
- Сейлор Сатурн;
- Сейлор Уран;
- Сейлор Нептун;
- Сейлор Плутон;
- Сейлор Чиби Мун;
- Такседо Маск;
- Луна и Артемис.

Use the corresponding `assets/avatar-*.png` files. Selected preset avatar persists in localStorage and can be changed later from the profile panel.

### Personal photo option

Also provide `Загрузить своё фото` / `Изменить фото`:

- accept `image/jpeg`, `image/png`, `image/webp`;
- crop to square and downscale client-side;
- recommended stored size: max **256×256 px**;
- prefer WebP/JPEG compression to limit localStorage usage;
- store only the processed data URL, never the original full-resolution file;
- `Удалить фото` returns to the previously selected preset avatar (or a safe default such as Sailor Moon).

### Avatar display

- top bar avatar is circular or softly rounded according to the reference;
- profile panel shows a larger preview;
- use `object-fit: cover` for uploaded photos;
- preset avatar art should not be re-cropped destructively; preserve the supplied composition.

### Active monthly reward next to avatar

Immediately next to the account avatar, reserve a separate slot for the currently active **earned badge**:

- the badge never replaces the profile picture;
- it must not cover the face;
- preferred size about 28–36 px in top bar, 72–96 px in Profile;
- clicking the avatar opens Profile;
- clicking the reward badge opens `Коллекция наград` / `Коллекция значков`;
- any already unlocked reward may be made `Активным`;
- locked rewards are never selectable;
- active reward selection persists in localStorage.

---

# 9. To Pay list — core feature

This is the most important area of the product.

## 9.1 Utility card anatomy

Each utility row/card contains:

- medallion icon;
- utility name;
- deadline chip `до 15`;
- current state;
- payment amount, if paid;
- paid date/time, if paid;
- action button / checkbox.

Suggested compact layout:

```text
[icon] Горячая вода                 [до 15]
       Не оплачено                  [Оплатить]
```

Paid state:

```text
[icon] Горячая вода                 [✓ Оплачено вовремя]
       1 284,50 ₽ · 12 августа      [Изменить]
```

## 9.2 Payment completion flow

A checkbox alone must **not** silently complete payment.

When user clicks `Оплатить` or checks the payment control:

1. open a compact amount modal/bottom sheet;
2. title: `Сколько оплатили?`;
3. show utility name;
4. numeric currency input;
5. support decimal comma and decimal dot;
6. value must be `> 0`;
7. button `Сохранить оплату`;
8. on save:
   - record amount in integer kopecks/cents or normalized decimal representation;
   - record timestamp;
   - calculate on-time/late state;
   - close modal;
   - animate card to complete state;
   - award points;
   - update month total;
   - run 3-tasks milestone logic.

Never use JS floating-point summation directly for money if it can cause visible `0.30000000004` style errors. Prefer integer kopecks.

Example helpers:

```ts
function parseRublesToKopecks(input: string): number;
function formatKopecks(value: number): string;
```

## 9.3 Edit / undo

A completed payment must be editable.

`Изменить` opens the same amount dialog with the existing amount.

Also allow `Отменить оплату` inside that dialog, with a small confirmation. Recalculate points and totals deterministically rather than blindly subtracting an assumed value.

---

# 10. Meter readings

Create a separate but visually related `Показания` card/section.

Show only utilities with `requiresMeterReading === true`.

Default:

- Горячая вода;
- Холодная вода;
- Газ;
- Электричество.

Each item contains:

- utility icon/name;
- deadline `до 20`;
- status `Не внесены` / `Внесены вовремя` / `Внесены с опозданием`;
- action `Отметить внесёнными`.

The user only requested tracking that readings were submitted, not storing the raw meter numbers. Therefore **do not force numeric meter values in v1**.

When marked complete:

- save timestamp;
- calculate on-time/late;
- award points;
- update calendar;
- run 3-tasks milestone logic.

Allow undo/edit of submission state.

---

# 11. Central live clock — replaces the old Focus/Pomodoro timer

This section is intentionally **not a timer feature**. The application is for managing коммунальные услуги, so the center area from the visual reference is repurposed as a beautiful real-time clock.

## 11.1 Core UI

Card/visual title may remain the brand `Focus Tool` or use `Сейчас`, but do not label it as a Pomodoro/focus session.

Components:

- current local time in large digits `HH:MM:SS`;
- current date/weekday in a smaller line;
- circular moon/crystal ring inspired by the reference;
- a subtle decorative orbit, shimmer or halo;
- optional utility-relevant secondary line:
  - `До оплаты осталось 2 дня`, or
  - `Показания — до 20 августа`, or
  - `На этот месяц всё готово ✨`.

## 11.2 Behavior

- update visible seconds once per second;
- always derive from `new Date()`;
- no countdown state;
- no stored clock state;
- no Start/Pause/Resume/Reset buttons;
- no duration presets;
- no custom duration;
- no focus target;
- no points/rewards for leaving the clock open.

## 11.3 Animation

The ring may visually echo the magical reference, but its motion has no progress meaning:

- very slow rotation/orbit of tiny stars or one crescent marker;
- gentle 3–6% glow breathing;
- occasional soft crystal shine sweep;
- no flashing;
- no fast spinning;
- no second-hand motion that causes visual stress;
- reduce to static decoration under `prefers-reduced-motion`.

---

# 12. Calendar

Create a full month calendar card.

## 12.1 Calendar header

- previous month;
- month/year title;
- next month;
- button `Сегодня` if viewing another month.

## 12.2 Calendar cell states

Every day cell can show small semantic dots/marks:

- today highlight;
- 15th: payment deadline moon/gold marker;
- 20th: readings deadline crystal/blue marker;
- payment action history;
- meter-reading action history;
- perfect month celebration marker on the last day / month summary.

Do not put full text in every tiny cell. Use color/icon dots and a legend.

Click/tap a day to open a small details panel below/next to calendar:

```text
12 августа
✓ Горячая вода — 1 284,50 ₽
✓ Электричество — 2 050,00 ₽
```

## 12.3 Today

Today must be visually obvious but elegant: double-ring / moon halo, not a harsh blue square.

---

# 13. Payment totals and statistics

## 13.1 Current month

Show a prominent but calm card:

`Оплачено в августе: 8 742,30 ₽`

Also show:

- `5 из 7 услуг оплачено`;
- on-time count;
- late count if any.

Total updates instantly after create/edit/undo.

## 13.2 Monthly history

Each completed month must remain accessible in archive with:

- total paid amount;
- list of utilities and amounts;
- on-time/late status;
- readings completeness;
- points earned that month;
- perfect month yes/no.

## 13.3 Annual total

Always compute current year-to-date internally.

Show a smaller current-year stat in Archive:

`За 2026 год: 84 520,70 ₽`

At the end of a calendar year, create an **annual summary card** for the finished year.

### Annual summary visibility rule

For year `Y`:

- generate summary after `Y-12-31 23:59:59` (practically on first app open in January `Y+1`);
- show it prominently throughout **January of the following year**;
- from **1 February**, it remains available only in the Archive.

Annual summary contains:

- total paid in year;
- average monthly payment among months with records;
- highest-cost month;
- number of on-time payments;
- number of late payments;
- number of perfect months;
- total points earned.

Do not delete older annual summaries.

---

# 14. Archive

Provide a visible `Архив` entry from the statistics section or navigation.

Archive groups information by year.

Suggested hierarchy:

```text
Архив
  2026
    Годовой итог
    Декабрь — 9 320 ₽
    Ноябрь — 8 870 ₽
    ...
  2025
    ...
```

Each month expands/collapses.

No charts are required for v1. If a chart is added, it must be simple and not reduce mobile usability.

---

# 15. Gamification model

Gamification must reward completion and punctuality, not spending more money.

**Never award more points for a higher payment amount.**

Recommended deterministic point model:

| Action | Base | On-time bonus | Total if on time |
|---|---:|---:|---:|
| Pay one utility | 20 | +10 | 30 |
| Submit readings for one utility | 12 | +8 | 20 |
| 3 completed utility actions in one day | +15 bonus | — | +15 |
| Perfect finished month | +100 | — | +100 |

The live clock does **not** award points.

```ts
export const POINTS = {
  paymentBase: 20,
  paymentOnTimeBonus: 10,
  readingBase: 12,
  readingOnTimeBonus: 8,
  threeTasksDailyBonus: 15,
  perfectMonthBonus: 100,
} as const;
```

## 15.1 Points display

Show:

- total lifetime points;
- points earned this month;
- subtle progress bar/ring.

Optional non-intrusive lunar rank names:

1. `Новолуние`;
2. `Серп`;
3. `Полумесяц`;
4. `Сияющая луна`;
5. `Кристальная орбита`.

Do not make levels block any feature.

## 15.2 Recalculation requirement

Points must be derivable from ledger records + explicit milestone records. Editing/undoing a payment must not cause duplicate point inflation.

Use stable IDs and calculate/validate rewards idempotently.

---

# 16. “Three tasks completed” milestone

Interpret “3 любых задачи” as **three distinct completed utility-management actions in the same local calendar day**.

Qualifying actions:

- a utility payment completed;
- a meter-reading submission completed.

The live clock never counts as a task.

When the third distinct task of the day is completed:

1. show one encouraging toast/modal;
2. choose one of the 30 messages below randomly;
3. award the daily +15 bonus once;
4. mark the milestone as shown for that date;
5. do not repeat the 3-task celebration again that same day even if the user reaches 6 or 9 tasks.

If a task is undone after the bonus appeared, do not spam/re-show the celebration. Store the milestone event explicitly.

## 16.1 Thirty encouragement messages

Use this exact pool or very close wording. Randomize without selecting the immediately previous message when possible.

1. `Три дела уже позади — сегодня ты отлично держишь курс ✨`
2. `Вот это темп! Три задачи закрыты, и день уже стал легче.`
3. `Маленькие галочки складываются в большое спокойствие. Уже три!`
4. `Ты только что навёл(а) порядок сразу в трёх делах. Красиво.`
5. `Три шага сделаны. Можно на секунду почувствовать себя победителем 🌙`
6. `Отличная серия: три завершённых дела подряд.`
7. `Сегодняшний список заметно светлеет — уже три готово.`
8. `Есть! Три задачи закрыты. Очень достойный прогресс.`
9. `Ты не просто планируешь — ты завершаешь. Уже три раза сегодня.`
10. `Три дела выполнены. Домашняя рутина сегодня явно на твоей стороне.`
11. `Как приятно видеть три готовые задачи. Продолжай в своём ритме.`
12. `Три пункта исчезли из списка забот. Отличная работа.`
13. `Сегодня у порядка хорошие шансы на победу — три задачи уже готовы.`
14. `Три завершения за день — это уже настоящий импульс.`
15. `Хороший ритм: спокойно, последовательно, три дела сделаны.`
16. `Три задачи закрыты. Ты здорово разгружаешь будущего себя.`
17. `Ещё одна маленькая победа: счёт уже 3:0 в твою пользу ✨`
18. `Ты собрал(а) три галочки — заслуженный момент удовлетворения.`
19. `Список становится короче, а спокойствия больше. Уже три.`
20. `Три дела завершены без лишнего шума. Вот это приятная эффективность.`
21. `Сегодня ты уже трижды сказал(а) делам: «готово». Отлично.`
22. `Три задачи выполнены — можно позволить себе довольную улыбку.`
23. `Красивый прогресс: три пункта уже сияют статусом «готово».`
24. `Ты поймал(а) хороший рабочий поток. Третья задача закрыта.`
25. `Три завершённых дела — отличный вклад в спокойный месяц.`
26. `Порядок собирается по одному действию. Сегодня их уже три.`
27. `Три задачи готовы. Ты уверенно освобождаешь место для более приятных вещей.`
28. `Сегодняшняя орбита стабильна: три дела успешно завершены 🌙`
29. `Третья галочка на месте. Очень приятный момент — зафиксируем его.`
30. `Три дела сделаны. Пусть дальше будет так же легко и спокойно.`

Use gender-neutral UI where easy; if grammar becomes awkward, prefer neutral phrasings from the list.

---

# 17. Perfect month + fireworks

A month is `perfect` only if **all** of these are true:

1. all 7 utility payments exist;
2. every payment was completed on or before the 15th deadline;
3. every utility requiring meter readings has a submission record;
4. every required reading was submitted on or before the 20th deadline.

Payment amount does not affect perfect-month eligibility as long as it is valid and positive.

## Celebration timing

The large celebration happens **after the calendar month is finished**, not immediately after the last task.

On the first app evaluation after the month has ended:

- if the month qualifies and `celebrationShown === false`:
  - award +100 perfect-month points;
  - display full-screen but tasteful fireworks/confetti for about 3–5 seconds;
  - show a crystal/moon success panel;
  - show total month spend;
  - show `Все оплачено вовремя. Показания внесены вовремя.`;
  - store `celebrationShown = true`.

If the user opens the app on the first day of the next month, the celebration may appear then once.

Respect `prefers-reduced-motion`: replace fireworks with a static shimmer/badge and short fade.

Avoid explosive sound by default. A gentle optional success chime is enough.

---

# 18. Notifications and reminders

There are two layers:

1. **Guaranteed in-app reminders/toasts** whenever the app is opened or remains running.
2. **Browser system notifications** if the user explicitly grants permission and the browser supports them.

Do not request Notification permission automatically on first page load. Provide a button such as `Включить уведомления` and request permission after the user clicks it.

## 18.1 Reminder defaults

Keep schedules in config so they can be edited later.

### Payment reminders

If not all bills are paid:

- 10th: gentle reminder;
- 14th: `Завтра срок оплаты`;
- 15th: `Сегодня последний день оплаты`;
- 16th onward: overdue reminder once per day while the app is opened, until all are paid.

### Meter-reading reminders

If readings remain incomplete:

- 17th: gentle reminder;
- 19th: `Завтра срок передачи показаний`;
- 20th: `Сегодня последний день передачи показаний`;
- 21st onward: overdue reminder once per day while the app is opened, until complete.

Do not notify about a category that is already fully complete.

## 18.2 Notification deduplication

Persist a log key such as:

```ts
notificationLog: {
  "2026-08-14:payment-day-before": true,
  "2026-08-20:readings-due": true
}
```

This prevents repeats on reload.

## 18.3 Important browser limitation

Because this demo is intentionally **localStorage-only with no server**, do not falsely promise perfectly timed system notifications while the browser/PWA is fully closed on every platform.

Implement:

- Notification API permission + system notifications when execution is available;
- a service worker/PWA shell if practical;
- app-start deadline checks;
- in-app reminders;
- interval-based checks while the page is active.

Do **not** rely on Periodic Background Sync as the only solution because cross-browser support is limited.

For a future production version requiring reliable closed-app reminders, leave a short architecture note that **Web Push + a server/scheduled backend** would be needed.

---

# 18A. Monthly Sailor reward collection — 12-month system

Add a collectible monthly reward system tied specifically to **completing all utility payments for the month**. This is separate from the stricter `Идеальный месяц` reward, which also checks deadlines and meter readings.

**Important distinction:**

- `avatar-*` images = account pictures; all 12 available immediately;
- `badge-*` images = monthly collectible rewards; locked until earned.

## 18A.1 Unlock condition

A month becomes reward-eligible when **all 7 enabled utility bills have a valid PaymentRecord for that calendar month**:

1. Горячая вода;
2. Холодная вода;
3. Газ;
4. Капитальный ремонт;
5. Услуги ЖКХ;
6. Электричество;
7. Твёрдые коммунальные отходы (ТКО).

Rules:

- eligibility is based on all seven payments being completed by the end of the calendar month;
- being late does **not** cancel the collectible badge if every bill is eventually paid within that same month;
- `Идеальный месяц` remains stricter: all required payments + readings on time;
- editing an already-paid amount must not create an additional reward;
- reward is granted at most once per month.

## 18A.2 End-of-month claim flow

When all seven bills are paid, show a subtle teaser:

`Все платежи месяца закрыты ✨ Награда заработана. Она откроется в конце месяца.`

At the end of the month, or on the first app launch after the month has ended, show a reward modal:

- title: `Новая награда!`;
- short positive line;
- animated reveal of the badge asset;
- button: `Добавить в коллекцию`;
- secondary action: `Сделать активной`.

Do not depend on the browser being open at midnight. On startup, reconcile any eligible unclaimed past month.

## 18A.3 Reward pool — exactly 12 collectibles

Use this exact set and Russian UI names:

1. `Сейлор Мун`;
2. `Сейлор Меркурий`;
3. `Сейлор Марс`;
4. `Сейлор Венера`;
5. `Сейлор Юпитер`;
6. `Сейлор Сатурн`;
7. `Сейлор Уран`;
8. `Сейлор Нептун`;
9. `Сейлор Плутон`;
10. `Сейлор Чиби Мун`;
11. `Такседо Маск`;
12. `Луна и Артемис`.

Default behavior:

- choose one random badge from the still-locked pool;
- never give duplicates while locked badges remain;
- persist which month granted which badge;
- after all 12 are unlocked, show `Полная коллекция`;
- future eligible months may grant points / a small crystal aura instead of duplicates.

For deterministic demo/testing, the selector may accept a seeded/test override, but normal UX should feel like a surprise reveal.

## 18A.4 Reward art

Use the existing supplied `assets/badge-*.png` artwork. Do not regenerate it, trace it in CSS or substitute account-avatar images.

Requirements:

- transparent-background art where supplied;
- readable at 28–36 px next to avatar and 96–140 px in collection/reveal;
- character/reward name rendered as HTML, never baked into UI text;
- use `object-fit: contain`;
- retain original aspect ratio;
- active badge may have a CSS glow/ring but the original asset must remain intact.

## 18A.5 Collection screen

Add `Коллекция наград` accessible from the badge next to the avatar and from Profile.

Layout:

- 3×4 grid on desktop/tablet;
- 2×6 or 3×4 on narrow mobile depending on width;
- unlocked reward: full art + character name + month/year earned;
- locked reward: blurred/frosted silhouette or neutral placeholder + lock icon;
- active reward: thin luminous ring + `Активная`;
- clicking an unlocked reward opens a detail sheet with `Сделать активной`.

At top show:

`Собрано: X / 12`

and a subtle constellation-style collection progress line.

## 18A.6 Reward asset filenames

The registry must point to these existing logical files in `assets/`:

```text
badge-sailor-moon.png
badge-sailor-mercury.png
badge-sailor-mars.png
badge-sailor-venus.png
badge-sailor-jupiter.png
badge-sailor-saturn.png
badge-sailor-uranus.png
badge-sailor-neptune.png
badge-sailor-pluto.png
badge-sailor-chibi-moon.png
badge-tuxedo-mask.png
badge-luna-artemis.png
```

Use `src/config/badges.ts` with ids, Russian names, exact asset paths and unlock selectors. Do not hardcode reward image paths throughout components.

---

# 19. LocalStorage architecture

Use one namespaced root key, versioned for future migrations.

Recommended key:

`focusTool.utilityPlanner.v2`

If an earlier v1 state exists, add a one-time migration that drops obsolete focus-timer state while preserving profile, payments, readings, points, journals, archive and unlocked badges.

Recommended TypeScript data shape:

```ts
type UtilityId =
  | "hot-water"
  | "cold-water"
  | "gas"
  | "capital-repair"
  | "housing-services"
  | "electricity"
  | "waste";

type CharacterId =
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

type AvatarId = CharacterId;
type SailorBadgeId = CharacterId;

type UtilityTemplate = {
  id: UtilityId;
  name: string;
  icon: string;
  requiresMeterReading: boolean;
  enabled: boolean;
};

type PaymentRecord = {
  utilityId: UtilityId;
  amountKopecks: number;
  paidAt: number;
  deadlineAt: number;
  onTime: boolean;
  updatedAt: number;
};

type ReadingRecord = {
  utilityId: UtilityId;
  submittedAt: number;
  deadlineAt: number;
  onTime: boolean;
  updatedAt: number;
};

type MonthLedger = {
  monthKey: string; // YYYY-MM
  payments: Partial<Record<UtilityId, PaymentRecord>>;
  readings: Partial<Record<UtilityId, ReadingRecord>>;
  celebrationShown: boolean;
  perfectMonthRewardGranted: boolean;
  sailorBadgeEligible: boolean;
  sailorBadgeClaimed: boolean;
  sailorBadgeId: SailorBadgeId | null;
};

type DailyJournal = {
  dateKey: string; // YYYY-MM-DD
  mood: string | null;
  thought: string;
  threeTaskMilestoneShown: boolean;
  threeTaskBonusGranted: boolean;
};

type CompletionEvent = {
  id: string;
  type: "payment" | "reading";
  happenedAt: number;
  dateKey: string;
  monthKey: string;
  utilityId: UtilityId;
};

type BadgeUnlock = {
  badgeId: SailorBadgeId;
  earnedForMonthKey: string; // YYYY-MM
  unlockedAt: number;
};

type BadgeCollectionState = {
  unlocked: BadgeUnlock[];
  activeBadgeId: SailorBadgeId | null;
  claimedMonthKeys: string[];
};

type AnnualSummary = {
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

type AppStateV2 = {
  version: 2;
  profile: {
    name: string;
    avatarMode: "preset" | "uploaded";
    selectedAvatarId: AvatarId;
    uploadedAvatarDataUrl: string | null;
    notificationPreference: "unknown" | "enabled" | "disabled";
    soundEnabled: boolean;
    reducedEffects: boolean;
  };
  utilities: UtilityTemplate[];
  ledgers: Record<string, MonthLedger>;
  journals: Record<string, DailyJournal>;
  completionEvents: CompletionEvent[];
  badgeCollection: BadgeCollectionState;
  annualSummaries: Record<string, AnnualSummary>;
  notificationLog: Record<string, boolean>;
  ui: {
    lastEncouragementIndex: number | null;
    selectedCalendarMonth: string | null;
  };
};
```

The live clock has **no persistent state**. It is derived from the device clock at render time.

## 19.1 Storage service

Do not call `localStorage.getItem/setItem` randomly across components.

Create one module, e.g.:

```text
src/lib/storage.ts
```

Responsibilities:

- safe parse;
- default state;
- v1→v2 migration;
- validation/sanitization;
- save;
- reset;
- optional storage-event sync between tabs.

Catch malformed JSON and recover gracefully without crashing the whole app.

## 19.2 Persistence strategy

- save after meaningful state mutations;
- debounce textarea/thought writes;
- never save live clock ticks;
- store uploaded avatar only after client-side resize/compression;
- keep money/date calculations deterministic.

---

# 20. Suggested app modules / folder structure

Adapt to the existing repo, but aim for separation like:

```text
src/
  app/
    App.tsx
  components/
    layout/
      TopBar.tsx
      DashboardShell.tsx
      LiveClockCard.tsx
    profile/
      ProfilePanel.tsx
      AvatarPicker.tsx
      PersonalPhotoUploader.tsx
      MoodPicker.tsx
    bills/
      ToPayList.tsx
      UtilityPaymentCard.tsx
      PaymentAmountDialog.tsx
      MeterReadingsCard.tsx
    calendar/
      UtilityCalendar.tsx
      CalendarDayDetails.tsx
    stats/
      MonthSummaryCard.tsx
      AnnualSummaryCard.tsx
      ArchivePanel.tsx
    gamification/
      PointsChip.tsx
      EncouragementToast.tsx
      PerfectMonthCelebration.tsx
      RewardBadge.tsx
      RewardCollectionPanel.tsx
      RewardRevealModal.tsx
    notifications/
      NotificationSettings.tsx
  config/
    assets.ts
    avatars.ts
    badges.ts
    utilities.ts
    points.ts
    reminders.ts
  hooks/
    useClock.ts
    useLocalAppState.ts
    useReminderEngine.ts
  lib/
    dates.ts
    money.ts
    scoring.ts
    storage.ts
    reminders.ts
    annualSummary.ts
    rewards.ts
  styles/
    tokens.css
    global.css
  types/
    app.ts
```

There should be **no `FocusTimer`, `FocusTargetPicker` or `useFocusTimer` module** in this version.

---

# 21. State-management rules

Do not introduce Redux solely for this app unless already present.

React context + reducer or a small state hook is enough.

Required actions should be explicit, e.g.:

```ts
recordPayment(...)
updatePayment(...)
removePayment(...)
markReadingSubmitted(...)
unmarkReading(...)
updateProfile(...)
selectPresetAvatar(...)
setUploadedAvatar(...)
removeUploadedAvatar(...)
updateDailyMood(...)
updateDailyThought(...)
claimMonthlyReward(...)
setActiveReward(...)
resetDemo(...)
```

There are no focus-session actions.

After each meaningful state mutation:

1. update derived totals;
2. evaluate milestone/reward eligibility idempotently;
3. persist state;
4. emit UI feedback.

---

# 22. Derived selectors / business logic

Create pure helpers/selectors rather than embedding complex logic in JSX.

Must include equivalents of:

```ts
getMonthLedger(monthKey)
getPaymentDeadline(monthKey)
getReadingDeadline(monthKey)
getMonthPaidTotal(monthKey)
getYearPaidTotal(year)
getPaymentProgress(monthKey)
getReadingProgress(monthKey)
isPerfectMonth(monthKey)
getPointsForMonth(monthKey)
getLifetimePoints()
getTodayCompletionCount(dateKey)
getNextDeadline(now)
```

Testing these pure functions is high value.

---

# 23. Reminder engine

Create one reminder evaluator that runs:

- on app boot;
- when relevant completion data changes;
- shortly after local midnight/day change;
- at a modest interval while app is open, e.g. every 60 seconds.

Do not run a 1-second reminder poll just because the clock updates every second.

Reminder evaluator returns semantic events, e.g.:

```ts
{
  id: "2026-08-14:payment-day-before",
  type: "payment",
  severity: "warning",
  title: "Завтра срок оплаты",
  body: "Осталось оплатить 3 услуги."
}
```

UI then decides whether to show toast and/or browser notification.

---

# 24. Status logic and labels

Use consistent statuses.

## Payment

- before paid: `Не оплачено`;
- paid on/before deadline: `Оплачено вовремя`;
- paid after deadline: `Оплачено с опозданием`;
- after deadline and not paid: `Просрочено`.

## Reading

- before submitted: `Не внесены`;
- submitted on/before deadline: `Внесены вовремя`;
- submitted after deadline: `Внесены с опозданием`;
- after deadline and not submitted: `Просрочено`.

Do not label something “late” before the deadline has actually passed.

---

# 25. Monthly deadline card

Add a compact card that answers one question immediately: **what needs attention next?**

Examples:

Before payment deadline:

```text
Ближайший срок
Оплата услуг — до 15 августа
Осталось 3 из 7
```

After all payments but before readings:

```text
Ближайший срок
Показания — до 20 августа
Осталось 2 из 4
```

When all current obligations are complete:

```text
На этот месяц всё готово ✨
```

Use a moon-phase style progress arc if it remains readable.

---

# 26. Microinteractions

## Completing a payment

Sequence ~500–700 ms total:

1. button press;
2. amount modal save;
3. icon ring traces once;
4. checkmark fades/scales in;
5. amount count-up or fade-in;
6. tiny 3–6 sparkle particles;
7. points chip briefly increments.

## Opening profile/archive/reward collection

- backdrop fade 150–200 ms;
- panel slides/fades 220–300 ms;
- no giant bounce.

## Calendar month navigation

- subtle horizontal fade/slide 180–240 ms;
- retain panel dimensions to avoid layout jump.

## Live clock centerpiece

- digits update once per second without bouncing layout;
- use tabular numerals (`font-variant-numeric: tabular-nums`) so width stays stable;
- outer moon/crystal ring may drift/rotate very slowly independent of seconds;
- tiny stars may move on long 8–14 s loops;
- occasional shine sweep is allowed but should not run every second;
- no countdown/progress semantics;
- under `prefers-reduced-motion`, keep the ring static and update digits only.

---

# 27. Accessibility and usability

Required:

- semantic buttons and form labels;
- `aria-label` for icon-only controls;
- visible keyboard focus state;
- modal focus trap and Escape close;
- keyboard-operable calendar navigation where practical;
- color is not the only status signal — use icon + text;
- sufficient text contrast on pale gradients;
- reduced motion support;
- no important information inside decorative images;
- error messages associated with payment input.

Payment amount validation example:

`Введите сумму больше 0 ₽.`

---

# 28. Responsive details

## Payment modal

- desktop: centered dialog;
- mobile: bottom sheet with input safely above virtual keyboard;
- focus amount input automatically after open;
- numeric input mode: `decimal`.

## Calendar

On small phones:

- seven-column grid still fits;
- day number and max 2–3 tiny markers only;
- selected-day details render below calendar;
- avoid tiny text inside cells.

## Top bar

Date can shorten on mobile:

- desktop: `Четверг, 13 августа 2026`;
- mobile: `13 авг` plus full live time.

---

# 29. Empty / first-use states

On first ever load:

- no fake historical payments;
- create default utility templates;
- show current month obligations;
- profile name may be empty;
- top greeting can be `Добрый день`;
- mood blank/neutral;
- thought blank;
- default preset account avatar is Sailor Moon unless the user chooses another;
- all 12 preset `avatar-*` choices are immediately available;
- all 12 monthly `badge-*` rewards begin locked;
- live clock displays current local `HH:MM:SS` immediately.

Use a gentle first-use tooltip/card:

`Начните с одной задачи — например, отметьте уже оплаченную услугу.`

A full registration system is not required. If a first-run profile setup is shown, keep it lightweight: name + avatar choice, with `Загрузить своё фото` as an optional alternative.

---

# 30. Demo reset button

Because this is demo mode, include a visible but non-prominent control:

`Сбросить демо`

Recommended location:

- profile/settings panel footer, or
- archive/settings area.

Use `RotateCcw` icon.

On click open confirmation:

```text
Сбросить демо?
Все сохранённые оплаты, показания, профиль, очки и архив на этом устройстве будут удалены.

[Отмена] [Да, сбросить]
```

On confirm:

1. remove only the app’s namespaced localStorage key(s);
2. restore default state;
3. keep utility definitions defaults;
4. close modal/panels;
5. show `Демо-данные сброшены`;
6. do not trigger points or celebration.

Never call `localStorage.clear()` because it could delete unrelated origin data.

---

# 31. Error handling

Handle at minimum:

- invalid/empty payment amount;
- corrupt localStorage JSON;
- storage write failure/quota error;
- Notification API unsupported;
- notification permission denied;
- missing reference image (fall back to documented design tokens without crashing);
- missing avatar or reward asset file (show a neutral CSS/SVG placeholder and log a clear development warning);
- uploaded photo too large/invalid;
- v1→v2 migration with obsolete focus data;
- system clock crossing midnight/month/year while app remains open.

App must not become unusable if system notifications or a decorative image are unavailable.

---

# 32. PWA/offline behavior

Recommended for the demo, if it does not complicate the existing stack:

- installable PWA manifest;
- service worker caches the app shell and local static assets;
- app remains usable offline because its actual records are local;
- browser notification feature gracefully degrades.

Do not imply that offline PWA alone guarantees scheduled notifications while closed.

---

# 33. Data privacy note in UI

Add a small settings/profile caption:

`Данные хранятся только в этом браузере на этом устройстве.`

This is important because localStorage is device/browser-origin specific.

No analytics or data transmission.

---

# 34. Suggested configuration files

## `src/config/utilities.ts`

Contains the seven recurring bill templates.

## `src/config/reminders.ts`

```ts
export const REMINDER_DAYS = {
  paymentGentle: 10,
  paymentDayBefore: 14,
  paymentDue: 15,
  readingsGentle: 17,
  readingsDayBefore: 19,
  readingsDue: 20,
} as const;
```

## `src/config/points.ts`

Contains all point values. No focus-session points exist.

## `src/config/assets.ts`

Central mapping for the supplied reference and any shared themed assets.

## `src/config/avatars.ts`

Contains exactly 12 preset account-avatar entries, their Russian names and `avatar-*` asset paths. These are all available from first use.

## `src/config/badges.ts`

Contains exactly 12 collectible reward entries, their Russian names and `badge-*` asset paths. Unlock state comes from localStorage/business logic, not from this static config.

---

# 35. Money formatting

Use Russian ruble formatting through `Intl.NumberFormat` where possible.

```ts
const currencyFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  minimumFractionDigits: 2,
});
```

Internally keep integer kopecks.

The display may render:

`1 284,50 ₽`

Accept inputs:

- `1284`
- `1284.5`
- `1284,50`

Normalize before storing.

---

# 36. Date logic

Use local calendar dates, not UTC date strings generated by `toISOString().slice(0, 10)` if that can shift the user’s day around midnight.

Create explicit local helpers:

```ts
getLocalDateKey(date) // YYYY-MM-DD using local fields
getLocalMonthKey(date) // YYYY-MM
getLocalEndOfDay(year, monthIndex, day)
```

Deadlines must be built in local time.

---

# 37. Celebration and archive edge cases

Codex must explicitly handle:

- opening app on Jan 1 after not using it since Dec 10;
- finishing all December items early, then not opening app until Jan 3;
- editing a December payment in January;
- resetting demo in January;
- no records for some months of a year;
- leap years;
- changing system year/month while app is open.

If past data is edited, regenerate derived annual summary rather than leaving stale totals.

---

# 38. No unnecessary scope creep

Do **not** add unless requested later:

- bank integration;
- account registration;
- cloud sync;
- OCR receipts;
- bank-card entry;
- automatic payment processing;
- AI financial advice;
- public social leaderboards;
- ads;
- complicated avatar creator;
- raw meter-number analytics.

Keep v1 centered on the requested experience.

---

# 39. Recommended implementation order

1. Inspect repo and preserve stack.
2. Inspect the supplied reference image and the entire `assets/` folder before styling.
3. Verify the 12 `avatar-*` account images and 12 `badge-*` reward images; build central registries.
4. Add types + utilities config.
5. Build localStorage v2 service and v1 migration that removes obsolete focus-timer state without losing useful data.
6. Build pure date/money/deadline helpers.
7. Build To Pay list + amount modal.
8. Build meter-reading completion.
9. Build current month totals.
10. Build real live date/time + central animated `HH:MM:SS` clock; **no countdown timer**.
11. Build profile + 12 preset avatar selector + optional personal photo + daily mood/thought.
12. Build calendar + history markers.
13. Build scoring + 3-task milestone + 30 messages.
14. Build monthly Sailor reward collection + active reward beside avatar.
15. Build perfect-month evaluation + fireworks.
16. Build annual summary + archive.
17. Build reminder engine + permission UI + graceful browser notifications.
18. Match reference image through CSS/design tokens and use supplied raster art only where appropriate.
19. Add responsive/mobile polish.
20. Run acceptance tests.

---

# 40. Acceptance checklist

The feature is not complete until all items below pass.

## Core data

- [ ] Reloading the page preserves profile, avatar choice/photo, mood/thought, payments, readings, points, rewards and archive.
- [ ] No backend/network persistence is used for user records.
- [ ] Reset removes only this app’s localStorage namespace.
- [ ] v1 state can migrate to v2 without keeping obsolete focus-timer state.

## To Pay

- [ ] All 7 required utility categories appear automatically each month.
- [ ] Clicking payment completion always asks for the amount.
- [ ] Amount supports comma/dot decimal input.
- [ ] Month total is mathematically correct after add/edit/remove.
- [ ] Paid timestamp is stored.
- [ ] On-time vs late status uses the 15th local deadline.

## Readings

- [ ] Default metered utilities are hot water, cold water, gas and electricity.
- [ ] Reading submission timestamp is stored.
- [ ] On-time vs late status uses the 20th local deadline.

## Date/time/calendar

- [ ] Today’s date is visible.
- [ ] Real local time shows hours, minutes and seconds and visibly updates every second.
- [ ] Central clock is a real clock, not a countdown.
- [ ] No 15/25/45/60 presets or Start/Pause/Reset focus controls exist.
- [ ] Decorative ring motion does not imply remaining progress.
- [ ] Calendar highlights today.
- [ ] 15th and 20th deadlines are visually marked.
- [ ] Clicking a historical date can reveal recorded actions.

## Profile / account avatar

- [ ] Profile window opens from top bar.
- [ ] Name persists.
- [ ] Mood is selectable and stored per day.
- [ ] `О чём я сегодня думаю` persists per day.
- [ ] Exactly 12 preset `avatar-*` images are available from first use.
- [ ] User can change preset avatar later.
- [ ] User can optionally upload, crop/downscale and use a personal photo.
- [ ] Removing personal photo returns to a preset avatar.

## Gamification

- [ ] Points do not depend on payment amount.
- [ ] Live clock never awards points.
- [ ] Third distinct payment/reading action of the day triggers exactly one random encouragement.
- [ ] Pool contains 30 encouragement messages.
- [ ] Daily 3-task bonus cannot be farmed by reload.
- [ ] Editing a completed payment does not duplicate points.

## Sailor reward collection

- [ ] Account avatar and active reward badge are visually separate; badge never covers the face.
- [ ] All 7 paid utilities make the month reward-eligible.
- [ ] Reward is granted only after the month ends / on next launch after rollover.
- [ ] Exactly one reward can be claimed per eligible month.
- [ ] Reward selection is random from the locked pool and cannot duplicate until all 12 are collected.
- [ ] Exactly 12 `badge-*` collectible entries exist: Moon, Mercury, Mars, Venus, Jupiter, Saturn, Uranus, Neptune, Pluto, Chibi Moon, Tuxedo Mask, Luna & Artemis.
- [ ] Collection panel shows X/12, locked/unlocked/active states and earned month.
- [ ] User can set any unlocked reward as active next to the avatar.
- [ ] Reward state survives reload and month/year rollover.
- [ ] Missing browser-at-midnight execution is handled by startup reconciliation.

## Monthly celebration

- [ ] Perfect month requires all 7 payments on time.
- [ ] Perfect month requires all required readings on time.
- [ ] Celebration happens once after the month finishes.
- [ ] Fireworks respect reduced motion.
- [ ] Month total is shown in celebration.

## Annual summary/archive

- [ ] Current year total is computable from ledgers.
- [ ] Finished-year summary appears prominently during the following January.
- [ ] From February it is accessible in Archive.
- [ ] Old data remains available after month/year rollover.

## Notifications

- [ ] App has in-app reminders for payment and readings deadlines.
- [ ] Notification permission is requested only after explicit user action.
- [ ] Unsupported/denied system notifications do not break reminders.
- [ ] Duplicate reminder notifications are suppressed.
- [ ] UI does not falsely promise guaranteed closed-browser scheduling in the local-only demo.

## Assets / reference / design

- [ ] Codex inspects the supplied reference image before final visual implementation.
- [ ] The finished dashboard visibly follows the reference’s hierarchy, palette, softness, card proportions and magical-gold/crystal language.
- [ ] Ordinary UI is CSS/SVG/Lucide rather than raster screenshots.
- [ ] Existing `avatar-*` and `badge-*` files are used through registries rather than duplicated or regenerated.
- [ ] Buttons have clear Russian labels/icons.
- [ ] Cards/status chips are highly readable.
- [ ] Mobile layout has no horizontal scroll.
- [ ] Keyboard focus and reduced motion are supported.

---

# 41. Definition of done

The site is considered ready when a user can open it on phone or desktop and, without instructions:

1. immediately see today’s date, real local time with seconds and the upcoming utility deadline;
2. understand which bills are still unpaid;
3. mark a bill paid and enter the amount in one short flow;
4. see the month total update instantly;
5. mark meter readings submitted;
6. see a beautiful central `HH:MM:SS` live clock with gentle decoration and **no countdown controls**;
7. open Profile, choose any of the 12 supplied account avatars or upload a personal photo, set mood and write a daily thought;
8. see deadlines/history in the calendar;
9. receive a positive milestone message after three qualifying payment/reading actions;
10. return after reload and find everything intact;
11. receive a perfect-month celebration only when the entire month truly qualifies;
12. review monthly and annual spending in Archive;
13. reset all demo data safely with one confirmed action;
14. finish all monthly payments, claim one non-duplicate Sailor reward after month rollover, and display any unlocked reward beside the avatar;
15. recognize the supplied reference image in the visual language of the final implementation without the site becoming an unreadable raster imitation.

The final product should feel like a **beautiful lunar personal utility planner**, with the emotional polish of a magical transformation object but the clarity and reliability of a real household finance tool.
