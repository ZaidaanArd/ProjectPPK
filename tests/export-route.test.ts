import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  isAuthenticated: vi.fn<() => Promise<boolean>>(),
  fetchAuthQuery: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
}))

vi.mock("../src/lib/auth-server", () => mocks)
vi.mock("../src/lib/data-mode", () => ({ isStaticMode: false }))

import { GET } from "../src/app/api/admin/export/route"

const url = "http://localhost/api/admin/export?kind=summary"
const admin = {
  id: "admin",
  name: "Admin",
  email: "admin@example.test",
  role: "admin",
  status: "active",
  mustChangePassword: false,
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.isAuthenticated.mockResolvedValue(true)
})

describe("admin CSV export", () => {
  it("returns 401 without a session", async () => {
    mocks.isAuthenticated.mockResolvedValue(false)
    expect((await GET(new Request(url))).status).toBe(401)
    expect(mocks.fetchAuthQuery).not.toHaveBeenCalled()
  })

  it("returns 403 for a non-admin account", async () => {
    mocks.fetchAuthQuery.mockResolvedValue({ ...admin, role: "user" })
    expect((await GET(new Request(url))).status).toBe(403)
  })

  it("returns 500 and logs unexpected backend failures", async () => {
    mocks.fetchAuthQuery
      .mockResolvedValueOnce(admin)
      .mockRejectedValueOnce(new Error("backend unavailable"))
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    try {
      expect((await GET(new Request(url))).status).toBe(500)
      expect(log).toHaveBeenCalled()
    } finally {
      log.mockRestore()
    }
  })

  it("exports all-time per-facility metrics with safe CSV cells", async () => {
    mocks.fetchAuthQuery.mockResolvedValueOnce(admin).mockResolvedValueOnce({
      facilityUsage: [
        {
          name: "=A1",
          location: "Gedung A",
          approvedReservations: 2,
          reservedMinutes: 90,
          reports: 1,
        },
      ],
    })
    const response = await GET(new Request(url))
    expect(response.status).toBe(200)
    expect(await response.text()).toContain('"\'=A1","Gedung A","2","90","1"')
    expect(response.headers.get("content-type")).toContain("text/csv")
  })
})
