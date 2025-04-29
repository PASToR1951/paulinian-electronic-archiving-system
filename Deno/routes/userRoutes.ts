import { Route } from "./index.ts";
import { RouterContext } from "../deps.ts";

// User routes handlers
const getUsers = async (ctx: RouterContext<any, any, any>) => {
  ctx.response.body = { message: "Get all users endpoint" };
};

const getUserById = async (ctx: RouterContext<any, any, any>) => {
  const id = ctx.params.id;
  ctx.response.body = { message: `Get user with ID: ${id}` };
};

const createUser = async (ctx: RouterContext<any, any, any>) => {
  const bodyParser = await ctx.request.body({type: "json"});
  const body = await bodyParser.value;
  ctx.response.body = { message: "User created successfully", data: body };
};

const updateUser = async (ctx: RouterContext<any, any, any>) => {
  const id = ctx.params.id;
  const bodyParser = await ctx.request.body({type: "json"});
  const body = await bodyParser.value;
  ctx.response.body = { message: `User ${id} updated successfully`, data: body };
};

const deleteUser = async (ctx: RouterContext<any, any, any>) => {
  const id = ctx.params.id;
  ctx.response.body = { message: `User ${id} deleted successfully` };
};

// Export an array of routes
export const userRoutes: Route[] = [
  { method: "GET", path: "/users", handler: getUsers },
  { method: "GET", path: "/users/:id", handler: getUserById },
  { method: "POST", path: "/users", handler: createUser },
  { method: "PUT", path: "/users/:id", handler: updateUser },
  { method: "DELETE", path: "/users/:id", handler: deleteUser },
];
