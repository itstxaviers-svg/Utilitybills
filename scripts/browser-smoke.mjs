const endpoint = await fetch("http://127.0.0.1:9222/json/new?http://127.0.0.1:5173", { method: "PUT" }).then((response) => response.json());
const socket = new WebSocket(endpoint.webSocketDebuggerUrl);
const pending = new Map();
let sequence = 0;

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  }
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
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};

await send("Runtime.enable");
await send("Page.enable");
await delay(1200);

const initial = await evaluate(`({
  title: document.title,
  utilities: document.querySelectorAll('[data-testid^="payment-"]').length,
  hasClock: /\\d{2}:\\d{2}:\\d{2}/.test(document.querySelector('.clock-inner strong')?.textContent || ''),
  hasFocusControls: /Старт|Пауза|Сброс таймера/.test(document.body.innerText)
})`);

await evaluate(`document.querySelector('[data-testid="payment-gas"] .row-action').click()`);
await delay(120);
const paymentDialog = await evaluate(`document.querySelector('[role="dialog"]')?.innerText.includes('Сколько оплатили?')`);
await evaluate(`(() => {
  const input = document.querySelector('.currency-input input');
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '1284,50');
  input.dispatchEvent(new Event('input', { bubbles: true }));
})()`);
await delay(80);
await evaluate(`[...document.querySelectorAll('button')].find((button) => button.textContent.includes('Сохранить оплату')).click()`);
await delay(350);
const afterPayment = await evaluate(`(() => {
  const state = JSON.parse(localStorage.getItem('focusTool.utilityPlanner.v2'));
  return { amount: state.ledgers[Object.keys(state.ledgers).sort().at(-1)].payments.gas.amountKopecks, totalVisible: document.body.innerText.includes('1 284,50 ₽') || document.body.innerText.includes('1 284,50 ₽') };
})()`);

await send("Page.reload", { ignoreCache: true });
await delay(1200);
const afterReload = await evaluate(`(() => {
  const state = JSON.parse(localStorage.getItem('focusTool.utilityPlanner.v2'));
  const month = Object.keys(state.ledgers).sort().at(-1);
  return { amount: state.ledgers[month].payments.gas.amountKopecks, paidStatus: document.querySelector('[data-testid="payment-gas"]')?.innerText.includes('Оплачено вовремя') };
})()`);

await evaluate(`document.querySelector('button[aria-label="Открыть профиль"]').click()`);
await delay(150);
const profile = await evaluate(`({ avatarChoices: document.querySelectorAll('.avatar-grid button').length, hasMoodChoices: document.querySelectorAll('.mood-grid button').length === 6, privacy: document.querySelector('[role="dialog"]')?.innerText.includes('Данные хранятся только в этом браузере') })`);
await evaluate(`document.querySelector('[role="dialog"] .modal-header button').click()`);
await delay(100);

await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await delay(250);
const mobile = await evaluate(`({
  noHorizontalScroll: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  stickyTimeVisible: getComputedStyle(document.querySelector('.mobile-time')).display !== 'none' && /\\d{2}:\\d{2}:\\d{2}/.test(document.querySelector('.mobile-time').innerText),
  paymentActionHeight: Math.round(document.querySelector('[data-testid="payment-hot-water"] .row-action').getBoundingClientRect().height),
  topbarLayout: [...document.querySelector('.topbar').children].map((node) => ({ className: node.className, rect: { x: Math.round(node.getBoundingClientRect().x), width: Math.round(node.getBoundingClientRect().width) }, text: node.innerText?.trim() }))
})`);

console.log(JSON.stringify({ initial, paymentDialog, afterPayment, afterReload, profile, mobile }, null, 2));
socket.close();
