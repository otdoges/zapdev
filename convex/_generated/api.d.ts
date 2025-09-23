/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiRateLimit from "../aiRateLimit.js";
import type * as analytics from "../analytics.js";
import type * as billing from "../billing.js";
import type * as chats from "../chats.js";
import type * as deployments from "../deployments.js";
import type * as http from "../http.js";
import type * as jwtAuth from "../jwtAuth.js";
import type * as messages from "../messages.js";
import type * as rateLimit from "../rateLimit.js";
import type * as secretAccess from "../secretAccess.js";
import type * as secretApiKeys from "../secretApiKeys.js";
import type * as secretChats from "../secretChats.js";
import type * as trpc_router from "../trpc/router.js";
import type * as usageTracking from "../usageTracking.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  aiRateLimit: typeof aiRateLimit;
  analytics: typeof analytics;
  billing: typeof billing;
  chats: typeof chats;
  deployments: typeof deployments;
  http: typeof http;
  jwtAuth: typeof jwtAuth;
  messages: typeof messages;
  rateLimit: typeof rateLimit;
  secretAccess: typeof secretAccess;
  secretApiKeys: typeof secretApiKeys;
  secretChats: typeof secretChats;
  "trpc/router": typeof trpc_router;
  usageTracking: typeof usageTracking;
  users: typeof users;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
