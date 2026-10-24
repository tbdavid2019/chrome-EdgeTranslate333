jest.mock("content/display/library/notifier/notifier.jsx", () => ({
    __esModule: true,
    default: () => null,
}));
jest.mock("preact-render-to-string", () => jest.fn());
jest.mock("common/scripts/promise.js", () => ({
    delayPromise: jest.fn(() => Promise.resolve()),
}));

import Notifier from "content/display/library/notifier/notifier.js";

describe("notifier close control", () => {
    let notifier;

    beforeEach(() => {
        notifier = new Notifier();
        notifier.createContainer();
    });

    afterEach(() => {
        if (notifier.notifierContainer?.isConnected) notifier.destroyContainer();
    });

    it("finds a close button through the composed event path", () => {
        const notification = document.createElement("div");
        notification.classList.add("edge-translate-notifier-item");
        const closeButton = document.createElement("button");
        closeButton.classList.add("edge-translate-notifier-close");
        notification.appendChild(closeButton);
        notifier.shadowDom.appendChild(notification);
        const destroy = jest.spyOn(notifier, "destroyNotification").mockResolvedValue();

        closeButton.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));

        expect(destroy).toHaveBeenCalledWith(notification);
    });

    it("removes a notification only once when close and timeout overlap", async () => {
        const notification = document.createElement("div");
        notification.classList.add("edge-translate-notifier-item");
        notifier.shadowDom.appendChild(notification);
        notifier.notificationCount = 1;

        await Promise.all([
            notifier.destroyNotification(notification),
            notifier.destroyNotification(notification),
        ]);

        expect(notifier.notificationCount).toBe(0);
        expect(notifier.shadowDom).toBeNull();
    });
});
