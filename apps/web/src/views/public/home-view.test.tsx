import { render, screen } from "@testing-library/react"
import { createElement } from "react"

import { Component } from "./home-view"

describe("public home", () => {
  it("explains the core service without requiring login", () => {
    render(createElement(Component))

    expect(
      screen.getByRole("heading", {
        name: /temukan ruang. atur waktu. jaga kampus/i,
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /cek fasilitas/i })
    ).toHaveAttribute("href", "/facilities")
    expect(screen.getByText(/slot tetap 30 menit/i)).toBeInTheDocument()
  })
})
