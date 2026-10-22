'use strict';
(function () {
  const config = window.MONEYPASS_CONFIG || {};
  let timer;
  window.moneyToast = function (message) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message; el.hidden = false;
    clearTimeout(timer); timer = setTimeout(() => { el.hidden = true; }, 5000);
  };
  window.moneyCopy = async function (text) {
    try {
      if (!navigator.clipboard) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(text); window.moneyToast('복사했습니다.'); return true;
    } catch (_) {
      document.getElementById('manual-copy')?.remove();
      const box = document.createElement('textarea');
      box.id = 'manual-copy'; box.className = 'copy-fallback'; box.value = text;
      box.setAttribute('aria-label','직접 복사할 내용'); box.readOnly = true;
      (document.querySelector('.article-actions') || document.querySelector('main')).appendChild(box);
      box.focus(); box.select(); window.moneyToast('자동 복사가 제한되어 있습니다. 선택된 내용을 직접 복사해 주세요.'); return false;
    }
  };
  document.querySelectorAll('[data-share]').forEach(button => button.addEventListener('click', () => window.moneyCopy(location.href)));
  const form = document.getElementById('contact-form');
  if (form) {
    const email = config.contactEmail || '';
    const valid = /^[^\s@?&]+@[^\s@?&]+\.[^\s@?&]+$/.test(email);
    document.getElementById('contact-send').disabled = !valid;
    document.getElementById('contact-status').textContent = valid ? `문의 이메일: ${email}` : '운영 이메일이 아직 설정되지 않았습니다. 문의 내용을 복사하거나 아래 GitHub 오류 제보를 이용해 주세요.';
    const message = () => `[머니패스 문의] ${document.getElementById('contact-subject').value}\n\n${document.getElementById('contact-message').value}\n\n페이지: ${location.href}`;
    document.getElementById('contact-copy').addEventListener('click', () => window.moneyCopy(message()));
    form.addEventListener('submit', event => {
      event.preventDefault(); if (!valid || !form.reportValidity()) return;
      const subject = document.getElementById('contact-subject').value, body = message();
      const feedback = document.getElementById('contact-feedback');
      if (body.length > 1800) { feedback.textContent = '내용이 길어 메일 앱 연결이 제한될 수 있습니다. 내용을 복사해 이메일로 보내 주세요.'; return; }
      location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      feedback.textContent = '메일 앱을 열도록 요청했습니다. 실제 발송은 메일 앱에서 완료해 주세요. 앱이 열리지 않으면 문의 내용을 복사해 보내 주세요.';
    });
  }
  const ads = config.adsense || {}, client = ads.client || '';
  let framed = true;
  try { framed = window.self !== window.top; } catch (_) { framed = true; }
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
  if (!/^ca-pub-\d{16}$/.test(client) || framed || local || !ads.autoAds) return;
  if (ads.loadScript && !document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
    const script = document.createElement('script'); script.async = true; script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`; document.head.appendChild(script);
  }
})();
