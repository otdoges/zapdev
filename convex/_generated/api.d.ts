/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts from "../accounts.js";
import type * as emailVerifications from "../emailVerifications.js";
import type * as helpers from "../helpers.js";
import type * as importData from "../importData.js";
import type * as imports from "../imports.js";
import type * as messages from "../messages.js";
import type * as oauth from "../oauth.js";
import type * as projects from "../projects.js";
import type * as sessions from "../sessions.js";
import type * as usage from "../usage.js";
import type * as users from "../users.js";
import type * as webhookEvents from "../webhookEvents.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  emailVerifications: typeof emailVerifications;
  helpers: typeof helpers;
  importData: typeof importData;
  imports: typeof imports;
  messages: typeof messages;
  oauth: typeof oauth;
  projects: typeof projects;
  sessions: typeof sessions;
  usage: typeof usage;
  users: typeof users;
  webhookEvents: typeof webhookEvents;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
