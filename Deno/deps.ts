/**
 * deps.ts - Central dependency management for the PEAS backend
 * 
 * This file centralizes all external dependencies to make version management easier
 * and provides a single source of imports for the application.
 */

// Standard Deno dependencies
export { serve } from "https://deno.land/std@0.190.0/http/server.ts";
export { load as dotenvConfig } from "https://deno.land/std@0.190.0/dotenv/mod.ts";
export { ensureDir } from "https://deno.land/std@0.190.0/fs/ensure_dir.ts";
export { extname, join } from "https://deno.land/std@0.190.0/path/mod.ts";

// Oak framework for HTTP server and routing
export { Application, Router, Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
export type { RouterContext, Request, Response } from "https://deno.land/x/oak@v12.6.1/mod.ts";
export { FormDataReader } from "https://deno.land/x/oak@v12.6.1/multipart.ts";
export type { FormDataReadResult } from "https://deno.land/x/oak@v12.6.1/multipart.ts";

// PostgreSQL client
export { Pool, PoolClient } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

// Other dependencies can be added here 