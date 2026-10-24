import Channel from "common/scripts/channel.js";

const listeners = [];

function setupChannel() {
    listeners.length = 0;
    global.BROWSER_ENV = "chrome";
    global.chrome = {
        runtime: {
            lastError: undefined,
            onMessage: {
                addListener: jest.fn((listener) => listeners.push(listener)),
            },
            sendMessage: jest.fn((message, callback) => {
                return listeners[0](JSON.parse(message), { tab: { id: 3 } }, callback);
            }),
        },
        tabs: {
            sendMessage: jest.fn(),
        },
    };
    return new Channel();
}

const requestMessage = (service, params = {}) => JSON.stringify({
    type: "service",
    service,
    params,
});

describe("Channel service failures", () => {
    it("responds once to a synchronous service throw", async () => {
        setupChannel().provide("sync-failure", () => {
            throw new TypeError("bad request");
        });
        const callback = jest.fn();
        const keepPortOpen = listeners[0](requestMessage("sync-failure"), {}, callback);

        expect(keepPortOpen).toBe(true);
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls[0][0]).toMatchObject({
            __edgeTranslateChannelServiceError__: true,
            name: "TypeError",
            message: "bad request",
        });
    });

    it("responds once when a service promise rejects", async () => {
        setupChannel().provide("async-failure", () => Promise.reject(new Error("offline")));
        const callback = jest.fn();
        listeners[0](requestMessage("async-failure"), {}, callback);

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls[0][0]).toMatchObject({
            __edgeTranslateChannelServiceError__: true,
            name: "Error",
            message: "offline",
        });
    });

    it("rejects request() with the service error and preserves successful payloads", async () => {
        const channel = setupChannel();
        channel.provide("failure", () => Promise.reject(new Error("provider failed")));
        channel.provide("success", () => Promise.resolve({ value: 7 }));

        await expect(channel.request("failure")).rejects.toMatchObject({
            name: "Error",
            message: "provider failed",
        });
        await expect(channel.request("success")).resolves.toEqual({ value: 7 });
    });

    it("unwraps service errors for Chrome and Firefox tab requests", async () => {
        const envelope = {
            __edgeTranslateChannelServiceError__: true,
            name: "RangeError",
            message: "tab service failed",
        };
        const channel = setupChannel();
        chrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => callback(envelope));
        await expect(channel.requestToTab(5, "failure")).rejects.toMatchObject({
            name: "RangeError",
            message: "tab service failed",
        });

        global.BROWSER_ENV = "firefox";
        global.browser = { tabs: { sendMessage: jest.fn(() => Promise.resolve(envelope)) } };
        await expect(channel.requestToTab(5, "failure")).rejects.toMatchObject({
            name: "RangeError",
            message: "tab service failed",
        });
        expect(browser.tabs.sendMessage).toHaveBeenCalledWith(5, expect.any(String));
    });
});
