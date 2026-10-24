import { h, render } from "preact";
import { act } from "preact/test-utils";
import Panel from "content/display/Panel.jsx";
import Channel from "common/scripts/channel.js";
import { DEFAULT_SETTINGS, getOrSetDefaultSettings } from "common/scripts/settings.js";

jest.mock("react", () => require("preact/compat"));
jest.mock("react-dom", () => require("preact/compat"));
jest.mock("react-shadow/styled-components", () => ({ __esModule: true, default: { div: "div" } }));
jest.mock("simplebar-react/dist/simplebar.min.css", () => "");
jest.mock("simplebar-react", () => ({ __esModule: true, default: "div" }));
jest.mock("content/display/Result.jsx", () => () => null);
jest.mock("content/display/Loading.jsx", () => () => null);
jest.mock("content/display/Error.jsx", () => () => null);
jest.mock("content/display/Dropdown.jsx", () => () => null);
jest.mock("lucide-preact", () => {
    const Settings = function Settings() { return null; };
    const Pin = function Pin() { return null; };
    const PinOff = function PinOff() { return null; };
    const X = function X() { return null; };
    Settings.displayName = "Settings";
    Pin.displayName = "Pin";
    PinOff.displayName = "PinOff";
    X.displayName = "Close";
    return { Settings, Pin, PinOff, X };
});
jest.mock("common/scripts/settings.js", () => {
    const actual = jest.requireActual("common/scripts/settings.js");
    return { ...actual, getOrSetDefaultSettings: jest.fn() };
});
jest.mock("common/scripts/channel.js", () => jest.fn().mockImplementation(() => ({
    on: jest.fn(() => jest.fn()),
    provide: jest.fn(),
    request: jest.fn(() => Promise.resolve(["GoogleTranslate"])),
})));

describe("panel initialization lifecycle", () => {
    it("settles after async settings updates and releases message handlers on unmount", async () => {
        const mediaQuery = { matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() };
        window.matchMedia = jest.fn(() => mediaQuery);
        // Limit resolved reads so the old render/effect loop fails deterministically
        // instead of hanging the test runner.
        getOrSetDefaultSettings.mockImplementation(() =>
            getOrSetDefaultSettings.mock.calls.length > 30
                ? new Promise(() => {})
                : Promise.resolve(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)))
        );
        const container = document.createElement("div");
        document.body.appendChild(container);
        const channel = Channel.mock.results[0].value;
        try {
            await act(async () => { render(h(Panel), container); });
            for (let i = 0; i < 8; i++) await act(async () => { await Promise.resolve(); });
            expect(channel.request).toHaveBeenCalledTimes(1);
            expect(getOrSetDefaultSettings).toHaveBeenCalledTimes(4);
            expect(channel.on).toHaveBeenCalledTimes(7);
            // A parent render must not restart initialization either.
            await act(async () => { render(h(Panel), container); });
            expect(channel.request).toHaveBeenCalledTimes(1);
        } finally {
            act(() => { render(null, container); });
            container.remove();
        }
        for (const result of channel.on.mock.results) expect(result.value).toHaveBeenCalledTimes(1);
        expect(mediaQuery.removeEventListener).toHaveBeenCalledTimes(1);
        delete window.matchMedia;
    });
});
