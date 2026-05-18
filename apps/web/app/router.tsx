import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"
import type { RouterContext } from "./routes/__root"

export function createRouter() {
  return createTanStackRouter({
    routeTree,
    context: { user: null } satisfies RouterContext,
    defaultPreload: "intent",
    scrollRestoration: true,
  })
}

export const getRouter = createRouter

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
