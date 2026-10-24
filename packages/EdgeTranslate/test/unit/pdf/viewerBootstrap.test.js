import fs from "fs";
import path from "path";
import { normalizeViewerUrl } from "../../../web/et-viewer-url";

const packageRoot = path.resolve(__dirname, "../../..");

describe("PDF viewer bootstrap URLs", () => {
    test("preserves signed URL escapes without preloading or rewriting ordinary URLs", () => {
        const source = "http://127.0.0.1:8766/document?id=a%2Fb%2520";
        const viewerUrl = `chrome-extension://test/web/viewer.html?file=${encodeURIComponent(source)}`;
        const normalized = normalizeViewerUrl(viewerUrl);

        expect(normalized.file).toBe(source);
        expect(normalized.href).toBe(viewerUrl);
        expect(normalized.recoveredLegacyBlob).toBe(false);

        const bootstrap = fs.readFileSync(path.join(packageRoot, "web/et-viewer-init.mjs"), "utf8");
        expect(bootstrap).not.toMatch(/fetch\s*\(/);
        expect(bootstrap).not.toMatch(/createObjectURL\s*\(/);
    });

    test("restores a legacy blob URL from the source parameter without decoding twice", () => {
        const source = "https://example.test/report?id=a%2Fb%2520";
        const viewerUrl = new URL("chrome-extension://test/web/viewer.html");
        viewerUrl.searchParams.set("file", "blob:https://example.test/expired");
        viewerUrl.searchParams.set("source", source);

        const normalized = normalizeViewerUrl(viewerUrl.href);
        expect(normalized.file).toBe(source);
        expect(normalized.recoveredLegacyBlob).toBe(true);
        expect(new URL(normalized.href).searchParams.get("file")).toBe(source);
    });
});

describe("PDF.js package assets", () => {
    test("packages all runtime resource directories from the installed PDF.js version", () => {
        const gulpfile = fs.readFileSync(path.join(packageRoot, "gulpfile.js"), "utf8");
        for (const asset of ["cmaps", "standard_fonts", "wasm", "iccs"]) {
            expect(fs.existsSync(path.resolve(packageRoot, `../../node_modules/pdfjs-dist/${asset}`))).toBe(true);
            expect(gulpfile).toContain(`pdfjs-dist/${asset}/**/*`);
        }
        expect(gulpfile).toContain('pdfjs-dist/build/*.mjs');
    });
});
