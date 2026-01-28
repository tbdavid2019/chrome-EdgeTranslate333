# EdgeTranslate333

- 暗黑模式
- 支援 Google Translate 的 how to pronouncing
- 改進的 UI/UX 設計




---

感謝原作者：https://github.com/Meapri/EdgeTranslate-v3


- 選取翻譯與側邊彈窗：結果以側邊面板呈現，不中斷閱讀流程。可自訂顯示項（常用釋義、發音、定義/詳解、例句等），並可釘選面板。
- PDF 翻譯/檢視器：內建 pdf.js 檢視器，支援在 PDF 內翻譯單字/句子。加入頁面深色模式（顏色反轉）與 UI 調整以提升可讀性。
- 整頁翻譯（僅限 Chrome）：可從右鍵選單按需觸發，不會自動執行。Safari/Firefox 不提供。
- 快捷鍵：使用鍵盤即可快速操作選取翻譯、釘選/取消釘選結果面板、展開面板等。
- 黑名單：將目前頁面/網域加入封鎖清單，在該頁停用選取/雙擊翻譯。
- 文字轉語音（TTS）：優先選用更高品質的語音，朗讀更自然。


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



### Credits

- 感謝 Edge Translate 原作者與所有貢獻者
- 此分支將專案升級為 MV3 與現代瀏覽器相容，保留原有 UX

---

## Changelog

### v3.3.2 (2026-01-28)

**修復：PDF 檢視器黑屏問題 (Chrome)**

- **問題**：在部分 Chrome 版本中開啟 PDF 時，頁面會顯示一片黑。
- **原因**：專案使用的 `pdfjs-dist` v5.4.54 依賴 `Promise.withResolvers` API，此 API 在 Chrome 119 之前的版本中不存在。雖然專案中有 `et-pdfjs-polyfill.js` 修補程式，但該檔案存在語法錯誤且未被載入。
- **修復**：
  1. 修正 `et-pdfjs-polyfill.js` 的語法錯誤（移除多餘的巢狀判斷並補上缺少的大括號）。
  2. 在 `viewer.html` 中於 PDF.js 核心腳本之前載入該修補程式，確保相容性。

---
