import { QueryClientProvider } from "@tanstack/react-query"
import { type ReactNode, useState } from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { createQueryClient } from "@/lib/query-client"

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="ppk-theme">
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}
