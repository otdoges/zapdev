"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAIResponse = generateAIResponse;
exports.streamAIResponse = streamAIResponse;
const groq_1 = require("@ai-sdk/groq");
const ai_sdk_provider_1 = require("@openrouter/ai-sdk-provider");
const ai_1 = require("ai");
// Get user's API key from localStorage if available
function getUserApiKey() {
    try {
        const savedConfig = localStorage.getItem('zapdev-api-config');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            return config.useUserApiKey && config.groqApiKey ? config.groqApiKey : null;
        }
    }
    catch (error) {
        console.error('Error reading API config from localStorage:', error);
    }
    return null;
}
// Create Groq instance with user key or fallback to env key
function createGroqInstance() {
    const userApiKey = getUserApiKey();
    const apiKey = userApiKey || process.env.VITE_GROQ_API_KEY || '';
    if (userApiKey) {
        console.log('🔑 Using user-provided Groq API key');
    }
    else if (process.env.VITE_GROQ_API_KEY) {
        console.log('🔑 Using environment Groq API key');
    }
    return (0, groq_1.createGroq)({ apiKey });
}
// OpenRouter as failsafe provider
const openrouter = (0, ai_sdk_provider_1.createOpenRouter)({
    apiKey: process.env.VITE_OPENROUTER_API_KEY || '',
});
// Get current model instance
function getCurrentModel() {
    const groq = createGroqInstance();
    return groq('moonshotai/kimi-k2-instruct');
}
// OpenRouter failsafe model
const fallbackModel = openrouter.chat('qwen/qwen3-coder:free');
async function generateAIResponse(prompt) {
    try {
        const userApiKey = getUserApiKey();
        const envApiKey = process.env.VITE_GROQ_API_KEY;
        if (!userApiKey && !envApiKey) {
            throw new Error('No Groq API key configured. Please add your API key in Settings or set VITE_GROQ_API_KEY in environment variables.');
        }
        const model = getCurrentModel();
        const { text } = await (0, ai_1.generateText)({
            model,
            prompt,
            maxTokens: 4000,
            temperature: 0.7,
        });
        return text;
    }
    catch (error) {
        console.error('AI generation error:', error);
        // Try OpenRouter as failsafe
        try {
            if (!process.env.VITE_OPENROUTER_API_KEY) {
                console.warn('OpenRouter API key not configured, cannot use failsafe');
                throw error;
            }
            console.log('🔄 Trying OpenRouter failsafe...');
            const { text } = await (0, ai_1.generateText)({
                model: fallbackModel,
                prompt,
                maxTokens: 4000,
                temperature: 0.7,
            });
            console.log('✅ OpenRouter failsafe succeeded');
            return text;
        }
        catch (fallbackError) {
            console.error('OpenRouter failsafe also failed:', fallbackError);
            throw error;
        }
    }
}
async function streamAIResponse(prompt) {
    try {
        const userApiKey = getUserApiKey();
        const envApiKey = process.env.VITE_GROQ_API_KEY;
        if (!userApiKey && !envApiKey) {
            throw new Error('No Groq API key configured. Please add your API key in Settings or set VITE_GROQ_API_KEY in environment variables.');
        }
        const model = getCurrentModel();
        const result = await (0, ai_1.streamText)({
            model,
            prompt,
            maxTokens: 4000,
            temperature: 0.7,
        });
        return result;
    }
    catch (error) {
        console.error('AI streaming error:', error);
        // Try OpenRouter as failsafe
        try {
            if (!process.env.VITE_OPENROUTER_API_KEY) {
                console.warn('OpenRouter API key not configured, cannot use failsafe');
                throw error;
            }
            console.log('🔄 Trying OpenRouter streaming failsafe...');
            const result = await (0, ai_1.streamText)({
                model: fallbackModel,
                prompt,
                maxTokens: 4000,
                temperature: 0.7,
            });
            console.log('✅ OpenRouter streaming failsafe succeeded');
            return result;
        }
        catch (fallbackError) {
            console.error('OpenRouter streaming failsafe also failed:', fallbackError);
            throw error;
        }
    }
}
