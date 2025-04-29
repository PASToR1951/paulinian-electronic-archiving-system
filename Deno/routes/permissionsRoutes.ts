import { Route } from "./index.ts";
import { RouterContext } from "../deps.ts";

// Permissions route handlers
const getPermissions = async (ctx: RouterContext<any, any, any>) => {
  ctx.response.body = { message: "Get all permissions endpoint" };
};

const getPermissionById = async (ctx: RouterContext<any, any, any>) => {
  const id = ctx.params.id;
  ctx.response.body = { message: `Get permission with ID: ${id}` };
};

const createPermission = async (ctx: RouterContext<any, any, any>) => {
  const bodyParser = await ctx.request.body({type: "json"});
  const body = await bodyParser.value;
  ctx.response.body = { message: "Permission created successfully", data: body };
};

const updatePermission = async (ctx: RouterContext<any, any, any>) => {
  const id = ctx.params.id;
  const bodyParser = await ctx.request.body({type: "json"});
  const body = await bodyParser.value;
  ctx.response.body = { message: `Permission ${id} updated successfully`, data: body };
};

const deletePermission = async (ctx: RouterContext<any, any, any>) => {
  const id = ctx.params.id;
  ctx.response.body = { message: `Permission ${id} deleted successfully` };
};

// Export an array of routes
export const permissionsRoutes: Route[] = [
  { method: "GET", path: "/permissions", handler: getPermissions },
  { method: "GET", path: "/permissions/:id", handler: getPermissionById },
  { method: "POST", path: "/permissions", handler: createPermission },
  { method: "PUT", path: "/permissions/:id", handler: updatePermission },
  { method: "DELETE", path: "/permissions/:id", handler: deletePermission },
];
