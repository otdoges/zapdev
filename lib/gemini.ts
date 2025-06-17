/**
 * Utility functions for interacting with the Gemini API
 */

// Function to enhance a prompt using Gemini 2.0 Flash
export async function enhancePromptWithGemini(prompt: string): Promise<string> {
  try {
    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is not set. Returning original prompt.');
      return prompt;
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Please enhance this prompt for generating a UI design. 
            Follow the guidelines in the AI Design Playbook: use visual hierarchy, be specific about layout, 
            typography, color schemes, and components. Make the prompt more specific and detailed, 
            but maintain the original user intent. Here's the prompt to enhance:

            ${prompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.4,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      console.error(`Error from Gemini API: ${response.status} ${response.statusText}`);
      return prompt; // Return original prompt on error
    }

    const result = await response.json();
    
    if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
      return result.candidates[0].content.parts[0].text;
    } else {
      console.warn('Unexpected response format from Gemini API');
      return prompt;
    }
  } catch (error) {
    console.error('Error enhancing prompt with Gemini:', error);
    return prompt; // Return original prompt on error
  }
} 