(() => {
  'use strict';

  const directory = new URL('.', window.location.href);
  const publicPages = new Set([
    '', 'index.html', 'en.html', 'cases.html', 'demo-shufen.html', 'demo-eval.html',
    'demo-creative.html', 'demo-wukong.html', 'demo-wecom-flow.html',
  ]);
  const stateKey = 'resumeNavigation';
  const pendingKey = 'resume-navigation-pending';
  const cases = { analytics: 'case-analytics', creative: 'case-creative', wecom: 'case-lianlu' };

  function localURL(value) {
    if (typeof value !== 'string' || !value) return null;
    try {
      const url = new URL(value, directory);
      if (url.origin !== directory.origin || url.protocol !== directory.protocol ||
          url.username || url.password || !url.pathname.startsWith(directory.pathname) ||
          !publicPages.has(url.pathname.slice(directory.pathname.length))) return null;
      return url;
    } catch {
      return null;
    }
  }

  function relative(url) {
    return `${url.pathname.slice(directory.pathname.length)}${url.search}${url.hash}` || './';
  }

  function position(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : 0;
  }

  function returnState(value) {
    if (!value || typeof value !== 'object') return {};
    const url = localURL(value.back);
    // Preserve the source's own return route, not any Demo application data.
    return {
      back: url ? relative(url) : undefined, backY: position(value.backY),
      sourceState: value.sourceState,
      language: value.language === 'en' || value.language === 'zh' ? value.language : undefined,
    };
  }

  function storePending(value) {
    try {
      sessionStorage.setItem(pendingKey, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  let pending;
  try {
    pending = JSON.parse(sessionStorage.getItem(pendingKey));
    sessionStorage.removeItem(pendingKey);
  } catch {
    pending = null;
  }

  const current = new URL(window.location.href);
  const returnURL = localURL(current.searchParams.get('returnTo'));
  const returnY = position(current.searchParams.get('returnY'));
  const restoreY = current.searchParams.get('restoreY');
  let transferredState;
  try {
    transferredState = JSON.parse(current.searchParams.get('returnState'));
  } catch {
    transferredState = null;
  }
  for (const key of ['returnTo', 'returnY', 'restoreY', 'returnState']) {
    if (current.searchParams.has(key)) current.searchParams.delete(key);
  }

  let entry = window.history.state?.[stateKey] || {};
  if (returnURL) {
    entry = { back: relative(returnURL), backY: returnY, sourceState: transferredState, nativeBack: false };
  } else if (restoreY !== null) {
    entry = { ...returnState(transferredState), position: position(restoreY), nativeBack: false };
  } else if (pending?.to === current.href && pending.restore) {
    entry = { ...returnState(pending.sourceState), position: position(pending.position), nativeBack: false };
  } else if (pending?.to === current.href && localURL(pending.back)) {
    entry = pending;
  }
  entry.url = current.href;
  entry.language = entry.language || (document.documentElement.lang === 'en' ||
    current.searchParams.get('from') === 'en' ||
    localURL(entry.back)?.pathname.endsWith('/en.html') ? 'en' : 'zh');

  function saveEntry() {
    window.history.replaceState({ ...window.history.state, [stateKey]: entry }, '', current.href);
  }
  saveEntry();

  window.addEventListener('pagehide', () => {
    entry.position = window.scrollY;
    // Keep any in-page anchor that was selected after this script loaded.
    current.href = window.location.href;
    saveEntry();
  });
  window.addEventListener('pageshow', () => {
    const y = window.history.state?.[stateKey]?.position;
    if (y !== undefined) {
      requestAnimationFrame(() => window.scrollTo({ top: position(y), behavior: 'instant' }));
    }
  });

  const nav = document.querySelector('[data-demo-nav]');
  const back = document.querySelector('[data-demo-back], [data-page-back]');
  const actualSource = localURL(entry.back);
  const source = current.searchParams.get('from');
  const project = nav?.dataset.project;
  if (back && actualSource) {
    back.href = relative(actualSource);
    const file = actualSource.pathname.slice(directory.pathname.length);
    if (file === 'en.html') back.textContent = 'Back to resume project';
    else if (file === '' || file === 'index.html') back.textContent = '返回简历项目';
    else if (file === 'cases.html') back.textContent = '返回作品集案例';
    else back.textContent = entry.language === 'en' ? 'Back to Demo' : '返回 Demo';

    back.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (entry.nativeBack && window.history.length > 1 && window.location.href === entry.url) {
        event.preventDefault();
        window.history.back();
      } else if (!storePending({
        to: actualSource.href, restore: true, position: entry.backY, sourceState: entry.sourceState,
      })) {
        const fallback = new URL(actualSource);
        fallback.searchParams.set('restoreY', position(entry.backY));
        fallback.searchParams.set('returnState', JSON.stringify(returnState(entry.sourceState)));
        back.href = relative(fallback);
      }
    });
  } else if (back && Object.hasOwn(cases, project)) {
    // Old bookmarked links retain their project fallback when no actual source was recorded.
    if (source === 'resume' || source === 'en') {
      back.href = `${source === 'en' ? 'en' : 'index'}.html#project-${project}`;
      back.textContent = source === 'en' ? 'Back to resume project' : '返回简历项目';
    } else if (source === 'cases') {
      back.href = `cases.html#${cases[project]}`;
      back.textContent = '返回作品集案例';
    }
  }

  if (nav && entry.language === 'en') {
    nav.setAttribute('aria-label', 'Demo navigation');
    nav.lang = 'en';
    const home = nav.querySelector('[data-demo-home]');
    home.href = 'en.html';
    home.textContent = 'Resume';
    nav.querySelector('[data-demo-cases]').textContent = 'Portfolio';
  }

  function rememberSource(event) {
    const link = event.target.closest?.('a[href]');
    if (!link || link === back || link.hasAttribute('download') || event.defaultPrevented) return;
    const destination = localURL(link.href);
    if (!destination || destination.pathname === window.location.pathname) return;
    for (const key of ['returnTo', 'returnY', 'returnState']) {
      if (destination.searchParams.has(key)) destination.searchParams.delete(key);
    }
    entry.position = window.scrollY;
    current.href = window.location.href;
    saveEntry();
    const sourceEntry = {
      to: destination.href, back: relative(current), backY: entry.position,
      nativeBack: true, language: entry.language, sourceState: returnState(entry),
    };
    const sameTab = event.type === 'click' && event.button === 0 &&
      !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey &&
      (!link.target || link.target === '_self');
    if (!sameTab || !storePending(sourceEntry)) {
      // New tabs and storage-restricted local files carry a validated source explicitly.
      destination.searchParams.set('returnTo', relative(current));
      destination.searchParams.set('returnY', entry.position);
      destination.searchParams.set('returnState', JSON.stringify(returnState(entry)));
    }
    link.href = relative(destination);
  }

  document.addEventListener('click', rememberSource);
  document.addEventListener('auxclick', rememberSource);
  document.addEventListener('contextmenu', rememberSource);
})();
