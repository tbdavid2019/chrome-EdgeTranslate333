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
});
