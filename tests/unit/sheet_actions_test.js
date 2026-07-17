import * as shoulda from "@philc/shoulda";
const { assert, context, setup, should, stub } = shoulda;
import "../../content_scripts/keyboard_utils.js";
import "../../content_scripts/sheet_actions.js";
import * as jsdom from "jsdom";

export function jsdomStub(html) {
  const w = new jsdom.JSDOM(html).window;
  stub(globalThis, "window", w);
  stub(globalThis, "document", w.document);
}

context("openCellAsUrl", () => {
  setup(() => {
    SheetActions.typeKeyFn = function () {};
  });

  should("open embedded anchor tags", () => {
    const html = `<div id='t-formula-bar-input-container'>
      <div class='cell-input'>
        <a data-sheets-formula-bar-text-link='example1.com'></a>
        <a data-sheets-formula-bar-text-link='example2.com'></a>
      </div>
    </div>`;
    jsdomStub(html);
    const opened = [];
    stub(window, "open", (url) => {
      opened.push(url);
    });
    SheetActions.openCellAsUrl();
    assert.equal(["example1.com", "example2.com"], opened);
  });

  should("open HYPERLINK formulas", () => {
    const html = `<div id='t-formula-bar-input-container'>
      <div class='cell-input'>
        hello HYPERLINK("example.com", "caption") world
      </div>
    </div>`;
    jsdomStub(html);
    const opened = [];
    stub(window, "open", (url) => {
      opened.push(url);
    });
    SheetActions.openCellAsUrl();
    assert.equal(["example.com"], opened);
  });

  should("open HYPERLINK formulas which are cell references", () => {
    const html = `<div id='t-formula-bar-input-container'>
      <div class='cell-input'>
        hello HYPERLINK("#gid=123&range=A9") world
      </div>
    </div>`;
    jsdomStub(html);
    const opened = [];
    stub(window, "open", (url) => {
      opened.push(url);
    });
    SheetActions.openCellAsUrl();
    assert.equal([], opened);
    assert.equal("#gid=123&range=A9", window.location.hash);
  });

  should("open URL-like strings", () => {
    const html = `<div id='t-formula-bar-input-container'>
      <div class='cell-input'>
        hello https://example.com world
      </div>
    </div>`;
    jsdomStub(html);
    const opened = [];
    stub(window, "open", (url) => {
      opened.push(url);
    });
    SheetActions.openCellAsUrl();
    assert.equal(["https://example.com"], opened);
  });
});

context("color picker actions", () => {
  setup(() => {
    SheetActions.typeKeyFn = function () {};
  });

  should("find the fill palette button with aria-label prefixes", () => {
    const html = `
      <button id="fill-color-btn" aria-label="Fill color (Alt+Shift+5)"></button>
      <button id="text-color-btn" aria-label="Text color"></button>
    `;
    jsdomStub(html);
    const paletteButton = SheetActions.getColorPaletteButton("cell");
    assert.equal("fill-color-btn", paletteButton.id);
  });

  should("find the fill palette button with aria-label sentence suffixes", () => {
    const html = `
      <button id="fill-color-btn" aria-label="Fill color. Currently white"></button>
    `;
    jsdomStub(html);
    const paletteButton = SheetActions.getColorPaletteButton("cell");
    assert.equal("fill-color-btn", paletteButton.id);
  });

  should("find the fill palette button with tooltip labels", () => {
    const html = `
      <button id="fill-color-btn" data-tooltip="Fill color (Alt+Shift+5)"></button>
    `;
    jsdomStub(html);
    const paletteButton = SheetActions.getColorPaletteButton("cell");
    assert.equal("fill-color-btn", paletteButton.id);
  });

  should("find the fill palette button with UK spelling", () => {
    const html = `
      <button id="fill-colour-btn" aria-label="Fill colour"></button>
    `;
    jsdomStub(html);
    const paletteButton = SheetActions.getColorPaletteButton("cell");
    assert.equal("fill-colour-btn", paletteButton.id);
  });

  should("return clickable parent for color swatch and click palette twice", () => {
    const html = `
      <button id="fill-color-btn" aria-label="Fill color"></button>
      <button id="light-yellow-btn"><span aria-label="light yellow 3: selected"></span></button>
    `;
    jsdomStub(html);
    const clicked = [];
    stub(KeyboardUtils, "simulateClick", (el) => clicked.push(el.id));
    const colorButton = SheetActions.getColorButton("light yellow 3", "cell");
    assert.equal("light-yellow-btn", colorButton.id);
    assert.equal(["fill-color-btn", "fill-color-btn"], clicked);
  });
});
