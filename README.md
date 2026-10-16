# TP LMS Dark Mode

A browser extension that dark-modes Temasek Polytechnic's LMS
(`tplms.polite.edu.sg`, D2L Brightspace), with a toolbar toggle.

## How it works

Three layers:

1. **Design-token overrides** — Brightspace's `d2l-*` web components
   (including their shadow DOM) are colored almost entirely through
   `--d2l-color-*` CSS custom properties. Overriding them on `:root`
   recolors nearly everything in one place.
2. **Light-DOM overrides** — the page shell (navbar, widget tiles,
   banners, tables) gets direct rules scoped under `html.tplms-dark`.
3. **Shadow-root injection** — a few components (e.g. `d2l-card`,
   the "My Courses" tiles) hardcode `:host { background: #fff }`, and
   elements nested inside another component's shadow root can't be
   reached from document CSS. The content script adopts a small
   stylesheet into every shadow root (existing and future, via an
   `attachShadow` patch) and removes it when dark mode is toggled off.

Everything is scoped under the `tplms-dark` class on `<html>`, so the
popup toggle switches instantly without reloading.

The `s.brightspace.com` match covers the cross-origin sequence/TOC
frame D2L embeds (the big white content area on Content pages).

## Install in Firefox (temporary)

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…**
3. Pick `manifest.json` in this folder

Note: a temporary add-on is removed when Firefox closes. For daily use,
you can zip this folder and sign it via addons.mozilla.org (unlisted),
or use the [firefox-extened "permanent" dev option](https://wiki.mozilla.org/Add-ons/Extension_Signing#Detailed_packaging_guide) — easiest is just re-loading after restart.

## Install in Chrome / Edge

1. Rename/copy `manifest-chrome.json` to `manifest.json` (keep the
   Firefox one as `manifest-firefox.json`), or use "Load unpacked" after
   swapping the file.
2. Open `chrome://extensions`, enable **Developer mode**, click
   **Load unpacked**, pick this folder.

## Files

| File | Purpose |
|---|---|
| `manifest.json` | Firefox (MV2) manifest |
| `manifest-chrome.json` | Chrome/Edge (MV3) manifest |
| `dark.css` | All styling: token + light-DOM overrides |
| `content.js` | Toggle handling + shadow-root stylesheet injection |
| `popup.html` / `popup.js` | Toolbar toggle (stored in `storage.local`) |

## Tuning colors

All dark colors live in one block at the top of `dark.css`
(`html.tplms-dark { --d2l-color-… }`). The mapping keeps hue and swaps
lightness: token names ending in `-plus-N` (light tints) become dark
tints, `-minus-N` (dark shades) become light shades.

## Known limitations

- Third-party embeds (Panopto videos, publisher content, Google Docs
  previews) keep their own look.
- Lecturer-authored pages with hardcoded white backgrounds inside the
  content frame get the generic dark background/text treatment, but
  inline image content stays as-is.
- The unsupported-browser popup D2L sometimes shows on odd user agents
  is unaffected (it renders fine dark).
