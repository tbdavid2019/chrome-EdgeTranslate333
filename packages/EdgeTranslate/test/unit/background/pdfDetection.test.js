import { createCache, setupPdfDetection } from "background/library/pdfDetection.js";

describe("PDF detection memory bounds", () => {
    it("bounds unique URLs even when none are ever read again", () => {
        const cache = createCache(5000, 256);
        for (let i = 0; i < 10000; i++) cache.set(`https://example.com/${i}`, { isPdf: false });
        expect(cache.size).toBe(256);
        expect(cache.get("https://example.com/0")).toBeUndefined();
    });

    it("prunes expired entries on writes and keeps recently used entries", () => {
        jest.spyOn(Date, "now").mockReturnValue(0);
        const cache = createCache(100, 2);
        cache.set("a", 1);
        cache.set("b", 2);
        cache.get("a");
        cache.set("c", 3);
        expect(cache.get("b")).toBeUndefined();
        Date.now.mockReturnValue(101);
        cache.set("d", 4);
        expect(cache.size).toBe(1);
        Date.now.mockRestore();
    });

    it("does not re-fetch ordinary pages on a header cache miss", async () => {
        global.fetch = jest.fn();
        let listener;
        const addListener = jest.spyOn(chrome.webNavigation.onCommitted, "addListener")
            .mockImplementation((callback) => { listener = callback; });
        const detection = setupPdfDetection();
        await listener({ frameId: 0, tabId: 1, url: "https://example.com/article" });
        expect(fetch).not.toHaveBeenCalled();
        detection.dispose();
        addListener.mockRestore();
        delete global.fetch;
    });
    it.each([0, -1, NaN, Infinity])("safely bounds invalid capacity %s", (capacity) => {
        const cache = createCache(100, capacity);
        for (let i = 0; i < 300; i++) cache.set(i + 1, i);
        expect(cache.size).toBeGreaterThan(0);
        expect(cache.size).toBeLessThanOrEqual(256);
    });

    it("keeps MIME-confirmed PDFs without URL hints after the navigation cache expires", async () => {
        jest.useFakeTimers();
        global.fetch = jest.fn();
        let onHeaders, onNavigation;
        const headerSpy = jest.spyOn(chrome.webRequest.onHeadersReceived, "addListener")
            .mockImplementation((listener) => { onHeaders = listener; });
        const navSpy = jest.spyOn(chrome.webNavigation.onCommitted, "addListener")
            .mockImplementation((listener) => { onNavigation = listener; });
        const updateSpy = jest.spyOn(chrome.tabs, "update").mockResolvedValue({});
        const detection = setupPdfDetection({ config: { redirectDelayMs: 20000 } });
        try {
            const url = "https://example.com/document/12345";
            onHeaders({ frameId: 0, tabId: 1, url,
                responseHeaders: [{ name: "content-type", value: "application/pdf" }] });
            jest.advanceTimersByTime(6000);
            await onNavigation({ frameId: 0, tabId: 1, url });
            expect(fetch).not.toHaveBeenCalled();
            expect(updateSpy).toHaveBeenCalledWith(1, {
                url: expect.stringContaining(encodeURIComponent(url)),
            });
        } finally {
            detection.dispose();
            jest.clearAllTimers();
            jest.useRealTimers();
            headerSpy.mockRestore();
            navSpy.mockRestore();
            updateSpy.mockRestore();
            delete global.fetch;
        }
    });

    it("probes opaque PDF URLs when the response header API is unavailable", async () => {
        let onNavigation;
        const headerSpy = jest.spyOn(chrome.webRequest.onHeadersReceived, "addListener")
            .mockImplementation(() => { throw new Error("API unavailable"); });
        const navSpy = jest.spyOn(chrome.webNavigation.onCommitted, "addListener")
            .mockImplementation((listener) => { onNavigation = listener; });
        const updateSpy = jest.spyOn(chrome.tabs, "update").mockResolvedValue({});
        global.fetch = jest.fn().mockResolvedValue({
            headers: { get: (key) => key === "content-type" ? "application/pdf" : null },
            ok: true, status: 200, url: "https://example.com/document/12345",
        });
        const detection = setupPdfDetection();
        try {
            await onNavigation({ frameId: 0, tabId: 1, url: "https://example.com/document/12345" });
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(updateSpy).toHaveBeenCalledTimes(1);
        } finally {
            detection.dispose();
            headerSpy.mockRestore();
            navSpy.mockRestore();
            updateSpy.mockRestore();
            delete global.fetch;
        }
    });

});
