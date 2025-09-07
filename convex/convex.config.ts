import { defineApp } from "convex/server";

const app = defineApp();

// Autumn plugin is not available, using fallback implementations
console.warn("⚠ Autumn plugin not available - using fallback implementations");
console.log("Continuing without Autumn - usage limits will be disabled");

export default app;