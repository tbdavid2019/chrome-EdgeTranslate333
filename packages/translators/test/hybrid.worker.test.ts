import HybridTranslator from "../src/translators/hybrid";

describe("hybrid translator MV3 service worker initialization", () => {
    it("constructs without browser globals and no-ops unused speech controls", async () => {
        const names = ["Audio", "DOMParser", "document", "window"] as const;
        const previous = new Map(names.map((name) => [name, (globalThis as any)[name]]));
        jest.useFakeTimers();

        try {
            for (const name of names) {
                Object.defineProperty(globalThis, name, {
                    configurable: true,
                    value: undefined,
                });
            }

            const translator = new HybridTranslator(
                {
                    translators: ["BingTranslate", "GoogleTranslate"],
                    selections: {
                        originalText: "GoogleTranslate",
                        mainMeaning: "GoogleTranslate",
                        tPronunciation: "GoogleTranslate",
                        sPronunciation: "GoogleTranslate",
                        detailedMeanings: "BingTranslate",
                        definitions: "GoogleTranslate",
                        examples: "GoogleTranslate",
                        sourceLanguage: "GoogleTranslate",
                        targetLanguage: "GoogleTranslate",
                    },
                },
                {},
            );

            expect(translator.MAIN_TRANSLATOR).toBe("GoogleTranslate");
            expect(() => translator.REAL_TRANSLATORS.GoogleTranslate.stopPronounce()).not.toThrow();
            expect(() => translator.REAL_TRANSLATORS.BingTranslate.stopPronounce()).not.toThrow();
            await expect(
                translator.REAL_TRANSLATORS.DeepLTranslate.translate("hello", "en", "zh-CN"),
            ).rejects.toMatchObject({
                errorMsg: "DeepL iframe translation requires a document context.",
            });
        } finally {
            for (const [name, value] of previous) {
                Object.defineProperty(globalThis, name, {
                    configurable: true,
                    value,
                });
            }
            jest.clearAllTimers();
            jest.useRealTimers();
        }
    });
});
