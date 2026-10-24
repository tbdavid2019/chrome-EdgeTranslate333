/** @jsx h */
import { h, render } from "preact";
import { act } from "preact/test-utils";
import Dropdown from "content/display/Dropdown.jsx";

jest.mock("react", () => require("preact/compat"));
jest.mock("react-dom", () => require("preact/compat"));
jest.mock("lucide-preact", () => ({ ChevronDown: () => null }));

function keydown(element, key) {
    element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
}

describe("translator dropdown keyboard behavior", () => {
    let container;
    let raf;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        raf = window.requestAnimationFrame;
        window.requestAnimationFrame = (callback) => callback();
    });

    afterEach(() => {
        act(() => render(null, container));
        container.remove();
        window.requestAnimationFrame = raf;
    });

    it("opens with Enter, moves through options, and Escape restores focus", () => {
        act(() => render(
            <Dropdown title="Translator" activeKey="one">
                <Dropdown.Item eventKey="one">First</Dropdown.Item>
                <Dropdown.Item eventKey="two">Second</Dropdown.Item>
            </Dropdown>,
            container,
        ));
        const title = container.querySelector("button");

        title.focus();
        act(() => keydown(title, "Enter"));
        const options = container.querySelectorAll("[role=menuitemradio]");
        expect(title.getAttribute("aria-expanded")).toBe("true");
        expect(document.activeElement).toBe(options[0]);

        act(() => keydown(options[0], "ArrowDown"));
        expect(document.activeElement).toBe(options[1]);
        act(() => keydown(options[1], "Escape"));
        expect(title.getAttribute("aria-expanded")).toBe("false");
        expect(document.activeElement).toBe(title);
    });

    it("selects an option with Enter and closes the menu", () => {
        const onSelect = jest.fn();
        act(() => render(
            <Dropdown title="Translator" activeKey="one" onSelect={onSelect}>
                <Dropdown.Item eventKey="one">First</Dropdown.Item>
                <Dropdown.Item eventKey="two">Second</Dropdown.Item>
            </Dropdown>,
            container,
        ));
        const title = container.querySelector("button");
        title.focus();
        act(() => keydown(title, " "));
        const options = container.querySelectorAll("[role=menuitemradio]");
        act(() => keydown(options[0], "ArrowDown"));
        act(() => keydown(options[1], "Enter"));

        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect.mock.calls[0][0]).toBe("two");
        expect(title.getAttribute("aria-expanded")).toBe("false");
        expect(document.activeElement).toBe(title);
    });

    it("uses the translator label when the current provider title is unavailable", () => {
        act(() => render(
            <Dropdown title="" aria-label="Default Page Translator" activeKey="one">
                <Dropdown.Item eventKey="one">First</Dropdown.Item>
                <Dropdown.Item eventKey="two">Second</Dropdown.Item>
            </Dropdown>,
            container,
        ));

        expect(container.querySelector("button").getAttribute("aria-label")).toBe("Default Page Translator");
    });
});
