import { Router } from "../deps.ts";
import { userRoutes } from "./userRoutes.ts";
import { permissionsRoutes } from "./permissionsRoutes.ts";
import { documentRoutes } from "./documentRoutes.ts";
import { authRoutes } from "./authRoutes.ts";
import { researchAgendaRoutesArray } from "./researchAgendaRoutes.ts";
// author routes are now handled directly in server.ts

// Define the route interface
export interface Route {
  method: string;
  path: string;
  handler: (context: any) => Promise<void> | void;
}

// Root route handler
const rootHandler = (ctx: any) => {
  ctx.response.body = {
    message: "Welcome to PEAS API",
    version: "1.0.0",
    endpoints: {
      users: "/users",
      auth: "/auth",
      documents: "/documents",
      permissions: "/permissions",
      researchAgenda: "/document-research-agenda",
      authors: "/authors"
    }
  };
};

// Combine all routes into a single array
export const routes: Route[] = [
  // Root route
  { method: "GET", path: "/", handler: rootHandler },
  // Other routes
  ...userRoutes,
  ...permissionsRoutes,
  ...documentRoutes,
  ...authRoutes,
  ...researchAgendaRoutesArray,
  // authorRoutes are now handled differently
];