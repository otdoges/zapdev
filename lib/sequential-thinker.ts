import { openrouterProvider } from './openrouter';
import { CoreMessage, generateText, streamText, StreamData } from 'ai';
import { ChatHistory } from '@/lib/types';

const MCP_SERVER_URL = process.env.MCP_SEQUENTIAL_THINKING_URL;

interface Thought {
  thought: string;
  thought_number: number;
  total_thoughts: number;
  next_thought_needed: boolean;
  stage: 'Problem Definition' | 'Research' | 'Analysis' | 'Synthesis' | 'Conclusion';
  tags?: string[];
  // Add other fields from the MCP server's process_thought API as needed
}

interface GeneratedThoughtStructure {
  estimated_total_thoughts: number;
  thoughts: Array<Omit<Thought, 'thought_number' | 'total_thoughts' | 'next_thought_needed'>>;
}

async function mcpApiCall(endpoint: string, body: any) {
  if (!MCP_SERVER_URL) {
    console.warn('MCP_SEQUENTIAL_THINKING_URL is not set. Skipping MCP server call.');
    return null;
  }
  try {
    const response = await fetch(`${MCP_SERVER_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      console.error(`MCP Server Error (${endpoint}): ${response.status} ${await response.text()}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`Error calling MCP Server (${endpoint}):`, error);
    return null;
  }
}

export async function processThoughtWithMcp(thoughtData: Thought) {
  return mcpApiCall('/process_thought', thoughtData);
}

export async function generateSummaryFromMcp() {
  return mcpApiCall('/generate_summary', {});
}

export async function clearHistoryInMcp() {
  return mcpApiCall('/clear_history', {});
}

/**
 * Uses an LLM to break down a user prompt into a sequence of thoughts and stages.
 */
async function generateInitialThoughts(userPrompt: string, modelId: string = 'deepseek/deepseek-chat:free'): Promise<GeneratedThoughtStructure | null> {
  const model = openrouterProvider.chat(modelId);
  const systemPrompt = `You are an analytical assistant. Your task is to break down the given user's request into a sequence of structured thoughts. While doing so, adhere to the core principles and guidelines expected of the ZapDev AI (as defined in its main system prompt, especially regarding planning, code excellence, and architecture). 
  Each thought must have a 'thought' (the textual content of the thought) and a 'stage'.
  The available stages are: "Problem Definition", "Research", "Analysis", "Synthesis", "Conclusion".
  Estimate the total number of thoughts needed for a comprehensive thinking process around the user's request.
  Respond ONLY with a JSON object in the following format: 
  {
    "estimated_total_thoughts": <number>,
    "thoughts": [
      { "thought": "<content of thought 1>", "stage": "<stage for thought 1>" },
      { "thought": "<content of thought 2>", "stage": "<stage for thought 2>" },
      ...
    ]
  }
  Do not include any other text or explanations outside of this JSON structure.`;

  try {
    const { text } = await generateText({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `User's request: ${userPrompt}` },
      ],
      temperature: 0.5, // Adjust as needed for creativity vs. precision
    });

    // Attempt to parse the JSON response from the LLM
    let parsedResponse = JSON.parse(text.trim());
    // Sometimes LLMs wrap JSON in ```json ... ```, try to strip that if parsing fails
    if (typeof parsedResponse !== 'object' && text.includes('```json')) {
        const jsonText = text.substring(text.indexOf('```json') + 7, text.lastIndexOf('```'));
        parsedResponse = JSON.parse(jsonText.trim());
    }

    if (parsedResponse && parsedResponse.thoughts && typeof parsedResponse.estimated_total_thoughts === 'number') {
      return parsedResponse as GeneratedThoughtStructure;
    }
    console.error('Failed to parse thought structure from LLM:', text);
    return null;
  } catch (error) {
    console.error('Error generating initial thoughts with LLM:', error);
    return null;
  }
}

// Define the models for each stage
const reasoningModelId = "microsoft/phi-4-reasoning-plus:free";
const codingModelId = "qwen/qwen3-32b:free";
const refinementModelId = "deepseek/deepseek-r1-0528:free";
const finalRefinementModelId = "deepseek/deepseek-v3-base:free";

// Helper to generate text with a specific model
async function generateWithModel(modelId: string, messages: CoreMessage[]): Promise<string> {
  const { text } = await generateText({
    model: openrouterProvider.chat(modelId),
    messages,
  });
  return text;
}

