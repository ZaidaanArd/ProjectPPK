import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"

import { Component } from "./login-view"

describe("login form", () => {
  it("runs client-side validation before submission", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Component />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/email kampus/i), "bukan-email")
    await user.type(screen.getByLabelText(/kata sandi/i), "pendek")
    await user.click(screen.getByRole("button", { name: /^masuk$/i }))

    expect(
      await screen.findByText(/alamat email yang valid/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/minimal 8 karakter/i)).toBeInTheDocument()
  })
})
