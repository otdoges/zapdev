import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";

// Helper function to get authenticated user
const getAuthenticatedUser = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("User must be authenticated");
  }
  return identity;
};

// Track an analytics event
export const trackEvent = mutation({
  args: {
    siteId: v.string(),
    event: v.string(),
    page: v.string(),
    title: v.optional(v.string()),
    referrer: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    ip: v.optional(v.string()),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    device: v.optional(v.string()),
    browser: v.optional(v.string()),
    os: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    loadTime: v.optional(v.number()),
    scrollDepth: v.optional(v.number()),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Note: This is a public endpoint (no auth required for tracking)
    // The siteId serves as the authorization mechanism
    
    const now = Date.now();
    
    // Get the site owner to associate the event
    const site = await ctx.db
      .query("deployedSites")
      .withIndex("by_site_id", (q) => q.eq("siteId", args.siteId))
      .first();
    
    if (!site) {
      throw new Error("Site not found");
    }
    
    await ctx.db.insert("siteAnalytics", {
      siteId: args.siteId,
      userId: site.userId, // Associate with site owner
      event: args.event,
      page: args.page,
      title: args.title,
      referrer: args.referrer,
      userAgent: args.userAgent,
      ip: args.ip,
      country: args.country,
      city: args.city,
      device: args.device,
      browser: args.browser,
      os: args.os,
      sessionId: args.sessionId,
      loadTime: args.loadTime,
      scrollDepth: args.scrollDepth,
      timestamp: args.timestamp || now,
    });
    
    return { success: true };
  },
});

// Get analytics events for a site within a time range
export const getEventsByTimeRange = query({
  args: {
    siteId: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    event: v.optional(v.string()),
    page: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Verify user owns this site
    const site = await ctx.db
      .query("deployedSites")
      .withIndex("by_site_id", (q) => q.eq("siteId", args.siteId))
      .first();
    
    if (!site || site.userId !== identity.subject) {
      throw new Error("Access denied");
    }
    
    const limit = Math.min(args.limit || 1000, 5000);
    
    let query = ctx.db
      .query("siteAnalytics")
      .withIndex("by_site_timestamp", (q) => 
        q.eq("siteId", args.siteId)
         .gte("timestamp", args.startTime)
         .lte("timestamp", args.endTime)
      );
    
    const events = await query
      .order("desc")
      .take(limit);
    
    // Apply additional filters
    let filteredEvents = events;
    
    if (args.event) {
      filteredEvents = filteredEvents.filter(e => e.event === args.event);
    }
    
    if (args.page) {
      filteredEvents = filteredEvents.filter(e => e.page === args.page);
    }
    
    return filteredEvents;
  },
});

