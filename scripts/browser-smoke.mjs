const port = 9224;
const baseUrl = "http://127.0.0.1:5173/Utilitybills/";
const page = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(baseUrl)}`, { method: "PUT" }).then((response) => response.json());
const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
let sequence = 0;

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  message.error ? reject(new Error(message.error.message)) : resolve(message.result);
});

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const evaluate = async (expression) => {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};
const clickByText = (text) => evaluate(`(() => { const node = [...document.querySelectorAll('button')].find((button) => button.textContent.trim().includes(${JSON.stringify(text)})); if (!node) throw new Error('Не найдена кнопка: ${text}'); node.click(); })()`);

await send("Runtime.enable");
await send("Page.enable");
await delay(900);
await evaluate(`localStorage.removeItem('focusTool.utilityPlanner.v2'); location.reload()`);
await delay(900);

const viewportResults = {};
for (const [label, width, height] of [["360x800", 360, 800], ["768x1024", 768, 1024], ["1280x720", 1280, 720], ["1440x900", 1440, 900], ["1920x1080", 1920, 1080]]) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  await delay(120);
  viewportResults[label] = await evaluate(`({
    noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    bodyLockedToViewport: document.body.scrollHeight <= innerHeight,
    appHeight: Math.round(document.querySelector('.app').getBoundingClientRect().height),
    dashboardInsideViewport: document.querySelector('.dashboard').getBoundingClientRect().bottom <= innerHeight,
    mobileNavigation: getComputedStyle(document.querySelector('.mobile-nav')).display !== 'none'
  })`);
}

await send("Emulation.setDeviceMetricsOverride", { width: 360, height: 800, deviceScaleFactor: 1, mobile: true });
await delay(100);
await clickByText("Показания");
await delay(80);
await clickByText("Выбрать счётчики");
await delay(80);
const meterPickerCount = await evaluate(`document.querySelectorAll('.meter-picker input').length`);
await clickByText("Сохранить");
await delay(380);
const meterState = await evaluate(`(() => { const state = JSON.parse(localStorage.getItem('focusTool.utilityPlanner.v2')); return { configured: state.meterSettings.configured, selected: state.ledgers[Object.keys(state.ledgers)[0]].requiredReadingIds, visibleRows: document.querySelectorAll('.reading-item').length, progress: document.querySelector('.mini-progress')?.innerText.trim() }; })()`);

await evaluate(`document.querySelector('button[aria-label="Открыть профиль"]').click()`);
await delay(100);
const profileInput = await evaluate(`(() => { const input = document.querySelector('.profile-modal input[autocomplete="name"]'); input.focus(); input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true })); return { scrollable: document.querySelector('.profile-modal').scrollHeight > document.querySelector('.profile-modal').clientHeight, overflowY: getComputedStyle(document.querySelector('.profile-modal')).overflowY }; })()`);
await send("Input.insertText", { text: "Вера быстро" });
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Backspace", code: "Backspace" });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Backspace", code: "Backspace" });
await send("Input.insertText", { text: "!" });
await evaluate(`document.querySelector('.profile-modal textarea').focus()`);
await send("Input.insertText", { text: "Быстрый ввод\nбез потери символов" });
await delay(900);
const profileDraft = await evaluate(`(() => { const state = JSON.parse(localStorage.getItem('focusTool.utilityPlanner.v2')); return { input: document.querySelector('.profile-modal input[autocomplete="name"]').value, textarea: document.querySelector('.profile-modal textarea').value, storedName: state.profile.name, storedThought: state.journals[Object.keys(state.journals)[0]].thought }; })()`);

await clickByText("Сбросить данные");
await delay(80);
const beforeFirstConfirmation = await evaluate(`localStorage.getItem('focusTool.utilityPlanner.v2')`);
await clickByText("Продолжить");
await delay(80);
const resetProtection = await evaluate(`({ title: document.querySelector('[role="dialog"] h2').textContent, disabledImmediately: [...document.querySelectorAll('button')].find((button) => button.textContent.includes('Да, удалить все данные')).disabled, dataUntouched: localStorage.getItem('focusTool.utilityPlanner.v2') === ${JSON.stringify(beforeFirstConfirmation)} })`);
await delay(850);
resetProtection.enabledAfterDelay = await evaluate(`![...document.querySelectorAll('button')].find((button) => button.textContent.includes('Да, удалить все данные')).disabled`);
await clickByText("Отмена");

await evaluate(`window.__paymentMutations = 0; window.__observer = new MutationObserver(() => window.__paymentMutations++); window.__observer.observe(document.querySelector('.payment-card'), { subtree: true, childList: true, characterData: true, attributes: true });`);
await delay(2200);
const isolatedClock = await evaluate(`window.__observer.disconnect(); window.__paymentMutations`);

const result = { viewportResults, meterPickerCount, meterState, profileInput, profileDraft, resetProtection, isolatedClock, utilities: await evaluate(`document.querySelectorAll('[data-testid^="payment-"]').length`) };
const failures = [];
for (const [label, item] of Object.entries(viewportResults)) {
  if (!item.noHorizontalOverflow || !item.bodyLockedToViewport || !item.dashboardInsideViewport || item.appHeight !== Number(label.split("x")[1])) failures.push(`viewport ${label}`);
  if ((Number(label.split("x")[0]) < 1024) !== item.mobileNavigation) failures.push(`navigation ${label}`);
}
if (meterPickerCount !== 4 || !meterState.configured || meterState.visibleRows !== 3 || meterState.progress !== "0 / 3") failures.push("meter settings");
if (!profileInput.scrollable || profileInput.overflowY !== "auto" || profileDraft.input !== "Вера быстро!" || profileDraft.input !== profileDraft.storedName || profileDraft.textarea !== profileDraft.storedThought) failures.push("profile input/autosave");
if (!resetProtection.disabledImmediately || !resetProtection.enabledAfterDelay || !resetProtection.dataUntouched) failures.push("double reset protection");
if (isolatedClock !== 0 || result.utilities !== 8) failures.push("isolated clock/core utilities");

console.log(JSON.stringify({ ok: failures.length === 0, failures, ...result }, null, 2));
socket.close();
if (failures.length) process.exitCode = 1;
