import type { CharacterId, UtilityTemplate } from "./types";

export const UTILITIES: UtilityTemplate[] = [
  { id: "hot-water", name: "Горячая вода", icon: "droplets", tone: "warm", requiresMeterReading: true, enabled: true },
  { id: "cold-water", name: "Холодная вода", icon: "droplets", tone: "cool", requiresMeterReading: true, enabled: true },
  { id: "gas", name: "Газ", icon: "flame", tone: "rose", requiresMeterReading: true, enabled: true },
  { id: "capital-repair", name: "Капитальный ремонт", icon: "wrench", tone: "lilac", requiresMeterReading: false, enabled: true },
  { id: "housing-services", name: "Услуги ЖКХ", icon: "building", tone: "violet", requiresMeterReading: false, enabled: true },
  { id: "electricity", name: "Электричество", icon: "zap", tone: "gold", requiresMeterReading: true, enabled: true },
  { id: "waste", name: "Твёрдые коммунальные отходы (ТКО)", shortName: "ТКО", icon: "recycle", tone: "mint", requiresMeterReading: false, enabled: true },
];

type ArtEntry = { id: CharacterId; name: string; src: string };
const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`;

export const AVATARS: ArtEntry[] = [
  { id: "sailor-moon", name: "Сейлор Мун", src: asset("avatar-sailor-moon.png") },
  { id: "sailor-mercury", name: "Сейлор Меркурий", src: asset("avatar-sailor-mercury.png") },
  { id: "sailor-mars", name: "Сейлор Марс", src: asset("avatar-sailor-mars.png") },
  { id: "sailor-venus", name: "Сейлор Венера", src: asset("avatar-sailor-venus.png") },
  { id: "sailor-jupiter", name: "Сейлор Юпитер", src: asset("avatar-sailor-jupite.png") },
  { id: "sailor-saturn", name: "Сейлор Сатурн", src: asset("avatar-sailor-saturn.png") },
  { id: "sailor-uranus", name: "Сейлор Уран", src: asset("avatar-sailor-uranus.png") },
  { id: "sailor-neptune", name: "Сейлор Нептун", src: asset("avatar-sailor-neptune.png") },
  { id: "sailor-pluto", name: "Сейлор Плутон", src: asset("avatar-sailor-pluto.png") },
  { id: "sailor-chibi-moon", name: "Сейлор Чиби Мун", src: asset("avatar-sailor-chibi-moon.png") },
  { id: "tuxedo-mask", name: "Такседо Маск", src: asset("avatar-tuxedo-mask.png") },
  { id: "luna-artemis", name: "Луна и Артемис", src: asset("avatar-luna-artemi.png") },
];

export const BADGES: ArtEntry[] = [
  { id: "sailor-moon", name: "Сейлор Мун", src: asset("badge-sailor-moon.png") },
  { id: "sailor-mercury", name: "Сейлор Меркурий", src: asset("badge-sailor-mercury.png") },
  { id: "sailor-mars", name: "Сейлор Марс", src: asset("badge-sailor-mars.png") },
  { id: "sailor-venus", name: "Сейлор Венера", src: asset("badge-sailor-venus.png") },
  { id: "sailor-jupiter", name: "Сейлор Юпитер", src: asset("badge-sailor-jupiter.png") },
  { id: "sailor-saturn", name: "Сейлор Сатурн", src: asset("badge-sailor-saturn.png") },
  { id: "sailor-uranus", name: "Сейлор Уран", src: asset("badge-sailor-uranus.png") },
  { id: "sailor-neptune", name: "Сейлор Нептун", src: asset("badge-sailor-neptune.png") },
  { id: "sailor-pluto", name: "Сейлор Плутон", src: asset("badge-sailor-pluto.png") },
  { id: "sailor-chibi-moon", name: "Сейлор Чиби Мун", src: asset("badge-sailor-chibi-moon.png") },
  { id: "tuxedo-mask", name: "Такседо Маск", src: asset("badge-tuxedo-mask.png") },
  { id: "luna-artemis", name: "Луна и Артемис", src: asset("badge-luna-artemis.png") },
];

export const ASSETS = { reference: asset("reference.png") } as const;

export const POINTS = {
  paymentBase: 20,
  paymentOnTimeBonus: 10,
  readingBase: 12,
  readingOnTimeBonus: 8,
  threeTasksDailyBonus: 15,
  perfectMonthBonus: 100,
} as const;

export const REMINDER_DAYS = {
  paymentGentle: 10,
  paymentDayBefore: 14,
  paymentDue: 15,
  readingsGentle: 17,
  readingsDayBefore: 19,
  readingsDue: 20,
} as const;

export const MOODS = ["Вдохновлённо", "Спокойно", "Собранно", "Нейтрально", "Устало", "Немного тревожно"] as const;
export const MOOD_SYMBOLS = ["✦", "☾", "◇", "○", "⌁", "≈"] as const;

export const ENCOURAGEMENTS = [
  "Три дела уже позади — сегодня ты отлично держишь курс ✨",
  "Вот это темп! Три задачи закрыты, и день уже стал легче.",
  "Маленькие галочки складываются в большое спокойствие. Уже три!",
  "Ты только что навёл(а) порядок сразу в трёх делах. Красиво.",
  "Три шага сделаны. Можно на секунду почувствовать себя победителем 🌙",
  "Отличная серия: три завершённых дела подряд.",
  "Сегодняшний список заметно светлеет — уже три готово.",
  "Есть! Три задачи закрыты. Очень достойный прогресс.",
  "Ты не просто планируешь — ты завершаешь. Уже три раза сегодня.",
  "Три дела выполнены. Домашняя рутина сегодня явно на твоей стороне.",
  "Как приятно видеть три готовые задачи. Продолжай в своём ритме.",
  "Три пункта исчезли из списка забот. Отличная работа.",
  "Сегодня у порядка хорошие шансы на победу — три задачи уже готовы.",
  "Три завершения за день — это уже настоящий импульс.",
  "Хороший ритм: спокойно, последовательно, три дела сделаны.",
  "Три задачи закрыты. Ты здорово разгружаешь будущего себя.",
  "Ещё одна маленькая победа: счёт уже 3:0 в твою пользу ✨",
  "Ты собрал(а) три галочки — заслуженный момент удовлетворения.",
  "Список становится короче, а спокойствия больше. Уже три.",
  "Три дела завершены без лишнего шума. Вот это приятная эффективность.",
  "Сегодня ты уже трижды сказал(а) делам: «готово». Отлично.",
  "Три задачи выполнены — можно позволить себе довольную улыбку.",
  "Красивый прогресс: три пункта уже сияют статусом «готово».",
  "Ты поймал(а) хороший рабочий поток. Третья задача закрыта.",
  "Три завершённых дела — отличный вклад в спокойный месяц.",
  "Порядок собирается по одному действию. Сегодня их уже три.",
  "Три задачи готовы. Ты уверенно освобождаешь место для более приятных вещей.",
  "Сегодняшняя орбита стабильна: три дела успешно завершены 🌙",
  "Третья галочка на месте. Очень приятный момент — зафиксируем его.",
  "Три дела сделаны. Пусть дальше будет так же легко и спокойно.",
] as const;
