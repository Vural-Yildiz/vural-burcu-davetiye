(() => {
  'use strict';
  const form = document.getElementById('rsvpForm');
  const modal = document.getElementById('rsvp');
  const name = document.getElementById('rsvpName');
  const attendance = document.getElementById('rsvpAttendance');
  const count = document.getElementById('rsvpCount');
  const countField = document.getElementById('rsvpCountField');
  const note = document.getElementById('rsvpNote');
  const honey = document.getElementById('rsvpHoney');
  const send = document.getElementById('rsvpSend');
  const status = document.getElementById('rsvpStatus');
  let busy = false;
  let submitted = false;

  function syncCount() {
    const coming = attendance.value === 'Katılıyorum';
    countField.hidden = !coming;
    count.disabled = !coming;
    count.required = coming;
  }

  function showStatus(message, state) {
    status.textContent = message;
    status.dataset.state = state;
    status.hidden = false;
  }

  function changed() {
    if (busy) return;
    submitted = false;
    send.disabled = false;
    send.textContent = 'Yanıtımı Gönder';
    status.hidden = true;
  }

  attendance.addEventListener('change', () => {
    syncCount();
    changed();
  });
  form.addEventListener('input', changed);
  syncCount();

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || submitted || honey.value) return;
    name.value = name.value.trim();
    if (!form.reportValidity()) return;
    const coming = attendance.value === 'Katılıyorum';
    const people = coming ? Number(count.value) : 0;
    if (name.value.length < 2 || !['Katılıyorum', 'Katılamıyorum'].includes(attendance.value) ||
        (coming && (!Number.isInteger(people) || people < 1 || people > 20))) {
      showStatus('Lütfen adınızı ve katılım bilgilerinizi kontrol edin.', 'error');
      return;
    }

    const payload = {
      'Ad Soyad': name.value,
      'Katılım Durumu': attendance.value,
      'Kişi Sayısı': String(people),
      'Not': note.value.trim().slice(0, 500),
      'Etkinlik': 'Vural & Burcu Düğünü',
      'Tarih': '14 Kasım 2026',
      'Saat': '12:00–17:00 (Türkiye saati)',
      'Yer': 'Büyük Urartu Oteli, Van',
      '_subject': 'Vural & Burcu — Katılım Yanıtı',
      '_template': 'table',
      '_captcha': 'false',
      '_honey': '',
      '_url': 'https://vural-yildiz.github.io/vural-burcu-davetiye/'
    };
    busy = true;
    send.disabled = true;
    name.disabled = attendance.disabled = note.disabled = count.disabled = true;
    send.textContent = 'Gönderiliyor…';
    form.setAttribute('aria-busy', 'true');
    status.hidden = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const endpoint = form.action.replace('https://formsubmit.co/', 'https://formsubmit.co/ajax/');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new URLSearchParams(payload),
        signal: controller.signal
      });
      const result = await response.json();
      if (!response.ok || !(result.success === true || result.success === 'true')) {
        throw new Error('Submission was not accepted');
      }
      submitted = true;
      showStatus('Yanıtınız gönderildi. İlginiz için teşekkür ederiz.', 'success');
      send.textContent = 'Yanıtınız Gönderildi';
    } catch (_) {
      showStatus('Yanıtınızın gönderimi doğrulanamadı. Lütfen bağlantınızı kontrol edip tekrar deneyin.', 'error');
      send.textContent = 'Tekrar Dene';
    } finally {
      clearTimeout(timer);
      busy = false;
      name.disabled = attendance.disabled = note.disabled = false;
      syncCount();
      form.removeAttribute('aria-busy');
      send.disabled = submitted;
    }
  });

  function syncDialog() {
    const visible = window.location.hash === '#rsvp';
    modal.inert = !visible;
    modal.setAttribute('aria-hidden', String(!visible));
    if (visible) setTimeout(() => name.focus(), 60);
  }
  window.addEventListener('hashchange', syncDialog);
  document.addEventListener('keydown', event => {
    if (window.location.hash !== '#rsvp') return;
    if (event.key === 'Escape') {
      window.location.hash = '';
      document.querySelector('.actions .rsvp').focus();
    }
    if (event.key === 'Tab') {
      const elements = Array.from(modal.querySelectorAll('input,select,textarea,button,a')).filter(el => !el.disabled && !el.hidden && el.tabIndex >= 0 && el.type !== 'hidden');
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  syncDialog();
})();
