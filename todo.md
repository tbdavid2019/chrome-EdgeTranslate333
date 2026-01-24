Build
- 進到 packages/EdgeTranslate
- 安裝依賴：npm install
- 全平台：npm run build
- 分平台：
  - Chrome：npm run pack:chrome
  - Firefox：npm run pack:firefox
  - Safari：npm run build:safari && npm run safari:rsync
輸出位置
- Chrome：packages/EdgeTranslate/build/chrome/
- Firefox：packages/EdgeTranslate/build/firefox/
- Safari：packages/EdgeTranslate/build/safari/（會 rsync 到 packages/EdgeTranslate/safari-xcode/EdgeTranslate/EdgeTranslate Extension/Resources/）
測試方式
1) Chrome：chrome://extensions → 開發人員模式 → 載入未封裝 → 選 packages/EdgeTranslate/build/chrome/  
2) Firefox：about:debugging → This Firefox → Load Temporary Add-on → 選 packages/EdgeTranslate/build/firefox/ 內任一檔案  
3) Safari：跑 npm run dev:safari 後，用 Xcode 專案開 packages/EdgeTranslate/safari-xcode/EdgeTranslate 進行測試
需要我幫你把這次改動跑一次 build/測試也可以。
▣  Sisyphus · gpt-5.2-codex · 10.6s
若我要上傳到 chrome web store .. manifest 檔案在哪裡？ 我要改編輯
Chrome Web Store 用的是 build 產物裡的 manifest.json。
- 原始檔（要改的）：packages/EdgeTranslate/src/manifest.json
- Build 後的輸出：packages/EdgeTranslate/build/chrome/manifest.json
建議只改 packages/EdgeTranslate/src/manifest.json，再重新 build，避免改到產出檔被覆蓋。
你要改的是版本號還是權限？我可以幫你標出對應欄位。