/*
 * TP LMS Dark Mode — content.js
 *
 * 1. Adds/removes the `tplms-dark` class on <html>; dark.css is always
 *    injected by the manifest but only applies under that class, so the
 *    toolbar toggle works instantly without reloading.
 * 2. Injects SHADOW_CSS into every shadow root (existing and future),
 *    and removes it again on toggle-off. Some D2L web components
 *    (e.g. d2l-card) hardcode colors in their shadow stylesheets instead
 *    of using tokens, and elements nested inside another component's
 *    shadow root can't be reached from document CSS — only from a
 *    stylesheet adopted inside that root.
 */
(async () => {
  const KEY = 'enabled';

  const SHADOW_CSS = `
    d2l-card { background-color: #24272c !important; border-color: #434a52 !important; }
  `;

  let enabled = true;

  const apply = (on) => {
    document.documentElement.classList.toggle('tplms-dark', !!on);
  };

  const makeSheet = () => {
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(SHADOW_CSS);
      return sheet;
    } catch (e) {
      return null;
    }
  };

  const styleShadowRoot = (root) => {
    if (root.__tplmsSheet) return;
    const sheet = makeSheet();
    if (!sheet) return;
    root.__tplmsSheet = sheet;
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
  };

  const unstyleShadowRoot = (root) => {
    if (!root.__tplmsSheet) return;
    root.adoptedStyleSheets = root.adoptedStyleSheets.filter(
      (s) => s !== root.__tplmsSheet
    );
    delete root.__tplmsSheet;
  };

  const eachShadowRoot = (fn) => {
    const queue = [document];
    while (queue.length) {
      const node = queue.shift();
      let elements;
      try { elements = node.querySelectorAll('*'); } catch (e) { continue; }
      for (const el of elements) {
        if (el.shadowRoot) {
          fn(el.shadowRoot);
          queue.push(el.shadowRoot);
        }
      }
    }
  };

  const rescan = () => {
    if (enabled) eachShadowRoot(styleShadowRoot);
  };

  const setEnabled = (on) => {
    enabled = !!on;
    apply(enabled);
    if (enabled) {
      rescan();
    } else {
      eachShadowRoot(unstyleShadowRoot);
    }
  };

  try {
    const api = typeof browser !== 'undefined' ? browser : chrome;
    const res = await api.storage.local.get({ [KEY]: true });
    setEnabled(res[KEY] !== false);
    api.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes[KEY]) {
        setEnabled(changes[KEY].newValue !== false);
      }
    });
  } catch (e) {
    // storage unavailable — default to on
    setEnabled(true);
  }

  // Catch shadow roots created later: D2L components are upgraded
  // asynchronously, and every open shadow root goes through attachShadow.
  const origAttachShadow = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (init) {
    const root = origAttachShadow.call(this, init);
    if (enabled) styleShadowRoot(root);
    return root;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', rescan);
  } else {
    rescan();
  }
  // A couple of deferred passes for components that upgrade late.
  setTimeout(rescan, 1500);
  setTimeout(rescan, 5000);

  // New light-DOM nodes can carry components with shadow roots too.
  new MutationObserver(rescan).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
