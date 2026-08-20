(function () {
  var TITLES = {
    about: { en: 'About — Cube Lab', ko: '소개 — Cube Lab' },
    terms: { en: 'Terms of Use — Cube Lab', ko: '이용약관 — Cube Lab' },
    privacy: { en: 'Privacy Policy — Cube Lab', ko: '개인정보 처리방침 — Cube Lab' },
    notfound: { en: '404 — Cube Lab', ko: '404 — Cube Lab' }
  };

  function readLang() {
    try {
      var saved = localStorage.getItem('cubeLang');
      if (saved === 'en' || saved === 'ko') return saved;
    } catch (e) { /* private mode */ }
    return 'en';
  }

  function apply(lang) {
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-lang', lang);
    var page = document.body.getAttribute('data-page');
    if (page && TITLES[page]) document.title = TITLES[page][lang];
    document.querySelectorAll('button[data-lang]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-lang') === lang ? 'true' : 'false');
    });
  }

  apply(readLang());

  document.querySelectorAll('button[data-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var lang = btn.getAttribute('data-lang');
      if (lang !== 'en' && lang !== 'ko') return;
      try { localStorage.setItem('cubeLang', lang); } catch (e) { /* private mode */ }
      apply(lang);
    });
  });
})();
