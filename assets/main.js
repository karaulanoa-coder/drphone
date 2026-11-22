document.querySelector('.burger')?.addEventListener('click', () => {
  document.querySelector('.nav')?.classList.toggle('open');
});
document.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', () => {
  document.querySelector('.nav')?.classList.remove('open');
}));
document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
  document.querySelectorAll('.price-panel').forEach(p => p.hidden = p.id !== tab.dataset.target);
}));

// Форма "Заказать звонок" — отправляет заявку в Cloudflare Worker,
// который пересылает её владельцу в Telegram. Код воркера и инструкция
// по его настройке лежат в папке /worker. Замените адрес ниже на свой
// после деплоя воркера (https://<имя>.<ваш-поддомен>.workers.dev/notify).
const CALLBACK_ENDPOINT = 'https://REPLACE-ME.workers.dev/notify';

(() => {
  const form = document.getElementById('callback-form');
  if (!form) return;
  const status = document.getElementById('cb-status');
  const submitBtn = document.getElementById('cb-submit');
  const nameInput = form.querySelector('[name=name]');
  const phoneInput = form.querySelector('[name=phone]');
  const consentInput = form.querySelector('[name=consent]');
  const phonePattern = /^[\d\s()+-]{10,18}$/;

  function setError(field, message) {
    const input = form.querySelector(`[name=${field}]`);
    const errEl = form.querySelector(`.field-error[data-for=${field}]`);
    if (input) input.classList.toggle('invalid', !!message);
    if (errEl) errEl.textContent = message || '';
  }

  function validate() {
    let ok = true;
    if (!nameInput.value.trim()) { setError('name', 'Укажите, как к вам обращаться'); ok = false; }
    else setError('name', '');
    if (!phonePattern.test(phoneInput.value.trim())) { setError('phone', 'Проверьте номер телефона'); ok = false; }
    else setError('phone', '');
    if (!consentInput.checked) { ok = false; }
    return ok;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    status.className = 'form-status';
    if (!validate()) return;

    submitBtn.disabled = true;
    const prevLabel = submitBtn.textContent;
    submitBtn.textContent = 'Отправляем…';

    try {
      const res = await fetch(CALLBACK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput.value.trim(),
          phone: phoneInput.value.trim(),
          page: location.href
        })
      });
      if (!res.ok) throw new Error('bad status');
      if (window.ym) ym(114507236, 'reachGoal', 'callback_form');
      status.textContent = 'Заявка отправлена. Мы перезвоним в рабочее время.';
      status.className = 'form-status ok';
      form.reset();
    } catch (err) {
      status.textContent = 'Не получилось отправить. Позвоните нам или напишите в Telegram.';
      status.className = 'form-status err';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = prevLabel;
    }
  });
})();
