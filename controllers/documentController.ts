import { RouterContext } from "https://deno.land/x/oak/mod.ts";

export const uploadDocument = async (ctx: RouterContext) => {
  const body = await ctx.request.body({ type: "form-data" }).value;
  const formData = await body.read();
  
  // Handle file and form data here
  console.log(formData);

  ctx.response.status = 200;
  ctx.response.body = { message: "Document uploaded successfully" };
};