export async function streamSequentialThinking({
  chatHistory,
  data,
}: {
  chatHistory: ChatHistory;
  data: StreamData;
}) {
  const userPrompt = chatHistory[chatHistory.length - 1].content;

  try {
    // Stage 1: Planning
    data.append(JSON.stringify({ type: 'stage', content: 'Planning...' }));
    const plan = await generateWithModel(reasoningModelId, [
      { role: 'system', content: 'You are a senior software architect. Your task is to analyze the following user prompt and create a detailed plan for implementation. Break down the problem into smaller, manageable steps.' },
      { role: 'user', content: userPrompt }
    ]);
    data.append(JSON.stringify({ type: 'plan', content: plan }));

    // Stage 2: Coding
    data.append(JSON.stringify({ type: 'stage', content: 'Generating base code...' }));
    const baseCode = await generateWithModel(codingModelId, [
        { role: 'system', content: 'You are a senior software engineer. Your task is to write the base code for the following plan. The code should be well-structured and easy to read.' },
        { role: 'user', content: `Based on the following plan, please write the necessary code:\n\n${plan}` }
    ]);
    data.append(JSON.stringify({ type: 'code', content: baseCode }));

    // Stage 3: Refinement
    data.append(JSON.stringify({ type: 'stage', content: 'Refining code...' }));
    const refinedCode = await generateWithModel(refinementModelId, [
        { role: 'system', content: 'You are a code refactoring expert. Your task is to review the following code and improve it. Look for potential bugs, performance issues, or areas where the code could be made more elegant.' },
        { role: 'user', content: `Please review and refine the following code:\n\n${baseCode}` }
    ]);
    data.append(JSON.stringify({ type: 'refinedCode', content: refinedCode }));
    
    // Stage 4: Final Refinement & Streaming Output
    data.append(JSON.stringify({ type: 'stage', content: 'Performing final review and streaming...' }));
    const finalCodeResult = await streamText({
      model: openrouterProvider.chat(finalRefinementModelId),
      messages: [
        { role: 'system', content: 'You are a senior principal engineer. Your task is to perform a final review of the following code and make any necessary improvements to ensure it is production-ready. Focus on clarity, performance, and best practices. Output only the final code.' },
        { role: 'user', content: `Please perform a final review and refinement of the following code:\n\n${refinedCode}` }
      ],
      onFinish() {
        data.close();
      }
    });

    return finalCodeResult.textStream;
  } catch (error) {
    console.error("Error in sequential thinking process:", error);
    data.append(JSON.stringify({ type: 'error', content: 'An error occurred during generation.' }));
    data.close();
    throw error;
  }
}

/**
 * Orchestrates the sequential thinking process:
 * 1. Generates initial thoughts using an LLM.
 * 2. Processes each thought with the MCP server.
 * 3. Optionally, generates a summary from the MCP server.
 */
export async function getSequentialThinkingSteps(userPrompt: string, llmModelForInitialThoughts?: string): Promise<string | null> {
  await clearHistoryInMcp(); // Start with a clean slate

  const initialThoughtStructure = await generateInitialThoughts(userPrompt, llmModelForInitialThoughts);

  if (!initialThoughtStructure || !initialThoughtStructure.thoughts || initialThoughtStructure.thoughts.length === 0) {
    console.log('No initial thoughts generated. Skipping MCP processing.');
    return null;
  }

  const { thoughts, estimated_total_thoughts } = initialThoughtStructure;
  let processedThoughtsDetails = [];

  for (let i = 0; i < thoughts.length; i++) {
    const thoughtItem = thoughts[i];
    const thoughtData: Thought = {
      thought: thoughtItem.thought,
      thought_number: i + 1,
      total_thoughts: estimated_total_thoughts,
      next_thought_needed: i < thoughts.length - 1,
      stage: thoughtItem.stage,
    };
    const mcpResponse = await processThoughtWithMcp(thoughtData);
    if (mcpResponse) {
        processedThoughtsDetails.push({ thought_number: i+1, stage: thoughtItem.stage, content: thoughtItem.thought, mcp_response: mcpResponse});
    }
  }

  // Option 1: Generate a summary from MCP server (if its summary is useful)
  // const summaryResponse = await generateSummaryFromMcp();
  // if (summaryResponse && summaryResponse.summary) {
  //   return JSON.stringify(summaryResponse.summary, null, 2);
  // }

  // Option 2: Construct a string from the processed thoughts for the main LLM
  let thinkingStepsString = "Sequential Thinking Process:\n";
  processedThoughtsDetails.forEach(detail => {
      thinkingStepsString += `Step ${detail.thought_number} (${detail.stage}): ${detail.content}\n`;
  });

  return thinkingStepsString.trim() !== "Sequential Thinking Process:" ? thinkingStepsString : null;
}
