import { Application, Router, send } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { load } from "https://deno.land/std@0.218.2/dotenv/mod.ts";
import { handleLoginRequest } from "./routes/login.ts";
import { handleLogout } from "./routes/logout.ts";
import { handleSidebar } from "./routes/side_bar.ts";
import { client } from "./data/denopost_conn.ts";
import { handleDocumentSubmission } from "./routes/document_handler.ts";
import { searchAuthors } from "./controllers/author-Controller.ts";
import { searchTopics, createTopic } from "./controllers/topic-Controller.ts";
import { fetchCategories, fetchDocuments } from "./controllers/document-Controller.ts";
import { checkAuth } from "./middleware/auth_middleware.ts";
import { 
  handleGetAuthors, 
  handleGetAuthorById, 
  handleGetDocumentsByAuthor,
  handleCreateAuthor,
  handleUpdateAuthor,
  handleDeleteAuthor
} from "./routes/authors.ts";
import { Application, send, Router } from "https://deno.land/x/oak@v17.1.4/mod.ts";
import { documentsRouter } from "./routes/documents-Routes.ts";
import { join } from "https://deno.land/std@0.218.2/path/mod.ts";

const env = await load({ envPath: "./.env" });
console.log("Loaded Environment Variables:", env);

const app = new Application();
const router = new Router();

<<<<<<< Updated upstream
// Create Oak application
const app = new Application();
const router = new Router();

// Enable CORS
app.use(async (ctx, next) => {
    ctx.response.headers.set("Access-Control-Allow-Origin", "*");
    ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    if (ctx.request.method === "OPTIONS") {
        ctx.response.status = 200;
        return;
    }
    
    await next();
});

// Serve static files
app.use(async (ctx, next) => {
    const path = ctx.request.url.pathname;
    
    // Skip API routes
    if (path.startsWith("/api/")) {
        await next();
        return;
    }

    // Handle root path
    if (path === "/") {
        try {
            await send(ctx, "Deno/Public/index.html", {
                root: Deno.cwd()
            });
            return;
        } catch {
            await next();
            return;
        }
    }

    // Handle login page
    if (path === "/log-in.html") {
        try {
            await send(ctx, "Deno/Public/log-in.html", {
                root: Deno.cwd()
            });
            return;
        } catch {
            await next();
            return;
        }
    }

    // Handle static files
    if (path.startsWith("/Public/") || path.startsWith("/admin/") || 
        path.startsWith("/css/") || path.startsWith("/js/") || 
        path.startsWith("/images/") || path.startsWith("/Components/") ||
        path.endsWith(".css") || path.endsWith(".js") || 
        path.endsWith(".png") || path.endsWith(".jpg") || 
        path.endsWith(".jpeg") || path.endsWith(".gif") || 
        path.endsWith(".ico") || path.endsWith(".html")) {
        try {
            // Remove leading slash for file path
            const filePath = path.startsWith("/") ? path.substring(1) : path;
            let fullPath;

            // Handle admin files
            if (path.startsWith("/admin/")) {
                fullPath = join("Deno", filePath);
            } else {
                fullPath = join("Deno", "Public", filePath);
            }
            
            // Check if file exists
            try {
                await Deno.stat(join(Deno.cwd(), fullPath));
            } catch {
                console.error(`File not found: ${fullPath}`);
                await next();
                return;
            }

            await send(ctx, fullPath, {
                root: Deno.cwd()
            });
            return;
            } catch (error) {
            console.error("Error serving static file:", error);
            await next();
            return;
        }
    }

    await next();
});

// Handle login request
router.post("/login", async (ctx) => {
    const response = await handleLoginRequest(ctx.request);
    ctx.response.status = response.status;
    ctx.response.body = await response.json();
    ctx.response.headers = response.headers;
});

// Handle logout request
router.get("/logout", async (ctx) => {
    try {
        await handleLogout(ctx.request);
        ctx.response.redirect("/index.html");
    } catch (error) {
        console.error("Error during logout:", error);
        ctx.response.redirect("/index.html");
    }
});

// Handle sidebar request
router.get("/sidebar", async (ctx) => {
    const response = await handleSidebar(ctx.request);
    ctx.response.status = response.status;
    ctx.response.body = await response.json();
    ctx.response.headers = response.headers;
});

// Use the documents router
app.use(async (ctx, next) => {
    const cookies = ctx.request.headers.get("cookie") || "";
    const sessionToken = cookies.match(/session_token=([^;]+)/)?.[1];

    // Skip auth check for public routes
    if (ctx.request.url.pathname === "/" || 
        ctx.request.url.pathname === "/log-in.html" ||
        ctx.request.url.pathname.startsWith("/Public/") ||
        ctx.request.url.pathname.startsWith("/Components/") ||
        ctx.request.url.pathname === "/login" ||
        ctx.request.url.pathname.endsWith(".css") ||
        ctx.request.url.pathname.endsWith(".js") ||
        ctx.request.url.pathname.endsWith(".png") ||
        ctx.request.url.pathname.endsWith(".jpg") ||
        ctx.request.url.pathname.endsWith(".jpeg") ||
        ctx.request.url.pathname.endsWith(".gif") ||
        ctx.request.url.pathname.endsWith(".ico") ||
        ctx.request.url.pathname.endsWith(".html")) {
        await next();
        return;
    }

    if (!sessionToken) {
        ctx.response.status = 401;
        ctx.response.body = { message: "Unauthorized" };
        return;
    }

    // Check if token exists in database
    const result = await client.queryObject(`
        SELECT token FROM tokens WHERE token = $1
    `, [sessionToken]);

    if (result.rows.length === 0) {
        ctx.response.status = 401;
        ctx.response.body = { message: "Unauthorized" };
        return;
    }

    await next();
});

