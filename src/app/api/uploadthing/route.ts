import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

const routes = createRouteHandler({
  router: ourFileRouter,
}) as unknown as {
  GET: (req: Request) => Promise<Response>;
  POST: (req: Request) => Promise<Response>;
};

export const GET = routes.GET;
export const POST = routes.POST;