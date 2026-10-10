import { createElement } from "react"
import { renderToString } from "react-dom/server"
import { expect, it } from "vitest"

import { MermaidLightbox } from "../src/components/mermaid-lightbox"

it("renders safely on the server without browser globals", () => {
  expect(typeof document).toBe("undefined")
  expect(
    renderToString(
      createElement(MermaidLightbox, {
        svg: '<svg viewBox="0 0 100 100"></svg>',
        title: "Diagram",
        onClose: () => {},
      })
    )
  ).toBe("")
})
