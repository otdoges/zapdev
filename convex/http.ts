import { httpRouter } from "convex/server";

// Stack Auth handles authentication via Next.js routes
// No Convex HTTP routes needed for auth
const http = httpRouter();

export default http;
