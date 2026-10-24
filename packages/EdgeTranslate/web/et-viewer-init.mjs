// EdgeTranslate PDF.js viewer bootstrap (MV3-safe: no inline script)
import * as PDFJS from '../build/build/pdf.mjs';
import { normalizeViewerUrl } from './et-viewer-url.js';
import { applyEarlyThemeFromStorageAndSystem, applyEarlyPageTheme, setupThemeToggle } from './et-viewer-theme.mjs';
import { setupSecondaryToolbarScroll } from './et-viewer-secondary-toolbar.mjs';

// Expose as global for viewer.mjs
if (!globalThis.pdfjsLib) {
  globalThis.pdfjsLib = PDFJS;
}

// Soften noisy runtime errors (benign cases: asset download hiccups, user-cancelled print)
try {
  const isHarmlessIconError = (val) => {
    const msg = String(val && (val.message || val));
    return msg.includes('Unable to download all specified images');
  };
  const isBenignCancellation = (val) => {
    if (!val) return false;
    if (val.name === 'RenderingCancelledException') return true;
    const msg = String(val.message || val);
    return msg.includes('Print cancelled');
  };
  window.addEventListener('unhandledrejection', (event) => {
    if (isHarmlessIconError(event.reason) || isBenignCancellation(event.reason)) {
      event.preventDefault();
    }
  });
  const origErr = console.error;
  console.error = function (...args) {
    if (args.some(isHarmlessIconError) || args.some(isBenignCancellation)) return;
    return origErr.apply(this, args);
  };
} catch {}

// Disable drag-and-drop open behavior inside the viewer
try {
  const block = (e) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'none';
  };
  window.addEventListener('dragover', block);
  window.addEventListener('drop', block);
} catch {}

  try { PDFJS.GlobalWorkerOptions.workerSrc = '../build/build/pdf.worker.mjs'; } catch {}

// Prepare URL before loading viewer.mjs, following official behavior where file param drives initial load
(async () => {
  const DEBUG = false;
  applyEarlyThemeFromStorageAndSystem();

  // Apply persisted page theme (auto|light|dark) early to avoid flicker
  applyEarlyPageTheme();
  const normalized = normalizeViewerUrl(location.href);
  if (normalized.recoveredLegacyBlob) {
    history.replaceState(null, '', normalized.href);
  }

  // Load official viewer once URL is finalized (avoid duplicate insert)
  const ensureViewerLoaded = () => {
    if (document.getElementById('et-viewer-loader')) return;
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'viewer.mjs';
    script.id = 'et-viewer-loader';
    document.head.appendChild(script);
  };
  ensureViewerLoaded();

  // Theme toggle handled in et-viewer-theme.mjs

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', setupThemeToggle);
  } else {
    // Try immediately; if button not yet available, retry shortly
    if (!setupThemeToggle()) {
      setTimeout(setupThemeToggle, 0);
    }
  }

  // Secondary toolbar handled in et-viewer-secondary-toolbar.mjs

  const trySetupToolbar = () => { if (!setupSecondaryToolbarScroll()) setTimeout(trySetupToolbar, 50); };
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', trySetupToolbar);
  } else {
    trySetupToolbar();
  }

  // Close any open PDF.js doorhangers/menus when clicking the background
  const setupGlobalMenuDismissal = () => {
    const isMenuElement = (el) => !!(el && el.classList && (el.classList.contains('menu') || el.classList.contains('doorHanger') || el.classList.contains('doorHangerRight')));
    const closeAllMenus = () => {
      try {
        const menus = document.querySelectorAll('.menu, .doorHanger, .doorHangerRight');
        for (const el of menus) {
          if (el.classList && !el.classList.contains('hidden')) {
            el.classList.add('hidden');
            const id = el.id;
            if (id) {
              const controller = document.querySelector(`[aria-controls="${CSS.escape(id)}"]`);
              if (controller && controller.getAttribute('aria-expanded') === 'true') {
                controller.setAttribute('aria-expanded', 'false');
              }
            }
          }
        }
      } catch {}
    };
    const onPointerDown = (e) => {
      let node = e.target;
      while (node) {
        if (isMenuElement(node)) return; // Click inside an open menu → don't auto-close
        node = node.parentNode;
      }
      closeAllMenus();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return true;
  };
  setupGlobalMenuDismissal();
})();



