import { api } from "./_generated/api";
import { Autumn } from "@useautumn/convex";

export const autumn: any = new Autumn((api as any).autumn, {
	secretKey: process.env.AUTUMN_SECRET_KEY ?? "",
	identify: async (ctx: any) => {
		const user = await ctx.auth.getUserIdentity();
		if (!user) return null;

		const userId = user.subject.split("|")[0];
		return {
			customerId: user.subject as string,
			customerData: {
				name: user.name as string,
				email: user.email as string,
			},
		};
	},
});

/**
 * These exports are required for our react hooks and components
 */

import { action, query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const {
  track,
  cancel,
  attach,
  check,
  checkout,
  usage,
  setupPayment,
  billingPortal,
  createReferralCode,
  redeemReferralCode,
  createEntity,
  getEntity,
  listProducts,
  createCustomer,
} = autumn.api();