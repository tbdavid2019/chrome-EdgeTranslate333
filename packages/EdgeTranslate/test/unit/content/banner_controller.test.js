jest.mock("common/scripts/channel.js", () =>
    jest.fn().mockImplementation(() => ({
        on: jest.fn(),
    }))
);

describe("test banner controller cleanup", () => {
    let BannerController;

    beforeEach(async () => {
        jest.resetModules();
        global.cancelAnimationFrame = jest.fn();
        const module = await import("content/banner_controller.js");
        BannerController = module.BannerController;
    });

    it("stops mutation observer and clears pending state", () => {
        const disconnect = jest.fn();
        const controller = new BannerController();

        controller._mo = { disconnect };
        controller._scheduleBatch = 11;
        controller._pendingNodes.add(document.createTextNode("hello"));

        controller.stopDomFallback();

        expect(cancelAnimationFrame).toHaveBeenCalledWith(11);
        expect(disconnect).toHaveBeenCalledTimes(1);
        expect(controller._mo).toBeNull();
        expect(controller._scheduleBatch).toBeNull();
        expect(controller._pendingNodes.size).toBe(0);
    });
    it("honors fallback cancellation and the cancel translation command", () => {
        const controller = new BannerController();
        const handlers = Object.fromEntries(controller.channel.on.mock.calls);
        controller.stopDomFallback = jest.fn();
        handlers.page_translate_control({ action: "cancel_dom_fallback" });
        handlers.command({ command: "cancel_page_translate" });
        expect(controller.stopDomFallback).toHaveBeenCalledTimes(2);
    });

    it("does not start fallback after Google has displayed its banner", () => {
        const controller = new BannerController();
        const handlers = Object.fromEntries(controller.channel.on.mock.calls);
        controller.currentTranslator = "google";
        controller.lastDistance = 40;
        controller.startDomFallback = jest.fn();
        handlers.start_dom_page_translate();
        expect(controller.startDomFallback).not.toHaveBeenCalled();
    });

    it("bounds retained nodes while animation frames are suspended", async () => {
        const originalRaf = global.requestAnimationFrame;
        global.requestAnimationFrame = jest.fn(() => 1);
        const controller = new BannerController();
        const container = document.createElement("div");
        document.body.appendChild(container);
        try {
            controller.startDomFallback();
            for (let i = 0; i < 2000; i++) {
                container.appendChild(document.createTextNode(`text ${i}`));
            }
            await Promise.resolve();
            expect(controller._pendingNodes.size).toBe(512);
            expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
        } finally {
            controller.stopDomFallback();
            container.remove();
            global.requestAnimationFrame = originalRaf;
        }
        expect(controller._pendingNodes.size).toBe(0);
    });

    it("resets the previous Google banner distance when translation starts again", () => {
        const controller = new BannerController();
        const handlers = Object.fromEntries(controller.channel.on.mock.calls);
        controller.lastDistance = 40;
        handlers.start_page_translate({ translator: "google" });
        expect(controller.lastDistance).toBeNull();
        controller.canceller();
    });

});
