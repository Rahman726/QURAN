/* ==========================================================================
   Quran Pak — reader logic
   No build step, no dependencies. Data is local JSON, audio comes from the
   Islamic Network CDN.
   ========================================================================== */

(function () {
  'use strict';

  var STORAGE = {
    settings: 'quranpak.settings',
    lastRead: 'quranpak.lastRead',
    bookmarks: 'quranpak.bookmarks'
  };

  var ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  var BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
  var RECITER_AUDIO = 'https://cdn.islamic.network/quran/audio';
  var RECITERS = [
    {
      id: 'ar.alafasy', short: 'Alafasy', name: 'Mishary Rashid Alafasy', arabic: 'مشاري راشد العفاسي',
      base: RECITER_AUDIO + '/128/ar.alafasy', photo: 'assets/reciters/alafasy.jpg'
    },
    {
      id: 'ar.abdulbasitmurattal', short: 'Abdul Basit', name: 'Abdul Basit (Murattal)', arabic: 'عبد الباسط عبد الصمد',
      base: RECITER_AUDIO + '/192/ar.abdulbasitmurattal', photo: 'assets/reciters/abdulbasit.jpg'
    },
    {
      id: 'ar.husary', short: 'Al-Husary', name: 'Mahmoud Khalil Al-Husary', arabic: 'محمود خليل الحصري',
      base: RECITER_AUDIO + '/128/ar.husary', photo: 'assets/reciters/husary.png'
    },
    {
      id: 'ar.minshawi', short: 'El-Minshawi', name: 'Mohamed Siddiq El-Minshawi', arabic: 'محمد صديق المنشاوي',
      base: RECITER_AUDIO + '/128/ar.minshawi', photo: 'assets/reciters/minshawi.jpg'
    },
    {
      id: 'ar.abdurrahmaansudais', short: 'As-Sudais', name: 'Abdur-Rahman As-Sudais', arabic: 'عبدالرحمن السديس',
      base: RECITER_AUDIO + '/192/ar.abdurrahmaansudais', photo: 'assets/reciters/sudais.jpg'
    }
  ];
  var TRANSLATION_AUDIO = {
    en: { base: 'https://cdn.islamic.network/quran/audio/192/en.walk', name: 'English · Ibrahim Walk' },
    ur: { base: 'https://cdn.islamic.network/quran/audio/64/ur.khan', name: 'اردو · شمشاد علی خان' }
  };
  var THEMES = ['light', 'sepia', 'dark'];
  var SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

  var icons = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.2v13.6a1 1 0 0 0 1.53.85l10.2-6.8a1 1 0 0 0 0-1.7L9.53 4.35A1 1 0 0 0 8 5.2Z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="7" y="4.5" width="3.6" height="15" rx="1"/><rect x="13.4" y="4.5" width="3.6" height="15" rx="1"/></svg>',
    bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 4h11a.5.5 0 0 1 .5.5V20l-6-4-6 4V4.5a.5.5 0 0 1 .5-.5Z"/></svg>',
    bookmarkFilled: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.5 3.5h11a1 1 0 0 1 1 1V21l-6.5-4.33L5.5 21V4.5a1 1 0 0 1 1-1Z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 6.5C10.5 5.2 8.6 4.5 6.5 4.35v13.6c2.1.15 4 .85 5.5 2.2 1.5-1.35 3.4-2.05 5.5-2.2V4.35c-2.1.15-4 .85-5.5 2.15Z"/><path d="M12 6.5v13.65" stroke-linecap="round"/></svg>',
    chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 5 7.5 12l7 7"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9.5 5 7 7-7 7"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/></svg>'
  };

  function $(id) { return document.getElementById(id); }
  function all(selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); }
  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function toArabicDigits(number) {
    return String(number).split('').map(function (digit) { return ARABIC_DIGITS[Number(digit)]; }).join('');
  }

  function normalizeSearch(value) {
    return String(value)
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
      .replace(/[إأآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .trim();
  }

  var state = {
    surahs: [],
    surah: null,
    settings: { theme: 'light', translation: 'en', arabicSize: 34, speed: 1, reciter: 'ar.alafasy' },
    bookmarks: [],
    search: '',
    tab: 'surahs',
    currentAyah: null,
    continueListen: false,
    continueTranslation: false,
    audioPhase: 'arabic',
    loadToken: 0
  };

  var cache = new Map();
  var audio = new Audio();
  audio.preload = 'auto';

  /* ---------- storage helpers ------------------------------------------ */

  function readStorage(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      /* storage may be unavailable — reading still works */
    }
  }

  function loadSettings() {
    var saved = readStorage(STORAGE.settings, null) || {};
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    state.settings = {
      theme: THEMES.indexOf(saved.theme) !== -1 ? saved.theme : (prefersDark ? 'dark' : 'light'),
      translation: ['en', 'ur', 'none'].indexOf(saved.translation) !== -1 ? saved.translation : 'en',
      arabicSize: clamp(Number(saved.arabicSize) || 34, 22, 60),
      speed: SPEEDS.indexOf(Number(saved.speed)) !== -1 ? Number(saved.speed) : 1,
      reciter: RECITERS.some(function (item) { return item.id === saved.reciter; })
        ? saved.reciter
        : RECITERS[0].id
    };
  }

  function saveSettings() {
    writeStorage(STORAGE.settings, state.settings);
  }

  function loadBookmarks() {
    var saved = readStorage(STORAGE.bookmarks, []);
    state.bookmarks = Array.isArray(saved)
      ? saved.filter(function (item) {
          return item && Number.isInteger(item.surah) && Number.isInteger(item.ayah);
        })
      : [];
  }

  function saveLastRead(surahNumber, ayahNumber) {
    writeStorage(STORAGE.lastRead, { surah: surahNumber, ayah: ayahNumber });
  }

  function isBookmarked(surahNumber, ayahNumber) {
    return state.bookmarks.some(function (item) {
      return item.surah === surahNumber && item.ayah === ayahNumber;
    });
  }

  /* ---------- data ----------------------------------------------------- */

  function fetchJson(url) {
    if (cache.has(url)) return cache.get(url);
    var request = fetch(url).then(function (response) {
      if (!response.ok) throw new Error('Request failed with status ' + response.status);
      return response.json();
    });
    cache.set(url, request);
    request.catch(function () { cache.delete(url); });
    return request;
  }

  function surahUrl(number) {
    return 'data/surahs/' + String(number).padStart(3, '0') + '.json';
  }

  /* ---------- initialisation ------------------------------------------- */

  function init() {
    loadSettings();
    loadBookmarks();
    applyTheme();
    applyFontSize();
    $('translation-select').value = state.settings.translation;
    applyAudioSpeed();
    renderReciterMenu();
    updateReciterUI();
    updateContinueButton();
    bindEvents();
    initAuth();
    updateBookmarkCount();
    renderBookmarks();
    bootstrap();
  }

  async function bootstrap() {
    try {
      state.surahs = await fetchJson('data/surahs.json');
    } catch (error) {
      renderFatal('Could not load the Quran data.', error);
      return;
    }

    renderSurahList();

    var route = parseHash();
    if (route) {
      openSurah(route.surah, route.ayah || 1);
      return;
    }

    var last = readStorage(STORAGE.lastRead, null);
    var target = last && Number.isInteger(last.surah) && last.surah >= 1 && last.surah <= 114
      ? last
      : { surah: 1, ayah: 1 };
    var ayah = Number.isInteger(target.ayah) ? target.ayah : 1;

    history.replaceState(null, '', '#/surah/' + target.surah + '/' + ayah);
    openSurah(target.surah, ayah);
  }

  /* ---------- routing -------------------------------------------------- */

  function parseHash() {
    var match = /^#\/surah\/(\d{1,3})(?:\/(\d{1,3}))?\/?$/.exec(window.location.hash);
    if (!match) return null;
    var surah = Number(match[1]);
    if (surah < 1 || surah > 114) return null;
    return { surah: surah, ayah: match[2] ? Number(match[2]) : 1 };
  }

  function onHashChange() {
    var route = parseHash();
    if (route) openSurah(route.surah, route.ayah || 1);
  }

  /* ---------- opening a surah ------------------------------------------ */

  async function openSurah(number, ayah) {
    number = Number(number);
    ayah = Number(ayah) || 1;
    if (!Number.isInteger(number) || number < 1 || number > 114) return;

    stopPlayback();
    closeRecite();
    setSidebar(false);

    var token = ++state.loadToken;
    showLoader();

    var data;
    try {
      data = await fetchJson(surahUrl(number));
    } catch (error) {
      if (token === state.loadToken) renderFatal('Could not load this surah.', error);
      return;
    }

    if (token !== state.loadToken) return;

    state.surah = data;
    var targetAyah = clamp(Math.floor(ayah), 1, data.ayahCount);

    renderSurah(data, targetAyah);
    updateTopbar(data);
    markActiveSurah(number);
    saveLastRead(number, targetAyah);
    document.title = 'Surah ' + data.englishName + ' — Quran Pak';

    // Keep the sidebar selection in view inside its own scroll container.
    var active = document.querySelector('.surah-item.is-active');
    if (active && active.scrollIntoView) {
      active.scrollIntoView({ block: 'nearest' });
    }
  }

  /* ---------- rendering ------------------------------------------------ */

  function showLoader() {
    $('content').innerHTML = '<div class="loading" role="status"><span class="spinner" aria-hidden="true"></span><p>Opening the Quran…</p></div>';
  }

  function renderFatal(title, error) {
    console.error(error);
    $('topbar-name').textContent = 'Unavailable';
    $('content').innerHTML =
      '<div class="error-panel">' +
        '<h2>' + escapeHtml(title) + '</h2>' +
        '<p>Quran Pak reads its text from local files, which browsers refuse to load from a <code>file://</code> page.</p>' +
        '<p>Start a small local server inside the project folder, then reload:</p>' +
        '<code>npx serve .</code>' +
      '</div>';
  }

  function renderSurah(surah, targetAyah) {
    var firstJuz = surah.ayahs[0] ? surah.ayahs[0].juz : null;

    var html =
      '<section class="surah-header">' +
        '<p class="surah-eyebrow">Surah ' + surah.number + '</p>' +
        '<h2 class="surah-arabic-name" dir="rtl" lang="ar">' + escapeHtml(surah.name) + '</h2>' +
        '<p class="surah-english">' + escapeHtml(surah.englishName) + ' <span>· ' + escapeHtml(surah.englishNameTranslation) + '</span></p>' +
        '<div class="surah-chips">' +
          '<span class="chip">' + icons.book + ' ' + surah.ayahCount + ' Ayahs</span>' +
          '<span class="chip">' + escapeHtml(surah.revelationType === 'Meccan' ? 'Makki' : 'Madani') + '</span>' +
          (firstJuz ? '<span class="chip">Juz ' + firstJuz + '</span>' : '') +
        '</div>' +
        '<div class="recite-launch-row">' +
          '<button type="button" class="recite-launch" data-recite-open>' +
            icons.mic +
            '<span>Recite &amp; check</span>' +
            '<small>AI checks your recitation</small>' +
          '</button>' +
          '<button type="button" class="recite-launch secondary" data-recite-surah>' +
            icons.mic +
            '<span>Recite full surah</span>' +
            '<small>Rated out of 100</small>' +
          '</button>' +
        '</div>' +
      '</section>' +
      (surah.bismillah ? '<p class="bismillah" dir="rtl" lang="ar">' + BISMILLAH + '</p>' : '') +
      '<div class="ayahs">' + surah.ayahs.map(function (item) { return renderAyah(surah, item); }).join('') + '</div>' +
      renderSurahNav(surah);

    $('content').innerHTML = html;

    if (targetAyah > 1) {
      requestAnimationFrame(function () {
        var node = document.getElementById('ayah-' + targetAyah);
        if (!node) return;
        node.scrollIntoView({ block: 'center' });
        node.classList.add('is-flash');
        setTimeout(function () { node.classList.remove('is-flash'); }, 2100);
      });
    } else {
      window.scrollTo(0, 0);
    }
  }

  function translationHtml(ayah) {
    if (state.settings.translation === 'ur') {
      return '<p class="ayah-translation translation-ur" dir="rtl" lang="ur">' + escapeHtml(ayah.ur) + '</p>';
    }
    if (state.settings.translation === 'en') {
      return '<p class="ayah-translation" lang="en">' + escapeHtml(ayah.en) + '</p>';
    }
    return '';
  }

  function renderAyah(surah, ayah) {
    var bookmarked = isBookmarked(surah.number, ayah.n);
    return '<article class="ayah" id="ayah-' + ayah.n + '" data-ayah="' + ayah.n + '" data-global="' + ayah.g + '">' +
      '<p class="ayah-arabic" dir="rtl" lang="ar">' + escapeHtml(ayah.text) +
        '<span class="ayah-number" aria-hidden="true">' + toArabicDigits(ayah.n) + '</span>' +
      '</p>' +
      translationHtml(ayah) +
      '<div class="ayah-tools">' +
        '<button type="button" class="tool-btn" data-action="play" data-ayah="' + ayah.n + '" aria-label="Listen to ayah ' + ayah.n + '">' +
          icons.play + '<span>Listen</span>' +
        '</button>' +
        '<button type="button" class="tool-btn" data-action="recite" data-ayah="' + ayah.n + '" aria-label="Recite ayah ' + ayah.n + ' and check your mistakes">' +
          icons.mic + '<span>Recite</span>' +
        '</button>' +
        '<button type="button" class="tool-btn bookmark-btn' + (bookmarked ? ' is-active' : '') + '" data-action="bookmark" data-ayah="' + ayah.n + '" aria-pressed="' + bookmarked + '" aria-label="' + (bookmarked ? 'Remove bookmark' : 'Bookmark') + ' for ayah ' + ayah.n + '">' +
          (bookmarked ? icons.bookmarkFilled : icons.bookmark) + '<span>' + (bookmarked ? 'Saved' : 'Save') + '</span>' +
        '</button>' +
      '</div>' +
    '</article>';
  }

  function renderSurahNav(surah) {
    var previous = surah.number > 1 ? state.surahs[surah.number - 2] : null;
    var next = surah.number < 114 ? state.surahs[surah.number] : null;

    function button(item, direction) {
      if (!item) return '<span class="surah-nav-btn ' + direction + ' disabled" aria-hidden="true"></span>';
      var icon = direction === 'prev' ? icons.chevronLeft : icons.chevronRight;
      var label = direction === 'prev' ? 'Previous' : 'Next';
      var content = direction === 'prev'
        ? '<span class="dir">' + icon + label + '</span>'
        : '<span class="dir">' + label + icon + '</span>';
      return '<a class="surah-nav-btn ' + direction + '" href="#/surah/' + item.number + '">' +
        content +
        '<span class="name">' + escapeHtml(item.englishName) + ' · ' + item.ayahCount + ' ayahs</span>' +
      '</a>';
    }

    return '<nav class="surah-nav" aria-label="Surah navigation">' + button(previous, 'prev') + button(next, 'next') + '</nav>';
  }

  function updateTopbar(surah) {
    $('topbar-eyebrow').textContent = 'Surah ' + surah.number + ' · ' + (surah.revelationType === 'Meccan' ? 'Makki' : 'Madani');
    $('topbar-name').textContent = surah.englishName + ' · ' + surah.englishNameTranslation;
  }

  function renderSurahList() {
    var query = normalizeSearch(state.search);
    var matches = state.surahs.filter(function (surah) {
      if (!query) return true;
      return normalizeSearch(surah.englishName).indexOf(query) !== -1 ||
        normalizeSearch(surah.englishNameTranslation).indexOf(query) !== -1 ||
        normalizeSearch(surah.name).indexOf(query) !== -1 ||
        String(surah.number) === query;
    });

    if (!matches.length) {
      $('surah-list').innerHTML = '<li class="empty-state">' + icons.book +
        '<strong>No surahs found</strong><p>Try another name, meaning or number.</p></li>';
      return;
    }

    $('surah-list').innerHTML = matches.map(function (surah) {
      return '<li>' +
        '<a class="surah-item" href="#/surah/' + surah.number + '" data-number="' + surah.number + '">' +
          '<span class="surah-index">' + surah.number + '</span>' +
          '<span class="surah-names">' +
            '<span class="surah-name">' + escapeHtml(surah.englishName) + '</span>' +
            '<span class="surah-sub">' + escapeHtml(surah.englishNameTranslation) + ' · ' + surah.ayahCount + ' ayahs</span>' +
          '</span>' +
          '<span class="surah-arabic" dir="rtl" lang="ar">' + escapeHtml(surah.name) + '</span>' +
        '</a>' +
      '</li>';
    }).join('');

    if (state.surah) markActiveSurah(state.surah.number);
  }

  function markActiveSurah(number) {
    all('.surah-item').forEach(function (item) {
      var active = Number(item.dataset.number) === number;
      item.classList.toggle('is-active', active);
      if (active) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
  }

  function renderBookmarks() {
    var list = $('bookmark-list');
    if (!state.bookmarks.length) {
      list.innerHTML = '<li class="empty-state">' + icons.bookmark +
        '<strong>No bookmarks yet</strong><p>Press “Save” beneath any ayah to keep it here.</p></li>';
      return;
    }

    list.innerHTML = state.bookmarks.map(function (bookmark) {
      return '<li class="bookmark-item">' +
        '<a class="bookmark-link" href="#/surah/' + bookmark.surah + '/' + bookmark.ayah + '">' +
          '<span class="bookmark-title">' + escapeHtml(bookmark.surahName || ('Surah ' + bookmark.surah)) +
            ' <span class="badge">Ayah ' + bookmark.ayah + '</span></span>' +
          '<span class="bookmark-snippet">' + escapeHtml(bookmark.snippet || '') + '</span>' +
        '</a>' +
        '<button type="button" class="bookmark-remove" data-remove="' + bookmark.surah + ':' + bookmark.ayah + '" aria-label="Remove bookmark">' +
          icons.close +
        '</button>' +
      '</li>';
    }).join('');
  }

  function updateBookmarkCount() {
    $('bookmark-count').textContent = String(state.bookmarks.length);
  }

  /* ---------- bookmarks ------------------------------------------------ */

  function toggleBookmark(surah, ayah) {
    var index = state.bookmarks.findIndex(function (item) {
      return item.surah === surah.number && item.ayah === ayah.n;
    });

    if (index >= 0) {
      state.bookmarks.splice(index, 1);
    } else {
      state.bookmarks.unshift({
        surah: surah.number,
        surahName: surah.englishName,
        ayah: ayah.n,
        snippet: ayah.en || ayah.text
      });
      if (state.bookmarks.length > 250) state.bookmarks.length = 250;
    }

    writeStorage(STORAGE.bookmarks, state.bookmarks);
    renderBookmarks();
    updateBookmarkCount();
    refreshBookmarkButtons();
    showToast(index >= 0 ? 'Bookmark removed' : 'Saved ' + surah.englishName + ' · Ayah ' + ayah.n);
  }

  function refreshBookmarkButtons() {
    if (!state.surah) return;
    all('.bookmark-btn').forEach(function (button) {
      var ayahNumber = Number(button.dataset.ayah);
      var bookmarked = isBookmarked(state.surah.number, ayahNumber);
      button.classList.toggle('is-active', bookmarked);
      button.setAttribute('aria-pressed', String(bookmarked));
      button.setAttribute('aria-label', (bookmarked ? 'Remove bookmark' : 'Bookmark') + ' for ayah ' + ayahNumber);
      button.innerHTML = (bookmarked ? icons.bookmarkFilled : icons.bookmark) +
        '<span>' + (bookmarked ? 'Saved' : 'Save') + '</span>';
    });
  }

  /* ---------- translation & settings ----------------------------------- */

  function updateTranslations() {
    if (!state.surah) return;
    all('.ayah').forEach(function (article) {
      var ayahNumber = Number(article.dataset.ayah);
      var ayah = state.surah.ayahs.find(function (item) { return item.n === ayahNumber; });
      if (!ayah) return;

      var existing = article.querySelector('.ayah-translation');
      if (existing) existing.remove();

      var html = translationHtml(ayah);
      if (!html) return;

      var holder = document.createElement('div');
      holder.innerHTML = html;
      var node = holder.firstElementChild;
      var tools = article.querySelector('.ayah-tools');
      article.insertBefore(node, tools);
    });
  }

  function applyTheme() {
    document.documentElement.dataset.theme = state.settings.theme;
    var button = $('theme-btn');
    button.innerHTML = state.settings.theme === 'dark' ? icons.moon : icons.sun;
    button.setAttribute('aria-label', 'Theme: ' + state.settings.theme + '. Change theme');
    button.title = 'Theme: ' + state.settings.theme;
  }

  function applyFontSize() {
    document.documentElement.style.setProperty('--arabic-size', state.settings.arabicSize + 'px');
  }

  function cycleTheme() {
    var index = THEMES.indexOf(state.settings.theme);
    state.settings.theme = THEMES[(index + 1) % THEMES.length];
    applyTheme();
    saveSettings();
  }

  function changeFontSize(delta) {
    state.settings.arabicSize = clamp(state.settings.arabicSize + delta, 22, 60);
    applyFontSize();
    saveSettings();
  }

  /* ---------- sidebar -------------------------------------------------- */

  function setSidebar(open) {
    document.body.classList.toggle('sidebar-open', open);
    $('menu-btn').setAttribute('aria-expanded', String(open));
    if (open) {
      var search = $('surah-search');
      if (window.innerWidth <= 980) {
        setTimeout(function () { search.focus(); }, 280);
      }
    }
  }

  function setTab(tab) {
    state.tab = tab;
    all('.tab').forEach(function (button) {
      var active = button.dataset.tab === tab;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    $('surah-list').hidden = tab !== 'surahs';
    $('bookmark-list').hidden = tab !== 'bookmarks';
    document.querySelector('.search-box').hidden = tab !== 'surahs';
  }

  /* ---------- audio ---------------------------------------------------- */

  function resumeAudio() {
    var attempt = audio.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(function () {
        showToast('Recitation could not start. Check your internet connection.');
      });
    }
  }

  function playAyah(ayah) {
    if (!state.surah) return;

    state.currentAyah = ayah;
    state.audioPhase = 'arabic';
    audio.src = currentReciter().base + '/' + ayah.g + '.mp3';
    audio.playbackRate = state.settings.speed;
    resumeAudio();

    $('player-title').textContent = state.surah.englishName + ' · Ayah ' + ayah.n;
    $('player-sub').textContent = currentReciter().name;
    highlightCurrentAyah();
    syncPlayer();
    saveLastRead(state.surah.number, ayah.n);
  }

  function toggleAyah(ayah) {
    if (state.currentAyah && state.currentAyah.n === ayah.n) {
      if (audio.paused) resumeAudio();
      else audio.pause();
      return;
    }
    playAyah(ayah);
  }

  function togglePlayer() {
    if (!state.currentAyah) return;
    if (audio.paused) resumeAudio();
    else audio.pause();
  }

  function currentReciter() {
    return RECITERS.find(function (item) { return item.id === state.settings.reciter; }) || RECITERS[0];
  }

  function renderReciterMenu() {
    $('reciter-menu').innerHTML = RECITERS.map(function (reciter) {
      return '<button type="button" class="continue-option reciter-option" data-reciter="' + reciter.id + '" role="menuitemradio" aria-checked="false">' +
        '<img class="reciter-photo" src="' + reciter.photo + '" width="38" height="38" alt="" loading="lazy">' +
        '<span class="opt-text"><strong>' + escapeHtml(reciter.name) + '</strong>' +
        '<small>' + escapeHtml(reciter.arabic) + '</small></span>' +
        '<svg class="continue-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>' +
        '</button>';
    }).join('');
  }

  function updateReciterUI() {
    var reciter = currentReciter();
    $('reciter-btn-photo').src = reciter.photo;
    $('reciter-btn-label').textContent = reciter.short;
    $('reciter-btn').title = 'Reciter: ' + reciter.name;

    all('#reciter-menu [data-reciter]').forEach(function (option) {
      var active = option.dataset.reciter === reciter.id;
      option.classList.toggle('is-checked', active);
      option.setAttribute('aria-checked', String(active));
    });

    if (state.currentAyah && state.audioPhase === 'arabic') {
      $('player-sub').textContent = reciter.name;
    }
  }

  function closeReciterMenu() {
    $('reciter-menu').hidden = true;
    $('reciter-btn').setAttribute('aria-expanded', 'false');
  }

  function toggleReciterMenu() {
    var menu = $('reciter-menu');
    if (menu.hidden) {
      closeContinueMenu();
      menu.hidden = false;
      $('reciter-btn').setAttribute('aria-expanded', 'true');
    } else {
      closeReciterMenu();
    }
  }

  function selectReciter(id) {
    if (!RECITERS.some(function (item) { return item.id === id; })) return;
    state.settings.reciter = id;
    saveSettings();
    closeReciterMenu();
    updateReciterUI();

    if (state.currentAyah && state.audioPhase === 'arabic') {
      if (audio.paused) {
        audio.src = currentReciter().base + '/' + state.currentAyah.g + '.mp3';
      } else {
        playAyah(state.currentAyah);
      }
    }
    showToast('Reciter: ' + currentReciter().name);
  }

  function applyAudioSpeed() {
    audio.playbackRate = state.settings.speed;
    $('speed-select').value = String(state.settings.speed);
  }

  function translationTrack() {
    return TRANSLATION_AUDIO[state.settings.translation] || TRANSLATION_AUDIO.en;
  }

  function playTranslation(ayah) {
    if (!state.surah) return;
    var track = translationTrack();
    state.audioPhase = 'translation';
    audio.src = track.base + '/' + ayah.g + '.mp3';
    audio.playbackRate = state.settings.speed;
    resumeAudio();

    $('player-title').textContent = state.surah.englishName + ' · Ayah ' + ayah.n;
    $('player-sub').textContent = 'Translation · ' + track.name;
    syncPlayer();
  }

  function closeContinueMenu() {
    $('continue-menu').hidden = true;
    $('continue-btn').setAttribute('aria-expanded', 'false');
  }

  function toggleContinueMenu() {
    var menu = $('continue-menu');
    if (menu.hidden) {
      menu.hidden = false;
      $('continue-btn').setAttribute('aria-expanded', 'true');
    } else {
      closeContinueMenu();
    }
  }

  function updateContinueMenuLabel() {
    $('continue-lang').textContent = translationTrack().name;
  }

  function updateContinueButton() {
    var button = $('continue-btn');
    button.classList.toggle('is-active', state.continueListen);
    button.setAttribute('aria-pressed', String(state.continueListen));
    button.setAttribute('aria-label', state.continueListen
      ? 'Continue listen on. Open options'
      : 'Continue listen off. Open options');
    button.title = state.continueListen
      ? 'Continue listen: on (whole surah)'
      : 'Continue listen: choose how the surah plays';

    all('.continue-option[data-mode]').forEach(function (option) {
      var mode = option.dataset.mode;
      if (mode === 'off') return;
      var checked = state.continueListen &&
        (mode === 'translation') === state.continueTranslation;
      option.classList.toggle('is-checked', checked);
      option.setAttribute('aria-checked', String(checked));
    });
    $('continue-off').hidden = !state.continueListen;
    updateContinueMenuLabel();
  }

  function activateContinue(mode) {
    state.continueListen = true;
    state.continueTranslation = mode === 'translation';
    updateContinueButton();
    closeContinueMenu();

    if (state.currentAyah) {
      if (audio.paused) resumeAudio();
    } else if (state.surah && state.surah.ayahs.length) {
      playAyah(state.surah.ayahs[0]);
    }

    showToast(state.continueTranslation
      ? 'Continue listen with translation — ayah, translation, then the next ayah'
      : 'Continue listen — the whole surah will play');
  }

  function deactivateContinue() {
    state.continueListen = false;
    state.continueTranslation = false;
    updateContinueButton();
    closeContinueMenu();
    showToast('Continue listen off — only the selected ayah plays');
  }

  function playNextAyah() {
    if (!state.surah || !state.currentAyah) {
      stopPlayback();
      return;
    }
    var next = state.surah.ayahs.find(function (item) {
      return item.n === state.currentAyah.n + 1;
    });
    if (next) playAyah(next);
    else stopPlayback();
  }

  function stopPlayback() {
    state.currentAyah = null;
    state.audioPhase = 'arabic';
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    $('player').hidden = true;
    $('player-bar').style.width = '0%';
    $('player-title').textContent = '—';
    all('.ayah.playing').forEach(function (node) { node.classList.remove('playing'); });
  }

  function syncPlayer() {
    var visible = Boolean(state.currentAyah);
    $('player').hidden = !visible;
    if (!visible) return;

    $('player-toggle').innerHTML = audio.paused ? icons.play : icons.pause;
    $('player-toggle').setAttribute('aria-label', audio.paused ? 'Play recitation' : 'Pause recitation');
  }

  function updateProgress() {
    if (!state.currentAyah || !isFinite(audio.duration) || audio.duration <= 0) return;
    $('player-bar').style.width = ((audio.currentTime / audio.duration) * 100).toFixed(2) + '%';
  }

  function highlightCurrentAyah() {
    all('.ayah.playing').forEach(function (node) { node.classList.remove('playing'); });
    if (!state.currentAyah) return;
    var current = document.querySelector('.ayah[data-ayah="' + state.currentAyah.n + '"]');
    if (current) current.classList.add('playing');
  }

  /* ---------- recitation checker --------------------------------------- */

  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  var ARABIC_MARKS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;

  var recite = {
    ayah: null,
    mode: 'ayah',
    groups: null,
    restarts: 0,
    index: -1,
    tokens: [],
    recognition: null,
    listening: false,
    finalText: '',
    interimText: ''
  };

  function normalizeArabicWord(word) {
    return String(word)
      .replace(ARABIC_MARKS, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/[^\u0600-\u06FF]/g, '')
      .trim();
  }

  function alignWords(reference, heard) {
    var rows = reference.length + 1;
    var cols = heard.length + 1;
    var dp = [];
    var i;
    var j;

    for (i = 0; i < rows; i++) {
      dp.push(new Array(cols));
      dp[i][0] = i;
    }
    for (j = 0; j < cols; j++) dp[0][j] = j;

    for (i = 1; i < rows; i++) {
      for (j = 1; j < cols; j++) {
        var same = reference[i - 1] === heard[j - 1];
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + (same ? 0 : 1)
        );
      }
    }

    var ops = [];
    i = reference.length;
    j = heard.length;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0) {
        var cost = reference[i - 1] === heard[j - 1] ? 0 : 1;
        if (dp[i][j] === dp[i - 1][j - 1] + cost) {
          ops.push({ type: cost === 0 ? 'match' : 'sub', ref: i - 1, heard: j - 1 });
          i--;
          j--;
          continue;
        }
      }
      if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
        ops.push({ type: 'del', ref: i - 1 });
        i--;
      } else {
        ops.push({ type: 'ins', heard: j - 1 });
        j--;
      }
    }
    return ops.reverse();
  }

  function tokenizeAyah(ayah) {
    return ayah.text.split(/\s+/).map(function (word) {
      return { display: word, norm: normalizeArabicWord(word) };
    }).filter(function (token) { return token.norm; });
  }

  function startReciteSession() {
    recite.finalText = '';
    recite.interimText = '';
    recite.restarts = 0;
    $('recite-result').hidden = true;
    $('recite-score').innerHTML = '';
    $('recite-notes').innerHTML = '';

    if (!audio.paused) audio.pause();

    var supported = Boolean(SpeechRecognition);
    $('recite-mic').disabled = !supported;
    $('recite-mic').classList.remove('is-listening');
    $('recite-mic-label').textContent = recite.mode === 'surah' ? 'Start reciting the surah' : 'Start reciting';
    $('recite-hint').textContent = supported
      ? (recite.mode === 'surah'
        ? 'Recite the surah in order. Tap the button again when you finish to get a score out of 100.'
        : 'Your browser transcribes your voice. Works best in Chrome or Edge on localhost or https.')
      : 'Speech recognition is not available in this browser. Try Chrome or Edge.';

    $('recite-modal').hidden = false;
    $('recite-mic').focus();
  }

  function openRecite(ayah) {
    if (!state.surah) return;
    if (recite.listening) stopListening();

    recite.mode = 'ayah';
    recite.groups = null;
    recite.ayah = ayah;
    recite.index = state.surah.ayahs.indexOf(ayah);
    recite.tokens = tokenizeAyah(ayah);

    $('recite-title').textContent = state.surah.englishName + ' · Ayah ' + ayah.n;
    $('recite-ayah').textContent = 'Ayah ' + ayah.n + ' of ' + state.surah.ayahs.length;
    $('recite-prev').disabled = recite.index <= 0;
    $('recite-next').disabled = recite.index >= state.surah.ayahs.length - 1;
    $('recite-nav').classList.remove('is-surah');
    $('recite-listen').hidden = false;
    $('recite-ref').classList.remove('is-surah');
    $('recite-ref').innerHTML = recite.tokens.map(function (token) {
      return '<span class="recite-word">' + escapeHtml(token.display) + '</span>';
    }).join(' ');
    $('recite-heard').textContent = 'Tap the mic and recite this ayah out loud — the words you get wrong will be highlighted.';

    startReciteSession();
  }

  function openSurahRecite() {
    if (!state.surah) return;
    if (recite.listening) stopListening();

    recite.mode = 'surah';
    recite.ayah = null;
    recite.index = 0;
    recite.tokens = null;
    recite.groups = state.surah.ayahs.map(function (item) {
      var tokens = tokenizeAyah(item);
      return {
        ayah: item,
        tokens: tokens,
        norm: tokens.map(function (token) { return token.norm; })
      };
    }).filter(function (group) { return group.norm.length; });

    $('recite-title').textContent = state.surah.englishName + ' · Full surah';
    $('recite-ayah').textContent = recite.groups.length + ' ayahs';
    $('recite-nav').classList.add('is-surah');
    $('recite-listen').hidden = true;
    $('recite-ref').classList.add('is-surah');
    $('recite-ref').innerHTML = recite.groups.map(function (group) {
      return '<p class="recite-surah-ayah" data-ayah="' + group.ayah.n + '">' +
        '<span class="recite-surah-num">' + group.ayah.n + '</span> ' +
        group.tokens.map(function (token) {
          return '<span class="recite-word">' + escapeHtml(token.display) + '</span>';
        }).join(' ') + '</p>';
    }).join('');
    $('recite-heard').textContent = 'Tap the mic and recite the whole surah — you will get a score out of 100 at the end.';

    startReciteSession();
  }

  function closeRecite() {
    if ($('recite-modal').hidden) return;
    stopListening();
    $('recite-modal').hidden = true;
    recite.ayah = null;
    recite.index = -1;
    recite.groups = null;
  }

  function stepRecite(delta) {
    if (!state.surah || recite.index < 0) return;
    var next = recite.index + delta;
    if (next < 0 || next >= state.surah.ayahs.length) return;
    openRecite(state.surah.ayahs[next]);
  }

  function stopListening() {
    recite.listening = false;
    if (recite.recognition) {
      try { recite.recognition.stop(); } catch (error) { /* already stopped */ }
      recite.recognition = null;
    }
    $('recite-mic').classList.remove('is-listening');
    $('recite-mic-label').textContent = 'Start reciting';
  }

  function startListening() {
    if (!SpeechRecognition) return;
    if (recite.mode === 'surah' ? !recite.groups || !recite.groups.length : !recite.ayah) return;

    if (!audio.paused) audio.pause();
    recite.finalText = '';
    recite.interimText = '';
    recite.restarts = 0;
    $('recite-result').hidden = true;
    $('recite-heard').textContent = recite.mode === 'surah'
      ? 'Listening… recite the surah in order.'
      : 'Listening… recite the ayah out loud.';
    $('recite-hint').textContent = 'Speak clearly; tap the button again when you are done.';
    all('#recite-ref .recite-word').forEach(function (word) {
      word.className = 'recite-word';
    });

    var recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = function (event) {
      var interim = '';
      for (var index = event.resultIndex; index < event.results.length; index++) {
        var result = event.results[index];
        if (result.isFinal) recite.finalText += result[0].transcript + ' ';
        else interim += result[0].transcript + ' ';
      }
      recite.interimText = interim;
      $('recite-heard').textContent = (recite.finalText + interim).trim() || 'Listening…';
    };

    recognition.onerror = function (event) {
      if (event.error === 'aborted') return;
      recite.listening = false;
      $('recite-mic').classList.remove('is-listening');
      $('recite-mic-label').textContent = 'Try again';
      var messages = {
        'not-allowed': 'Microphone permission is blocked. Allow microphone access for this page and try again.',
        'service-not-allowed': 'The speech service is blocked in this browser. Try Chrome or Edge.',
        'no-speech': 'No speech was detected. Tap the mic and try again.',
        'audio-capture': 'No microphone was found on this device.',
        'network': 'Speech recognition needs an internet connection.'
      };
      $('recite-hint').textContent = messages[event.error] || ('Speech recognition error: ' + event.error);
    };

    recognition.onend = function () {
      if (!recite.listening || recite.recognition !== recognition) return;

      // For a whole surah the browser may end the session after a short pause.
      // Keep listening until the user taps stop, but give up after many restarts.
      if (recite.mode === 'surah' && recite.restarts < 40) {
        recite.restarts++;
        setTimeout(function () {
          if (!recite.listening || recite.recognition !== recognition) return;
          try {
            recognition.start();
          } catch (error) {
            recite.listening = false;
            $('recite-mic').classList.remove('is-listening');
            $('recite-mic-label').textContent = 'Check again';
            evaluateRecitation();
          }
        }, 300);
        return;
      }

      recite.listening = false;
      $('recite-mic').classList.remove('is-listening');
      $('recite-mic-label').textContent = 'Check again';
      evaluateRecitation();
    };

    recite.recognition = recognition;
    recite.listening = true;
    $('recite-mic').classList.add('is-listening');
    $('recite-mic-label').textContent = 'Stop and check';

    try {
      recognition.start();
    } catch (error) {
      stopListening();
      $('recite-hint').textContent = 'The microphone could not start. Close other apps using it and try again.';
    }
  }

  function finishListening() {
    if (!recite.listening) return;
    recite.listening = false;
    if (recite.recognition) {
      try { recite.recognition.stop(); } catch (error) { /* already stopped */ }
    }
    $('recite-mic').classList.remove('is-listening');
    $('recite-mic-label').textContent = 'Check again';
    evaluateRecitation();
  }

  function evaluateRecitation() {
    if (recite.mode === 'surah') {
      evaluateSurahRecitation();
      return;
    }

    var heardText = (recite.finalText + ' ' + recite.interimText).trim();
    var heardTokens = heardText.split(/\s+/).map(normalizeArabicWord).filter(Boolean);

    if (!heardTokens.length) {
      $('recite-heard').textContent = 'Nothing was recognised. Tap the mic and try again a little louder.';
      $('recite-result').hidden = true;
      return;
    }

    var reference = recite.tokens.map(function (token) { return token.norm; });
    var ops = alignWords(reference, heardTokens);
    var status = reference.map(function () { return 'ok'; });
    var heardFor = {};
    var extras = [];

    ops.forEach(function (op) {
      if (op.type === 'sub') {
        status[op.ref] = 'wrong';
        heardFor[op.ref] = heardTokens[op.heard];
      } else if (op.type === 'del') {
        status[op.ref] = 'missed';
      } else if (op.type === 'ins') {
        extras.push(heardTokens[op.heard]);
      }
    });

    var correct = status.filter(function (value) { return value === 'ok'; }).length;
    var percent = Math.round((correct / reference.length) * 100);

    $('recite-ref').innerHTML = recite.tokens.map(function (token, index) {
      return '<span class="recite-word ' + status[index] + '">' + escapeHtml(token.display) + '</span>';
    }).join(' ');

    $('recite-heard').textContent = 'Heard: ' + heardText;

    var verdict = percent >= 90
      ? 'Excellent recitation.'
      : percent >= 70
        ? 'Good — review the highlighted words.'
        : 'Keep practising — the highlighted words need work.';

    $('recite-score').innerHTML =
      '<span class="recite-score-pct' + (percent < 70 ? ' is-low' : '') + '">' + percent + '%</span>' +
      '<span class="recite-score-text">' + correct + ' of ' + reference.length + ' words matched. ' +
      escapeHtml(verdict) + '</span>';

    var notes = [];
    recite.tokens.forEach(function (token, index) {
      if (status[index] === 'missed') {
        notes.push('<li><span class="note-label">Missed:</span> ' +
          '<span class="note-ar" dir="rtl" lang="ar">' + escapeHtml(token.display) + '</span></li>');
      } else if (status[index] === 'wrong') {
        notes.push('<li><span class="note-label">Check:</span> heard ' +
          '<span class="note-ar" dir="rtl" lang="ar">' + escapeHtml(heardFor[index]) + '</span> instead of ' +
          '<span class="note-ar" dir="rtl" lang="ar">' + escapeHtml(token.display) + '</span></li>');
      }
    });
    if (extras.length) {
      notes.push('<li><span class="note-label">Extra words heard:</span> ' +
        '<span class="note-ar" dir="rtl" lang="ar">' + escapeHtml(extras.slice(0, 4).join(' ')) + '</span></li>');
    }
    if (!notes.length) notes.push('<li>No mistakes detected — every word matched.</li>');

    $('recite-notes').innerHTML = notes.join('');
    $('recite-result').hidden = false;
  }

  // Matches the whole recitation ayah by ayah in reading order. Words are looked up
  // in a small window ahead, so a full surah needs no huge alignment table and a
  // skipped ayah never swallows the words of the next one.
  function evaluateSurahRecitation() {
    var heardText = (recite.finalText + ' ' + recite.interimText).trim();
    var heardTokens = heardText.split(/\s+/).map(normalizeArabicWord).filter(Boolean);

    if (!heardTokens.length) {
      $('recite-heard').textContent = 'Nothing was recognised. Tap the mic and try again a little louder.';
      $('recite-result').hidden = true;
      return;
    }

    var position = 0;
    var totalWords = 0;
    var matchedWords = 0;
    var extrasTotal = 0;
    var problems = [];

    recite.groups.forEach(function (group) {
      var reference = group.norm;
      var status = reference.map(function () { return 'ok'; });
      var extras = 0;

      reference.forEach(function (word, index) {
        var found = -1;
        var limit = Math.min(heardTokens.length, position + 4);
        for (var j = position; j < limit; j++) {
          if (heardTokens[j] === word) {
            found = j;
            break;
          }
        }
        if (found === -1) {
          status[index] = 'missed';
          return;
        }
        extras += found - position;
        position = found + 1;
      });

      var matched = status.filter(function (value) { return value === 'ok'; }).length;
      totalWords += reference.length;
      matchedWords += matched;
      extrasTotal += extras;
      group.status = status;

      var missed = status.filter(function (value) { return value === 'missed'; }).length;
      if (missed) {
        problems.push({ n: group.ayah.n, missed: missed, wrong: 0, total: reference.length });
      }
    });

    $('recite-ref').innerHTML = recite.groups.map(function (group) {
      return '<p class="recite-surah-ayah" data-ayah="' + group.ayah.n + '">' +
        '<span class="recite-surah-num">' + group.ayah.n + '</span> ' +
        group.tokens.map(function (token, index) {
          return '<span class="recite-word ' + (group.status ? group.status[index] : '') + '">' +
            escapeHtml(token.display) + '</span>';
        }).join(' ') + '</p>';
    }).join('');

    var percent = totalWords ? Math.round((matchedWords / totalWords) * 100) : 0;
    var verdict = percent >= 90
      ? 'Excellent recitation of the whole surah.'
      : percent >= 70
        ? 'Good — review the highlighted words.'
        : 'Keep practising — the highlighted words need work.';

    $('recite-heard').textContent = 'Heard: ' + heardText;
    $('recite-score').innerHTML =
      '<span class="recite-score-pct' + (percent < 70 ? ' is-low' : '') + '">' + percent +
      '<span class="score-total">/100</span></span>' +
      '<span class="recite-score-text">' + matchedWords + ' of ' + totalWords + ' words matched across ' +
      recite.groups.length + ' ayahs. ' + escapeHtml(verdict) + '</span>';

    var notes = [];
    problems.slice(0, 12).forEach(function (item) {
      var parts = [];
      if (item.missed) parts.push(item.missed + ' missed');
      if (item.wrong) parts.push(item.wrong + ' to check');
      notes.push('<li><span class="note-label">Ayah ' + item.n + ':</span> ' +
        parts.join(', ') + ' of ' + item.total + ' words</li>');
    });
    if (problems.length > 12) {
      notes.push('<li>+' + (problems.length - 12) + ' more ayahs need practice.</li>');
    }
    if (extrasTotal) {
      notes.push('<li><span class="note-label">Extra words heard:</span> ' + extrasTotal +
        ' — recite slowly and clearly without adding words.</li>');
    }
    if (!notes.length) notes.push('<li>No mistakes detected — every word matched.</li>');

    $('recite-notes').innerHTML = notes.join('');
    $('recite-result').hidden = false;
  }

  /* ---------- accounts ------------------------------------------------ */

  var ACCOUNT_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20a7.2 7.2 0 0 1 14.4 0"/>' +
    '</svg>';

  var auth = {
    ready: false,
    client: null,
    user: null,
    mode: 'signin',
    busy: false
  };

  function authConfigured() {
    var config = window.QURAN_FIREBASE_CONFIG || {};
    return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId &&
      String(config.apiKey).indexOf('YOUR_') !== 0);
  }

  function setupNote(message) {
    var note = $('auth-note');
    note.textContent = message;
    note.classList.add('is-setup');
    $('auth-submit').disabled = true;
    $('auth-google').disabled = true;
  }

  function initAuth() {
    window.QURAN_FIREBASE_CONFIG = window.QURAN_FIREBASE_CONFIG || {};

    if (typeof window.firebase === 'undefined' || !authConfigured()) {
      setupNote('Sign-in is not set up yet. Add the Firebase web config in js/firebase-config.js to enable accounts.');
      return;
    }

    try {
      if (!window.firebase.apps.length) window.firebase.initializeApp(window.QURAN_FIREBASE_CONFIG);
      auth.client = window.firebase.auth();
      auth.ready = true;

      auth.client.onAuthStateChanged(function (user) {
        auth.user = user || null;
        renderAccount();
        if (user) closeAuth();
      });
      auth.client.getRedirectResult().catch(function () { /* popup/redirect cancelled */ });
    } catch (error) {
      setupNote('Firebase Authentication could not start. Check the config values in js/firebase-config.js.');
    }
  }

  function renderAccount() {
    var user = auth.user;
    var avatar = $('account-avatar');

    if (user) {
      var name = user.displayName || (user.email || '').split('@')[0] || 'Account';
      $('account-label').textContent = name;
      avatar.textContent = name.charAt(0).toUpperCase();
      $('account-btn').title = user.email || 'Account';
      $('account-btn').setAttribute('aria-label', 'Account menu for ' + (user.email || name));
      $('account-btn').classList.add('is-signed-in');
    } else {
      $('account-label').textContent = 'Sign in';
      avatar.innerHTML = ACCOUNT_ICON;
      $('account-btn').title = 'Sign in';
      $('account-btn').setAttribute('aria-label', 'Sign in or create an account');
      $('account-btn').classList.remove('is-signed-in');
      closeAccountMenu();
    }
  }

  function renderAccountMenu() {
    if (!auth.user) {
      $('account-menu').innerHTML = '';
      return;
    }
    $('account-menu').innerHTML =
      '<div class="account-head">' +
        '<strong>' + escapeHtml(auth.user.displayName || 'Signed in') + '</strong>' +
        '<small>' + escapeHtml(auth.user.email || '') + '</small>' +
      '</div>' +
      '<button type="button" class="continue-option account-signout" id="account-signout" role="menuitem">Sign out</button>';
  }

  function toggleAccountMenu() {
    if (!auth.user) {
      openAuth('signin');
      return;
    }
    var menu = $('account-menu');
    if (!menu.hidden) {
      closeAccountMenu();
      return;
    }
    renderAccountMenu();
    menu.hidden = false;
    $('account-btn').setAttribute('aria-expanded', 'true');
  }

  function closeAccountMenu() {
    $('account-menu').hidden = true;
    $('account-btn').setAttribute('aria-expanded', 'false');
  }

  function setAuthMode(mode) {
    auth.mode = mode === 'signup' ? 'signup' : 'signin';
    var signup = auth.mode === 'signup';

    $('auth-title').textContent = signup ? 'Create account' : 'Sign in';
    $('auth-submit').textContent = signup ? 'Create account' : 'Sign in';
    $('auth-password').setAttribute('autocomplete', signup ? 'new-password' : 'current-password');
    $('auth-tab-signin').classList.toggle('is-active', !signup);
    $('auth-tab-signup').classList.toggle('is-active', signup);
    $('auth-tab-signin').setAttribute('aria-selected', String(!signup));
    $('auth-tab-signup').setAttribute('aria-selected', String(signup));
    $('auth-error').hidden = true;

    var note = $('auth-note');
    if (!$('auth-submit').disabled) {
      note.textContent = signup
        ? 'Create a free account with your email, or continue with Google.'
        : 'Sign in with your email, or continue with Google.';
    }
  }

  function openAuth(mode) {
    closeAccountMenu();
    setAuthMode(mode || 'signin');
    $('auth-modal').hidden = false;
    if (!$('auth-email').disabled) $('auth-email').focus();
  }

  function closeAuth() {
    if ($('auth-modal').hidden) return;
    $('auth-modal').hidden = true;
    $('auth-password').value = '';
    showAuthError('');
  }

  function showAuthError(message) {
    var node = $('auth-error');
    node.textContent = message || '';
    node.hidden = !message;
  }

  function setAuthBusy(busy) {
    auth.busy = busy;
    $('auth-submit').disabled = busy || !auth.ready;
    $('auth-google').disabled = busy || !auth.ready;
    $('auth-submit').textContent = busy
      ? 'Please wait…'
      : (auth.mode === 'signup' ? 'Create account' : 'Sign in');
  }

  function authErrorMessage(error) {
    var code = (error && error.code) || '';
    var messages = {
      'auth/invalid-email': 'That email address does not look valid.',
      'auth/missing-password': 'Enter your password.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/email-already-in-use': 'An account with this email already exists. Try signing in.',
      'auth/wrong-password': 'Email or password is incorrect.',
      'auth/user-not-found': 'Email or password is incorrect.',
      'auth/invalid-credential': 'Email or password is incorrect.',
      'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
      'auth/popup-closed-by-user': 'Google sign-in was closed before it finished.',
      'auth/popup-blocked': 'Your browser blocked the Google popup. Allow popups and try again.',
      'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase yet.',
      'auth/unauthorized-domain': 'This domain is not allowed in Firebase Authentication settings.',
      'auth/network-request-failed': 'Network error. Check your connection and try again.'
    };
    return messages[code] || (error && error.message) || 'Something went wrong. Please try again.';
  }

  async function submitAuth(event) {
    event.preventDefault();
    if (!auth.ready || auth.busy) return;

    var email = $('auth-email').value.trim();
    var password = $('auth-password').value;

    showAuthError('');
    if (!email) return showAuthError('Enter your email address.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showAuthError('Enter a valid email address.');
    if (password.length < 6) return showAuthError('Password must be at least 6 characters.');

    setAuthBusy(true);
    try {
      if (auth.mode === 'signup') {
        await auth.client.createUserWithEmailAndPassword(email, password);
        showToast('Account created — welcome to Quran Pak');
      } else {
        await auth.client.signInWithEmailAndPassword(email, password);
        showToast('Signed in as ' + email);
      }
      $('auth-password').value = '';
      closeAuth();
    } catch (error) {
      showAuthError(authErrorMessage(error));
    } finally {
      setAuthBusy(false);
    }
  }

  async function googleSignIn() {
    if (!auth.ready || auth.busy) return;
    setAuthBusy(true);
    try {
      var provider = new window.firebase.auth.GoogleAuthProvider();
      await auth.client.signInWithPopup(provider);
      closeAuth();
      showToast('Signed in with Google');
    } catch (error) {
      showAuthError(authErrorMessage(error));
    } finally {
      setAuthBusy(false);
    }
  }

  async function signOutAccount() {
    if (!auth.client) return;
    closeAccountMenu();
    try {
      await auth.client.signOut();
      showToast('Signed out');
    } catch (error) {
      showToast('Could not sign out. Please try again.');
    }
  }

  /* ---------- misc UI -------------------------------------------------- */

  var toastTimer = null;

  function showToast(message) {
    var toast = $('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 3000);
  }

  /* ---------- events --------------------------------------------------- */

  function bindEvents() {
    $('menu-btn').addEventListener('click', function () { setSidebar(true); });
    $('scrim').addEventListener('click', function () { setSidebar(false); });

    $('surah-search').addEventListener('input', function (event) {
      state.search = event.target.value.trim();
      renderSurahList();
    });

    all('.tab').forEach(function (button) {
      button.addEventListener('click', function () { setTab(button.dataset.tab); });
    });

    $('surah-list').addEventListener('click', function (event) {
      var link = event.target.closest('a.surah-item');
      if (!link) return;
      if (window.location.hash === link.getAttribute('href')) {
        event.preventDefault();
        openSurah(Number(link.dataset.number), 1);
      }
    });

    $('content').addEventListener('click', function (event) {
      if (event.target.closest('[data-recite-surah]')) {
        if (!state.surah) return;
        openSurahRecite();
        return;
      }

      if (event.target.closest('[data-recite-open]')) {
        if (!state.surah || !state.surah.ayahs.length) return;
        var nodes = all('.ayah');
        var inView = nodes.find(function (node) {
          return node.getBoundingClientRect().bottom > 90;
        }) || nodes[0];
        var startAyah = state.surah.ayahs.find(function (item) {
          return inView && item.n === Number(inView.dataset.ayah);
        }) || state.surah.ayahs[0];
        openRecite(startAyah);
        return;
      }

      var button = event.target.closest('button[data-action]');
      if (!button || !state.surah) return;
      var ayah = state.surah.ayahs.find(function (item) {
        return item.n === Number(button.dataset.ayah);
      });
      if (!ayah) return;

      if (button.dataset.action === 'play') toggleAyah(ayah);
      else if (button.dataset.action === 'recite') openRecite(ayah);
      else if (button.dataset.action === 'bookmark') toggleBookmark(state.surah, ayah);
    });

    $('bookmark-list').addEventListener('click', function (event) {
      var remove = event.target.closest('[data-remove]');
      if (!remove) return;
      event.preventDefault();
      var parts = remove.dataset.remove.split(':');
      var surahNumber = Number(parts[0]);
      var ayahNumber = Number(parts[1]);
      state.bookmarks = state.bookmarks.filter(function (item) {
        return !(item.surah === surahNumber && item.ayah === ayahNumber);
      });
      writeStorage(STORAGE.bookmarks, state.bookmarks);
      renderBookmarks();
      updateBookmarkCount();
      refreshBookmarkButtons();
    });

    $('translation-select').addEventListener('change', function (event) {
      state.settings.translation = event.target.value;
      saveSettings();
      updateTranslations();
      updateContinueMenuLabel();
    });

    $('font-minus').addEventListener('click', function () { changeFontSize(-2); });
    $('font-plus').addEventListener('click', function () { changeFontSize(2); });
    $('theme-btn').addEventListener('click', cycleTheme);

    $('account-btn').addEventListener('click', function (event) {
      event.stopPropagation();
      toggleAccountMenu();
    });
    $('account-menu').addEventListener('click', function (event) {
      if (event.target.closest('#account-signout')) signOutAccount();
    });
    $('auth-close').addEventListener('click', closeAuth);
    $('auth-form').addEventListener('submit', submitAuth);
    $('auth-google').addEventListener('click', googleSignIn);
    all('.auth-tab').forEach(function (tab) {
      tab.addEventListener('click', function () { setAuthMode(tab.dataset.authMode); });
    });
    $('auth-modal').addEventListener('click', function (event) {
      if (event.target === event.currentTarget) closeAuth();
    });
    $('continue-btn').addEventListener('click', function (event) {
      event.stopPropagation();
      closeReciterMenu();
      toggleContinueMenu();
    });

    $('reciter-btn').addEventListener('click', function (event) {
      event.stopPropagation();
      toggleReciterMenu();
    });

    $('reciter-menu').addEventListener('click', function (event) {
      var option = event.target.closest('[data-reciter]');
      if (option) selectReciter(option.dataset.reciter);
    });

    $('continue-menu').addEventListener('click', function (event) {
      var option = event.target.closest('button[data-mode]');
      if (!option) return;
      if (option.dataset.mode === 'off') deactivateContinue();
      else activateContinue(option.dataset.mode);
    });

    document.addEventListener('click', function (event) {
      if (!event.target.closest('.continue-wrap')) closeContinueMenu();
      if (!event.target.closest('.reciter-wrap')) closeReciterMenu();
      if (!event.target.closest('.account-wrap')) closeAccountMenu();
    });
    $('recite-mic').addEventListener('click', function () {
      if (recite.listening) finishListening();
      else startListening();
    });
    $('recite-close').addEventListener('click', closeRecite);
    $('recite-prev').addEventListener('click', function () { stepRecite(-1); });
    $('recite-next').addEventListener('click', function () { stepRecite(1); });
    $('recite-listen').addEventListener('click', function () {
      if (!recite.ayah) return;
      if (recite.listening) finishListening();
      playAyah(recite.ayah);
    });
    $('recite-modal').addEventListener('click', function (event) {
      if (event.target === event.currentTarget) closeRecite();
    });

    $('speed-select').addEventListener('change', function (event) {
      state.settings.speed = Number(event.target.value);
      saveSettings();
      applyAudioSpeed();
      showToast('Speed ' + event.target.value + '×');
    });
    $('player-toggle').addEventListener('click', togglePlayer);
    $('player-close').addEventListener('click', stopPlayback);

    audio.addEventListener('ended', function () {
      if (!state.continueListen) {
        stopPlayback();
        return;
      }
      if (state.audioPhase === 'arabic' && state.continueTranslation && state.currentAyah) {
        playTranslation(state.currentAyah);
        return;
      }
      playNextAyah();
    });
    audio.addEventListener('play', syncPlayer);
    audio.addEventListener('pause', syncPlayer);
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('error', function () {
      if (audio.getAttribute('src')) {
        showToast('Recitation could not load. Check your internet connection.');
      }
    });

    window.addEventListener('hashchange', onHashChange);

    window.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        if (!$('auth-modal').hidden) {
          closeAuth();
          return;
        }
        if (!$('recite-modal').hidden) {
          closeRecite();
          return;
        }
        closeAccountMenu();
        closeContinueMenu();
        closeReciterMenu();
        setSidebar(false);
        return;
      }
      var tag = event.target.tagName;
      if (event.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        event.preventDefault();
        setTab('surahs');
        setSidebar(true);
        $('surah-search').focus();
      }
    });
  }

  init();
})();
