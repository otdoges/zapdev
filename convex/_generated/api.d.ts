/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as autumn from "../autumn.js";
import type * as github from "../github.js";
import type * as helpers from "../helpers.js";
import type * as importData from "../importData.js";
import type * as imports from "../imports.js";
import type * as issues from "../issues.js";
import type * as messages from "../messages.js";
import type * as oauth from "../oauth.js";
import type * as projects from "../projects.js";
import type * as tasks from "../tasks.js";
import type * as usage from "../usage.js";

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
  autumn: typeof autumn;
  github: typeof github;
  helpers: typeof helpers;
  importData: typeof importData;
  imports: typeof imports;
  issues: typeof issues;
  messages: typeof messages;
  oauth: typeof oauth;
  projects: typeof projects;
  tasks: typeof tasks;
  usage: typeof usage;
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

export declare const components: {
  autumn: {};
};
