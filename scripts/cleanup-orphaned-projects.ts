#!/usr/bin/env bun
/**
 * Admin script to clean up orphaned projects from Convex database
 * 
 * This script removes all projects that have userId references pointing to
 * non-existent users in the users table. This fixes schema validation errors
 * that occur when the database has stale references.
 * 
 * Usage:
 *   bun scripts/cleanup-orphaned-projects.ts
 * 
 * Prerequisites:
 *   1. Run `bun run convex:dev` in a separate terminal
 *   2. Set NEXT_PUBLIC_CONVEX_URL in .env from the convex dev server output
 */

import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api";

async function cleanupOrphanedProjects() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    console.error("❌ Error: NEXT_PUBLIC_CONVEX_URL is not set");
    console.error("   Please ensure you've run `bun run convex:dev` and set the URL in .env");
    process.exit(1);
  }

  console.log("🚀 Initializing Convex client...");
  console.log(`   URL: ${convexUrl}`);

  const client = new ConvexClient(convexUrl);

  try {
    console.log("\n🧹 Starting cleanup of orphaned projects...\n");

    const result = await client.action(api.importData.cleanupOrphanedProjectsAction, {});

    console.log(`✅ ${result.message}`);
    console.log(`   Cleaned projects: ${result.cleanedProjectCount}`);

    if (result.orphanedProjectIds.length > 0) {
      console.log("\n📋 Removed project IDs:");
      for (const id of result.orphanedProjectIds) {
        console.log(`   - ${id}`);
      }
    } else {
      console.log("\n✨ No orphaned projects found!");
    }

    console.log("\n✅ Cleanup completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  }
}

cleanupOrphanedProjects();
