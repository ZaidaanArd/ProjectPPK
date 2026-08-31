import { createBrowserRouter } from "react-router-dom"

import { AuthLayout } from "@/app/layouts/auth-layout"
import { PortalLayout } from "@/app/layouts/portal-layout"
import { ProtectedLayout } from "@/app/layouts/protected-layout"
import { RootLayout } from "@/app/layouts/root-layout"
import { RouteFallback } from "@/components/route-fallback"

export const routes = [
  {
    element: <RootLayout />,
    HydrateFallback: RouteFallback,
    children: [
      { index: true, lazy: () => import("@/views/public/home-view") },
      {
        path: "facilities",
        lazy: () => import("@/views/public/facilities-view"),
      },
      {
        path: "forbidden",
        lazy: () => import("@/views/errors/forbidden-view"),
      },
      { path: "*", lazy: () => import("@/views/errors/not-found-view") },
    ],
  },
  {
    element: <AuthLayout />,
    HydrateFallback: RouteFallback,
    children: [
      { path: "login", lazy: () => import("@/views/auth/login-view") },
      { path: "register", lazy: () => import("@/views/auth/register-view") },
    ],
  },
  {
    element: <ProtectedLayout roles={["user"]} />,
    HydrateFallback: RouteFallback,
    children: [
      {
        path: "app",
        element: <PortalLayout kind="user" />,
        children: [
          {
            index: true,
            lazy: () => import("@/views/user/user-dashboard-view"),
          },
          {
            path: "reservations",
            lazy: () => import("@/views/user/reservations-view"),
          },
          {
            path: "reservations/new",
            lazy: () => import("@/views/user/reservation-form-view"),
          },
          {
            path: "reports",
            lazy: () => import("@/views/user/reports-view"),
          },
          {
            path: "reports/new",
            lazy: () => import("@/views/user/report-form-view"),
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedLayout roles={["officer", "admin"]} />,
    HydrateFallback: RouteFallback,
    children: [
      {
        path: "staff",
        element: <PortalLayout kind="staff" />,
        children: [
          {
            index: true,
            lazy: () => import("@/views/staff/staff-dashboard-view"),
          },
          {
            path: "reservations",
            lazy: () => import("@/views/staff/reservation-queue-view"),
          },
          {
            path: "reports",
            lazy: () => import("@/views/staff/report-queue-view"),
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedLayout roles={["admin"]} />,
    HydrateFallback: RouteFallback,
    children: [
      {
        path: "admin",
        element: <PortalLayout kind="admin" />,
        children: [
          {
            index: true,
            lazy: () => import("@/views/admin/admin-dashboard-view"),
          },
          {
            path: "facilities",
            lazy: () => import("@/views/admin/facilities-admin-view"),
          },
          {
            path: "users",
            lazy: () => import("@/views/admin/users-admin-view"),
          },
        ],
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
