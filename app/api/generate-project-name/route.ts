import { NextRequest, NextResponse } from 'next/server';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { 
      userInput, 
      fileContents, 
      url, 
      existingNames = [] 
    } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        error: 'Gemini API key not configured' 
      }, { status: 500 });
    }

    // Build context for project naming
    let context = '';
    
    if (userInput) {
      context += `User Request: "${userInput}"\n\n`;
    }
    
    if (url) {
      context += `Cloned from URL: ${url}\n\n`;
    }
    
    if (fileContents && fileContents.length > 0) {
      context += `Project contains these files:\n`;
      fileContents.forEach((file: any) => {
        context += `- ${file.path}: ${file.content.substring(0, 200)}...\n`;
      });
      context += '\n';
    }

    const avoidNamesText = existingNames.length > 0 
      ? `\n\nAvoid these existing names: ${existingNames.join(', ')}`
      : '';

    const prompt = `You are an expert at naming software projects. Generate a perfect, memorable name for this project based on the context provided.

${context}

Requirements:
- Keep it short (1-3 words max)
- Make it descriptive but catchy
- Use proper capitalization (e.g., "Task Manager", "Blog Platform")
- Consider the project's main purpose and features
- Make it unique and memorable
- No generic names like "App" or "Website"${avoidNamesText}

Analysis the context and respond with ONLY the project name, nothing else. No explanation, no quotes, just the name.

Examples of good names:
- "Invoice Tracker" (for a billing app)
- "Recipe Finder" (for a cooking app)  
- "Dashboard Pro" (for an analytics dashboard)
- "Chat Bubble" (for a messaging app)
- "Code Mentor" (for a learning platform)`;

    const result = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 20,
    });

    const projectName = result.text.trim();
    
    // Validate the generated name
    if (!projectName || projectName.length > 50) {
      throw new Error('Invalid project name generated');
    }

    return NextResponse.json({
      success: true,
      projectName: projectName,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Project naming error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate project name',
      fallbackName: generateFallbackName()
    }, { status: 500 });
  }
}

// Fallback name generation if AI fails
function generateFallbackName(): string {
  const adjectives = ['Smart', 'Modern', 'Creative', 'Dynamic', 'Elegant', 'Sleek', 'Advanced'];
  const nouns = ['Project', 'App', 'Platform', 'Studio', 'Builder', 'Creator', 'Manager'];
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adj} ${noun}`;
}