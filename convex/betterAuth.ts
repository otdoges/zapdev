import { action, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexHandler } from "@better-auth-kit/convex/handler";

const result: any = ConvexHandler({
  action,
  internalQuery,
  internalMutation,
  internal: internal as any,
});

export const { betterAuth, query, insert, update, delete_, count, getSession }: any = result; 