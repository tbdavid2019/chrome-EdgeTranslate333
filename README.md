## EdgeTranslate-v3 (MV3)

本專案是 Edge Translate 的分支，已針對 Manifest V3 與現行瀏覽器政策重構。原始 MV2 版本下架後，本專案維持相同使用體驗並提升穩定性。

- 原始倉庫：[EdgeTranslate/EdgeTranslate](https://github.com/EdgeTranslate/EdgeTranslate)

感謝原作者：https://github.com/Meapri/EdgeTranslate-v3

### 主要功能

- 選取翻譯與側邊彈窗：結果以側邊面板呈現，不中斷閱讀流程。可自訂顯示項（常用釋義、發音、定義/詳解、例句等），並可釘選面板。
- PDF 翻譯/檢視器：內建 pdf.js 檢視器，支援在 PDF 內翻譯單字/句子。加入頁面深色模式（顏色反轉）與 UI 調整以提升可讀性。
- 整頁翻譯（僅限 Chrome）：可從右鍵選單按需觸發，不會自動執行。Safari/Firefox 不提供。
- 快捷鍵：使用鍵盤即可快速操作選取翻譯、釘選/取消釘選結果面板、展開面板等。
- 黑名單：將目前頁面/網域加入封鎖清單，在該頁停用選取/雙擊翻譯。
- 文字轉語音（TTS）：優先選用更高品質的語音，朗讀更自然。

### 瀏覽器支援與限制

- Chrome：選取翻譯、PDF 檢視器、整頁翻譯
- Firefox：選取翻譯、PDF 檢視器（受瀏覽器問題限制部分功能）、不提供整頁翻譯
- Safari（macOS）：選取翻譯、PDF 檢視器、不提供整頁翻譯（平台政策/限制）

### 隱私與安全

- 不蒐集分析/統計，不進行追蹤
- 最小權限原則
- 在 Chrome 上，如需存取 `file://` 頁面，可能需要啟用「允許存取檔案 URL」

### 安裝（開發/測試用）

Chrome（開發人員模式）

1. 開啟 `chrome://extensions` 並啟用開發人員模式
2. 完成建置後選擇「載入未封裝項目」→ 指向 `build/chrome`

Firefox（Temporary Load）

1. 開啟 `about:debugging` → Load Temporary Add-on → 指向 `build/firefox` 內任一檔案

Safari（macOS）

1. 使用 Xcode 專案執行（見開發/建置）

### 開發 / 建置

工作目錄：`packages/EdgeTranslate`

1. 安裝依賴

```
cd packages/EdgeTranslate
npm install
```

2. 同時建置多瀏覽器

```
npm run build
```

或分別建置

```
npm run pack:chrome
npm run pack:firefox
npm run build:safari && npm run safari:rsync
```

3. Safari 開發（Xcode 同步流程）

```
npm run dev:safari
```

資源會同步到 `safari-xcode/EdgeTranslate/EdgeTranslate Extension/Resources/`。

4. Safari 發佈流程（可選）

```
npm run safari:release
```

需要設定環境變數（App Store 憑證）。

建置輸出

- Chrome：`packages/EdgeTranslate/build/chrome/`
- Firefox：`packages/EdgeTranslate/build/firefox/`
- Safari resources：`packages/EdgeTranslate/build/safari/` → rsync 到 Xcode

### Host 權限

常駐內容腳本（選取翻譯等）需要全域 host 權限。Chrome 使用 `host_permissions: ["*://*/*"]`；Firefox/Safari 以 `<all_urls>` 匹配內容腳本。專案遵循最小權限原則。

### 文件

- 原專案文件（功能參考）：
  - Instructions: [Edge Translate Instructions](https://github.com/EdgeTranslate/EdgeTranslate/blob/master/docs/wiki/en/Instructions.md)
  - Precautions: [Edge Translate Precautions](https://github.com/EdgeTranslate/EdgeTranslate/blob/master/docs/wiki/en/Precautions.md)

### License

- MIT AND NPL，與原專案一致
- License files: [LICENSE.MIT](./LICENSE.MIT), [LICENSE.NPL](./LICENSE.NPL)

### Credits

- 感謝 Edge Translate 原作者與所有貢獻者
- 此分支將專案升級為 MV3 與現代瀏覽器相容，保留原有 UX

---

### English

A fork of Edge Translate refactored for Manifest V3, modern build tooling, and current browser policies. After the original MV2-based version was removed from stores, this project modernizes the code and build to preserve the same user experience with improved stability.

- Original repo: [EdgeTranslate/EdgeTranslate](https://github.com/EdgeTranslate/EdgeTranslate)

Thanks to the original author: https://github.com/Meapri/EdgeTranslate-v3

### Key Features

- Selection translation with side popup: Shows results in a side panel so your reading flow isn’t interrupted. You can customize visible sections (common meanings, pronunciation, definitions/detailed explanations, examples, etc.) and pin the panel.
- PDF translation/viewer: Built-in pdf.js viewer supports word/sentence translation within PDFs. Page dark mode (color inversion) and UI tweaks improve readability.
- Full-page translation (Chrome only): Trigger from the context menu when needed. It never runs automatically. Not available on Safari/Firefox.
- Shortcuts: Quickly operate selection translation, pin/unpin the result panel, and expand panels using only the keyboard.
- Blacklist: Add the current page/domain to disable selection/double-click translation on that page.
- Text-to-Speech (TTS): Prefers higher-quality voices for more natural reading.

### Browser Support and Limits

- Chrome: Selection translation, PDF viewer, full-page translation
- Firefox: Selection translation, PDF viewer (some limitations due to browser issues), no full-page translation
- Safari (macOS): Selection translation, PDF viewer, no full-page translation (platform policies/limits)

### Privacy & Security

- No analytics/statistics collection; no tracking
- Minimal-permissions principle
- On Chrome, “Allow access to file URLs” may be needed for file:// pages

### Installation (for development/testing)

Chrome (Developer Mode)

1. Open `chrome://extensions` and enable Developer mode
2. Build below, then “Load unpacked” → select `build/chrome`

Firefox (Temporary Load)

1. Open `about:debugging` → Load Temporary Add-on → select any file in `build/firefox`

Safari (macOS)

1. Run via the Xcode project with synchronized resources (see Development/Build)

### Development / Build

Working directory: `packages/EdgeTranslate`

1. Install dependencies

```
cd packages/EdgeTranslate
npm install
```

2. Build all browsers in parallel

```
npm run build
```

Or per-browser

```
npm run pack:chrome
npm run pack:firefox
npm run build:safari && npm run safari:rsync
```

3. Safari development (Xcode sync workflow)

```
npm run dev:safari
```

Resources sync to `safari-xcode/EdgeTranslate/EdgeTranslate Extension/Resources/`.

4. Optional Safari release automation (archive/export/upload)

```
npm run safari:release
```

Requires environment variables (App Store credentials, etc.).

Build outputs

- Chrome: `packages/EdgeTranslate/build/chrome/`
- Firefox: `packages/EdgeTranslate/build/firefox/`
- Safari resources: `packages/EdgeTranslate/build/safari/` → rsync to Xcode

### Host Permissions

Global host permissions are required for always-on content scripts (selection translation, etc.). Chrome uses `host_permissions: ["*://*/*"]`; Firefox/Safari use `<all_urls>`-matched content scripts. The extension adheres to a minimal-permissions approach.

### Documentation

- Original project docs (general feature reference):
  - Instructions: [Edge Translate Instructions](https://github.com/EdgeTranslate/EdgeTranslate/blob/master/docs/wiki/en/Instructions.md)
  - Precautions: [Edge Translate Precautions](https://github.com/EdgeTranslate/EdgeTranslate/blob/master/docs/wiki/en/Precautions.md)

### License

- MIT AND NPL, same as the original project
- License files: [LICENSE.MIT](./LICENSE.MIT), [LICENSE.NPL](./LICENSE.NPL)

### Credits

- Thanks to the original Edge Translate and all contributors.
- This fork rebuilds the project for MV3 and modern browsers while preserving the original UX.