// Get analytics summary for a site
export const getAnalyticsSummary = query({
  args: {
    siteId: v.string(),
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Verify user owns this site
    const site = await ctx.db
      .query("deployedSites")
      .withIndex("by_site_id", (q) => q.eq("siteId", args.siteId))
      .first();
    
    if (!site || site.userId !== identity.subject) {
      throw new Error("Access denied");
    }
    
    const events = await ctx.db
      .query("siteAnalytics")
      .withIndex("by_site_timestamp", (q) => 
        q.eq("siteId", args.siteId)
         .gte("timestamp", args.startTime)
         .lte("timestamp", args.endTime)
      )
      .collect();
    
    const pageviews = events.filter(e => e.event === 'pageview');
    const uniqueVisitors = new Set(events.filter(e => e.ip).map(e => e.ip)).size;
    
    // Calculate top pages
    const pageViews = new Map<string, number>();
    pageviews.forEach(event => {
      pageViews.set(event.page, (pageViews.get(event.page) || 0) + 1);
    });
    
    const topPages = Array.from(pageViews.entries())
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
    
    // Calculate referrers
    const referrerCounts = new Map<string, number>();
    pageviews.forEach(event => {
      const referrer = event.referrer || 'direct';
      referrerCounts.set(referrer, (referrerCounts.get(referrer) || 0) + 1);
    });
    
    const topReferrers = Array.from(referrerCounts.entries())
      .map(([referrer, visits]) => ({ referrer, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);
    
    // Calculate device breakdown
    const deviceCounts = new Map<string, number>();
    events.forEach(event => {
      if (event.device) {
        deviceCounts.set(event.device, (deviceCounts.get(event.device) || 0) + 1);
      }
    });
    
    const deviceBreakdown = Array.from(deviceCounts.entries())
      .map(([device, count]) => ({ device, count }));
    
    return {
      totalPageviews: pageviews.length,
      uniqueVisitors,
      totalEvents: events.length,
      topPages,
      topReferrers,
      deviceBreakdown,
      timeRange: {
        start: args.startTime,
        end: args.endTime,
      },
    };
  },
});

// Get real-time analytics (last 30 minutes)
export const getRealtimeAnalytics = query({
  args: {
    siteId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Verify user owns this site
    const site = await ctx.db
      .query("deployedSites")
      .withIndex("by_site_id", (q) => q.eq("siteId", args.siteId))
      .first();
    
    if (!site || site.userId !== identity.subject) {
      throw new Error("Access denied");
    }
    
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
    
    const recentEvents = await ctx.db
      .query("siteAnalytics")
      .withIndex("by_site_timestamp", (q) => 
        q.eq("siteId", args.siteId)
         .gte("timestamp", thirtyMinutesAgo)
      )
      .order("desc")
      .take(200);
    
    const currentVisitors = new Set(
      recentEvents.filter(e => e.ip).map(e => e.ip)
    ).size;
    
    const recentPageviews = recentEvents
      .filter(e => e.event === 'pageview')
      .slice(0, 20)
      .map(e => ({
        page: e.page,
        timestamp: e.timestamp,
        country: e.country,
      }));
    
    return {
      currentVisitors,
      recentPageviews,
      totalRecentEvents: recentEvents.length,
    };
  },
});

// Get analytics for all user's sites
export const getUserSitesAnalytics = query({
  args: {
    timeRange: v.optional(v.union(v.literal("24h"), v.literal("7d"), v.literal("30d"))),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Get all user's sites
    const sites = await ctx.db
      .query("deployedSites")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .collect();
    
    const timeRange = args.timeRange || "7d";
    const timeRanges = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };
    
    const startTime = Date.now() - timeRanges[timeRange];
    
    const siteStats = [];
    
    for (const site of sites) {
      const events = await ctx.db
        .query("siteAnalytics")
        .withIndex("by_site_timestamp", (q) => 
          q.eq("siteId", site.siteId)
           .gte("timestamp", startTime)
        )
        .collect();
      
      const pageviews = events.filter(e => e.event === 'pageview').length;
      const uniqueVisitors = new Set(events.filter(e => e.ip).map(e => e.ip)).size;
      
      siteStats.push({
        siteId: site.siteId,
        siteName: site.name,
        siteUrl: site.url,
        pageviews,
        uniqueVisitors,
        totalEvents: events.length,
      });
    }
    
    return {
      sites: siteStats,
      timeRange,
      totalSites: sites.length,
    };
  },
});

// Clean up old analytics data (older than 90 days)
export const cleanupOldAnalytics = mutation({
  args: {
    daysToKeep: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Only allow admins to run cleanup (you can adjust this logic)
    const adminUserIds = (process.env.ADMIN_USER_IDS || '').split(',');
    if (!adminUserIds.includes(identity.subject)) {
      throw new Error("Admin access required");
    }
    
    const daysToKeep = args.daysToKeep || 90;
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    const oldEvents = await ctx.db
      .query("siteAnalytics")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoffTime))
      .take(1000); // Process in batches
    
    let deletedCount = 0;
    for (const event of oldEvents) {
      await ctx.db.delete(event._id);
      deletedCount++;
    }
    
    return { deletedCount, cutoffTime };
  },
});