// Register authors routes
router.get("/api/authors", handleGetAuthors);
router.get("/api/authors/:id", handleGetAuthorById);
router.get("/api/authors/:id/documents", handleGetDocumentsByAuthor);
router.post("/api/authors", handleCreateAuthor);
router.put("/api/authors/:id", handleUpdateAuthor);
router.delete("/api/authors/:id", handleDeleteAuthor);

app.use(router.routes());
app.use(router.allowedMethods());
app.use(documentsRouter.routes());
app.use(documentsRouter.allowedMethods());

// Start the server
console.log("Server running on http://localhost:8000");
await app.listen({ port: 8000 });
=======
// CORS middleware
app.use(async (ctx, next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "http://localhost:3003");
  ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cache-Control");
  ctx.response.headers.set("Access-Control-Allow-Credentials", "true");
  
  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 204;
    return;
  }
  
  await next();
});

// Auth middleware for protected routes
app.use(async (ctx, next) => {
  const protectedRoutes = [
    "/admin/dashboard.html",
    "/api/authors",
    "/api/topics",
    "/api/documents",
    "/api/categories",
    "/api/volumes"
  ];

  if (protectedRoutes.some(route => ctx.request.url.pathname.startsWith(route))) {
    const isAuthenticated = await checkAuth(ctx.request);
    if (!isAuthenticated) {
      ctx.response.status = 302;
      ctx.response.headers.set("Location", "/index.html");
      ctx.response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
      ctx.response.headers.set("Pragma", "no-cache");
      ctx.response.headers.set("Expires", "0");
      return;
    }
  }
  
  await next();
});

// API Routes
router.post("/login", handleLoginRequest);
router.get("/logout", handleLogout);
router.get("/sidebar", handleSidebar);

// Authors API
router.get("/api/authors", async (ctx) => {
  const response = await searchAuthors(ctx.request);
  ctx.response.body = await response.json();
  ctx.response.status = response.status;
  ctx.response.headers = response.headers;
});

router.post("/api/authors", async (ctx) => {
  const response = await handleCreateAuthor(ctx.request);
  ctx.response.body = await response.json();
  ctx.response.status = response.status;
  ctx.response.headers = response.headers;
});

router.get("/api/authors/:id", async (ctx) => {
  const response = await handleGetAuthorById(ctx.params.id);
  ctx.response.body = await response.json();
  ctx.response.status = response.status;
  ctx.response.headers = response.headers;
});

router.put("/api/authors/:id", async (ctx) => {
  const response = await handleUpdateAuthor(ctx.params.id, ctx.request);
  ctx.response.body = await response.json();
  ctx.response.status = response.status;
  ctx.response.headers = response.headers;
});

router.delete("/api/authors/:id", async (ctx) => {
  const response = await handleDeleteAuthor(ctx.params.id);
  ctx.response.body = await response.json();
  ctx.response.status = response.status;
  ctx.response.headers = response.headers;
});

router.get("/api/authors/:id/documents", async (ctx) => {
  const response = await handleGetDocumentsByAuthor(parseInt(ctx.params.id));
  ctx.response.body = await response.json();
  ctx.response.status = response.status;
  ctx.response.headers = response.headers;
});

// Document submission
router.post("/api/submit-document", async (ctx) => {
  const response = await handleDocumentSubmission(ctx.request);
  ctx.response.body = await response.json();
  ctx.response.status = response.status;
  ctx.response.headers = response.headers;
});

// Static file serving
router.get("/", async (ctx) => {
  await send(ctx, "index.html", {
    root: `${Deno.cwd()}/public`,
  });
});

router.get("/log-in.html", async (ctx) => {
  await send(ctx, "log-in.html", {
    root: `${Deno.cwd()}/public`,
  });
});

// Admin routes
router.get("/admin/dashboard.html", async (ctx) => {
  await send(ctx, "dashboard.html", {
    root: `${Deno.cwd()}/admin`,
  });
});

// Static files
router.get("/public/:path+", async (ctx) => {
  await send(ctx, ctx.params.path, {
    root: `${Deno.cwd()}/public`,
  });
});

router.get("/components/:path+", async (ctx) => {
  await send(ctx, ctx.params.path, {
    root: `${Deno.cwd()}/public/components`,
  });
});

router.get("/images/:path+", async (ctx) => {
  await send(ctx, ctx.params.path, {
    root: `${Deno.cwd()}/public/images`,
  });
});

// Error handling
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error("Error:", err);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log("Server running on http://localhost:8000");
await app.listen({ port: 8000 });
>>>>>>> Stashed changes
