/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as aiRateLimit from "../aiRateLimit.js";
import type * as chats from "../chats.js";
import type * as messages from "../messages.js";
import type * as rateLimit from "../rateLimit.js";
import type * as trpc_router from "../trpc/router.js";
import type * as usageTracking from "../usageTracking.js";
import type * as users from "../users.js";

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
  chats: typeof chats;
  messages: typeof messages;
  rateLimit: typeof rateLimit;
  "trpc/router": typeof trpc_router;
  usageTracking: typeof usageTracking;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
