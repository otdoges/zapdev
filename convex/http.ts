import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

// Register Better Auth routes on Convex HTTP router
authComponent.registerRoutes(http, createAuth);

export default http;
