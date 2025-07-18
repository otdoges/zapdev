import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all active AI models
export const getActiveModels = query({
  args: {},
  handler: async (ctx) => {
    const models = await ctx.db
      .query("aiModels")
      .withIndex("by_active")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    return models;
  },
});

// Get all AI models (admin only)
export const getAllModels = query({
  args: {},
  handler: async (ctx) => {
    const models = await ctx.db
      .query("aiModels")
      .collect();
    
    return models;
  },
});

// Get models by provider
export const getModelsByProvider = query({
  args: { provider: v.string() },
  handler: async (ctx, args) => {
    const models = await ctx.db
      .query("aiModels")
      .withIndex("by_provider")
      .filter((q) => q.and(
        q.eq(q.field("provider"), args.provider),
        q.eq(q.field("isActive"), true)
      ))
      .collect();
    
    return models;
  },
});

// Get a specific model
export const getModel = query({
  args: { modelId: v.id("aiModels") },
  handler: async (ctx, args) => {
    const model = await ctx.db.get(args.modelId);
    
    if (!model) {
      throw new Error("Model not found");
    }
    
    return model;
  },
});

// Create a new AI model (admin only)
export const createModel = mutation({
  args: {
    name: v.string(),
    provider: v.string(),
    modelId: v.string(),
    description: v.optional(v.string()),
    maxTokens: v.optional(v.number()),
    temperature: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const modelId = await ctx.db.insert("aiModels", {
      name: args.name,
      provider: args.provider,
      modelId: args.modelId,
      description: args.description,
      maxTokens: args.maxTokens,
      temperature: args.temperature || 0.7,
      isActive: args.isActive !== undefined ? args.isActive : true,
      createdAt: Date.now(),
    });
    
    return modelId;
  },
});

// Update an AI model (admin only)
export const updateModel = mutation({
  args: {
    id: v.id("aiModels"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    maxTokens: v.optional(v.number()),
    temperature: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const model = await ctx.db.get(args.id);
    
    if (!model) {
      throw new Error("Model not found");
    }

    const updateData: any = {};
    
    if (args.name !== undefined) updateData.name = args.name;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.maxTokens !== undefined) updateData.maxTokens = args.maxTokens;
    if (args.temperature !== undefined) updateData.temperature = args.temperature;
    if (args.isActive !== undefined) updateData.isActive = args.isActive;
    
    await ctx.db.patch(args.id, updateData);
    
    return args.id;
  },
});

// Initialize default AI models with latest Groq models
export const initializeDefaultModels = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if models already exist
    const existingModels = await ctx.db.query("aiModels").collect();
    
    if (existingModels.length > 0) {
      return { message: "Models already initialized" };
    }

    const defaultModels = [
      // Production Models
      {
        name: "Gemma 2 9B Instruct",
        provider: "groq",
        modelId: "gemma2-9b-it",
        description: "Google's Gemma 2 9B instruction-tuned model",
        maxTokens: 8192,
        temperature: 0.7,
        isActive: true,
      },
      {
        name: "Llama 3.1 8B Instant",
        provider: "groq",
        modelId: "llama-3.1-8b-instant",
        description: "Meta's fast and efficient Llama 3.1 8B model",
        maxTokens: 131072,
        temperature: 0.7,
        isActive: true,
      },
      {
        name: "Llama 3.3 70B Versatile",
        provider: "groq",
        modelId: "llama-3.3-70b-versatile",
        description: "Meta's latest and most capable Llama 3.3 70B model",
        maxTokens: 131072,
        temperature: 0.7,
        isActive: true,
      },
      {
        name: "Llama Guard 4 12B",
        provider: "groq",
        modelId: "meta-llama/llama-guard-4-12b",
        description: "Meta's safety model for content moderation",
        maxTokens: 131072,
        temperature: 0.7,
        isActive: true,
      },
      
      // Preview Models (Latest)
      {
        name: "DeepSeek R1 Distill Llama 70B",
        provider: "groq",
        modelId: "deepseek-r1-distill-llama-70b",
        description: "DeepSeek's reasoning model distilled into Llama 70B (Preview)",
        maxTokens: 131072,
        temperature: 0.7,
        isActive: true,
      },
      {
        name: "Llama 4 Maverick 17B",
        provider: "groq",
        modelId: "meta-llama/llama-4-maverick-17b-128e-instruct",
        description: "Meta's experimental Llama 4 Maverick model (Preview)",
        maxTokens: 131072,
        temperature: 0.7,
        isActive: true,
      },
      {
        name: "Llama 4 Scout 17B",
        provider: "groq",
        modelId: "meta-llama/llama-4-scout-17b-16e-instruct",
        description: "Meta's experimental Llama 4 Scout model (Preview)",
        maxTokens: 131072,
        temperature: 0.7,
        isActive: true,
      },
      {
        name: "Mistral Saba 24B",
        provider: "groq",
        modelId: "mistral-saba-24b",
        description: "Mistral AI's Saba 24B model (Preview)",
        maxTokens: 32768,
        temperature: 0.7,
        isActive: true,
      },
      {
        name: "Kimi K2 Instruct",
        provider: "groq",
        modelId: "moonshotai/kimi-k2-instruct",
        description: "Moonshot AI's Kimi K2 instruction-tuned model (Preview)",
        maxTokens: 131072,
        temperature: 0.7,
        isActive: true,
      },
      {
        name: "Qwen 3 32B",
        provider: "groq",
        modelId: "qwen/qwen3-32b",
        description: "Alibaba Cloud's Qwen 3 32B model (Preview)",
        maxTokens: 131072,
        temperature: 0.7,
        isActive: true,
      },
      {
        name: "Llama Prompt Guard 2 22M",
        provider: "groq",
        modelId: "meta-llama/llama-prompt-guard-2-22m",
        description: "Meta's lightweight prompt injection detection model (Preview)",
        maxTokens: 512,
        temperature: 0.7,
        isActive: true,
      },
      {
        name: "Llama Prompt Guard 2 86M",
        provider: "groq",
        modelId: "meta-llama/llama-prompt-guard-2-86m",
        description: "Meta's enhanced prompt injection detection model (Preview)",
        maxTokens: 512,
        temperature: 0.7,
        isActive: true,
      },
      
      // Preview Systems (Agentic Tooling)
      {
        name: "Compound Beta",
        provider: "groq",
        modelId: "compound-beta",
        description: "Groq's compound system with web search and code execution (Preview)",
        maxTokens: 131072,
        temperature: 0.7,
        isActive: true,
      },
      {
        name: "Compound Beta Mini",
        provider: "groq",
        modelId: "compound-beta-mini",
        description: "Groq's lightweight compound system (Preview)",
        maxTokens: 131072,
        temperature: 0.7,
        isActive: true,
      },
    ];

    const createdModels = [];
    for (const model of defaultModels) {
      const modelId = await ctx.db.insert("aiModels", {
        ...model,
        createdAt: Date.now(),
      });
      createdModels.push(modelId);
    }
    
    return { 
      message: `Initialized ${createdModels.length} AI models including latest Groq production and preview models`, 
      models: createdModels 
    };
  },
}); 