# Changelog

## 3.4.6 - 2026-10-24

- Migrated extension-owned popup, translation panel, selection control, notifications, and PDF viewer icons to Lucide with consistent stroke styling.
- Replaced animated loading artwork with centered CSS-only Lucide spinners that respect reduced-motion preferences.
- Preserved product identity artwork and Google Translate-owned assets.


## 3.4.5 - 2026-10-24

- Fixed PDF viewer URL parsing so signed URL escapes remain intact and cross-origin PDFs use PDF.js range loading instead of full-file blob preloads.
- Restored legacy blob viewer links from their original source URL after reload and enabled credentialed PDF.js requests.
- Bundled PDF.js CMaps, fonts, ICC profiles, WebAssembly resources, and matching core modules; corrected worker and sandbox paths.
- Kept translator initialization compatible with the extension service worker and wait for translator configuration before populating engine choices.
- Added a versioned Chrome ZIP, SHA-256 checksum, and unpacked extension under the repository-level `output/` directory when packing.
- Restyled PDF viewer controls with the warm cream, saffron, and deep blue palette while preserving PDF page and text layer metrics.

## 3.4.4 - 2026-10-24

- Fixed repeated panel initialization caused by unstable theme effect dependencies, which continuously reloaded settings and requested translator options.
- Released panel message handlers when effects are cleaned up to prevent retained callbacks and duplicate event processing.
- Bounded PDF detection caches and pruned expired URLs on writes; stopped probing ordinary pages on cache misses when response-header detection is available, while preserving MIME-based PDF detection for opaque URLs.
- Connected DOM fallback cancellation and limited retained pending nodes while animation frames are suspended.
- Added regression tests for panel lifecycle, PDF cache limits, and DOM observer cleanup.

## 3.4.3 - 2026-07-06

- Cleaned up legacy and dead code:
  - Completely removed `serviceWorkerMocks.js` (650+ lines of redundant DOM mock definitions) since the `@edge_translate/translators` package now uses environment-agnostic fetch operations.
  - Removed duplicate empty rule file `src/rules.json` (active rules are maintained in `static/rules.json`).
  - Removed loose development script `packages/translators/test-undici.js`.
  - Removed unused backup CSS file `_viewer.v5.4.54.css`.
- Reduced extension background service worker bundle size by ~8.2 KiB.

## 3.4.2 - 2026-07-06

- Fixed browser freeze/crash issue triggered by infinite iframe recursion when rendering the translation selection button in pages with iframes.
- Fixed a memory leak of window/document mouse listeners by implementing `destroy()` cleanup in `Moveable` and calling it when the translation panel is closed.
- Restored named export of `BannerController` and added `stopDomFallback()` to resolve banner controller tests.
- Fixed code style quote error in `options.js`.

## 3.4.1 - 2026-07-03

- Fixed extension process memory leaks and browser crash conditions in development mode by optimizing the hot-reload scanner: replaced resource-heavy `e.file()` API calls with lightweight `e.getMetadata()` and excluded large static folders (`web`, `google`, `icon`) from recursive scanning.

## 3.4.0 - 2026-06-02

- Reverted the recent runtime optimization experiments that caused regressions in the in-page display panel and translation flow, restoring the extension runtime to the previous baseline behavior before continuing leak investigation.
- Refreshed the extension icon set for the current release.
- Documented an unresolved known issue: Chrome resource exhaustion and browser crash conditions are still under investigation and are not considered fixed in this release.

## 3.3.9 - 2026-05-27

- Fixed runaway `chrome.storage.sync` writes that could trigger `MAX_WRITE_OPERATIONS_PER_MINUTE`, flood DevTools with errors, and eventually cause high memory usage or OOM conditions.
- Added missing default settings for display state and tightened settings hydration so valid falsy values are preserved instead of being rewritten repeatedly.
- Updated the extension theme palette: dark mode now follows Tokyo Night Moon, and light mode now follows Kanagawa Lotus across popup, options, and in-page translation panels.

## 3.3.8 - 2026-05-21

- Fixed Chrome freeze/crash issue triggered by rapid or concurrent translation SpeechSynthesis requests by sequentializing cancellation and queuing speak events with timestamp matching.
- Protected message channel parser with type guards and try-catch handling to ignore invalid or non-JSON payloads safely.

## 3.3.7 - 2026-03-31

- Added a reset control in settings to clear persisted TTS voice preferences and theme overrides from older installs.
- Changed the default appearance behavior to follow the OS theme via `auto` mode instead of forcing dark mode on new or reset installs.
- Updated popup, options, and in-page translation UIs to resolve light/dark appearance from the shared theme mode with legacy compatibility for older `DarkMode` settings.
