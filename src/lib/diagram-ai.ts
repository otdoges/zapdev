/**
 * AI utilities specifically for diagram generation and planning workflows
 */

import { generateAIResponse } from './ai';

// Diagram generation prompts
export const DIAGRAM_SYSTEM_PROMPT = `You are ZapDev AI with advanced diagram generation capabilities. When users ask for planning, workflows, processes, or system design, you should create visual diagrams using Mermaid syntax.

## Diagram Generation Rules:

1. **When to Generate Diagrams:**
   - Planning requests (project plans, development workflows, etc.)
   - Process descriptions (how things work step-by-step)
   - System architecture questions
   - Workflow optimization requests
   - Project roadmaps or timelines
   - Any request where a visual flow would be helpful

2. **Mermaid Syntax Support:**
   - Flowcharts: \`\`\`mermaid flowchart TD\`\`\`
   - Sequence diagrams: \`\`\`mermaid sequenceDiagram\`\`\`
   - Gantt charts: \`\`\`mermaid gantt\`\`\`
   - State diagrams: \`\`\`mermaid stateDiagram-v2\`\`\`

3. **Diagram Best Practices:**
   - Use clear, concise labels
   - Logical flow from top to bottom or left to right
   - Group related steps or components
   - Use appropriate diagram types for the content
   - Include decision points and branches where relevant

4. **Response Structure:**
   When generating a plan with a diagram, structure your response as:
   
   \`\`\`
   ## [Plan Title]
   
   [Brief overview of the plan]
   
   \`\`\`mermaid
   flowchart TD
       [diagram content]
   \`\`\`
   
   ### Key Components:
   [Explain the main parts of the diagram]
   
   ### Next Steps:
   [Actionable next steps for the user]
   \`\`\`

5. **Diagram Types by Use Case:**
   - **Flowcharts**: Development processes, decision trees, user flows
   - **Sequence Diagrams**: API interactions, user authentication flows
   - **Gantt Charts**: Project timelines, development schedules
   - **State Diagrams**: Application states, user journey stages

6. **Styling Guidelines:**
   - Use consistent node shapes and colors
   - Keep text concise but descriptive
   - Use meaningful IDs for nodes
   - Add styling classes when appropriate

## Examples:

### Development Process Flowchart:
\`\`\`mermaid
flowchart TD
    A[Requirements Gathering] --> B[System Design]
    B --> C[Frontend Development]
    B --> D[Backend Development]
    C --> E[Integration]
    D --> E
    E --> F[Testing]
    F --> G[Deployment]
    G --> H[Monitoring]
\`\`\`

### User Authentication Sequence:
\`\`\`mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth Service
    participant D as Database
    
    U->>F: Enter credentials
    F->>A: Validate login
    A->>D: Check user
    D-->>A: User data
    A-->>F: JWT token
    F-->>U: Login success
\`\`\`

Remember: Always provide both the visual diagram AND a clear explanation of what it represents and how to act on it.`;

// Helper function to detect if a prompt should generate a diagram
export function shouldGenerateDiagram(prompt: string): boolean {
  const planningKeywords = [
    'plan', 'planning', 'workflow', 'process', 'steps', 'roadmap',
    'timeline', 'schedule', 'architecture', 'system design', 'flow',
    'diagram', 'chart', 'visual', 'how to', 'guide', 'strategy',
    'approach', 'methodology', 'framework', 'structure', 'organize',
    'breakdown', 'phases', 'stages', 'sequence', 'order'
  ];

  const lowerPrompt = prompt.toLowerCase();
  return planningKeywords.some(keyword => lowerPrompt.includes(keyword));
}

// Extract diagram type from prompt content
export function detectDiagramType(prompt: string): 'flowchart' | 'sequence' | 'gantt' | 'mermaid' {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('timeline') || lowerPrompt.includes('schedule') || lowerPrompt.includes('gantt')) {
    return 'gantt';
  }
  
  if (lowerPrompt.includes('sequence') || lowerPrompt.includes('interaction') || lowerPrompt.includes('api')) {
    return 'sequence';
  }
  
  if (lowerPrompt.includes('flowchart') || lowerPrompt.includes('flow') || lowerPrompt.includes('process')) {
    return 'flowchart';
  }
  
  return 'mermaid'; // Default to mermaid for general diagrams
}

// Enhanced prompt for diagram generation
export function createDiagramPrompt(userPrompt: string): string {
  const diagramType = detectDiagramType(userPrompt);
  
  const enhancedPrompt = `${DIAGRAM_SYSTEM_PROMPT}

User Request: ${userPrompt}

Please create a comprehensive response that includes:
1. A ${diagramType} diagram using Mermaid syntax
2. Clear explanation of the plan/process
3. Actionable next steps

Focus on creating a visual representation that helps the user understand and execute the plan effectively.`;

  return enhancedPrompt;
}

// Parse diagram data from AI response
export function parseDiagramFromResponse(response: string): {
  diagramText: string;
  type: 'mermaid' | 'flowchart' | 'sequence' | 'gantt';
} | null {
  // Match Mermaid code blocks
  const mermaidRegex = /```mermaid\s*\n([\s\S]*?)\n```/;
  const match = response.match(mermaidRegex);
  
  if (!match) return null;
  
  const diagramText = match[1].trim();
  
  // Detect diagram type from the content
  let type: 'mermaid' | 'flowchart' | 'sequence' | 'gantt' = 'mermaid';
  
  if (diagramText.includes('flowchart') || diagramText.includes('graph')) {
    type = 'flowchart';
  } else if (diagramText.includes('sequenceDiagram')) {
    type = 'sequence';
  } else if (diagramText.includes('gantt')) {
    type = 'gantt';
  }
  
  return {
    diagramText,
    type
  };
}

// Generate diagram-enhanced AI response
export async function generateDiagramResponse(prompt: string): Promise<{
  response: string;
  diagramData?: {
    type: 'mermaid' | 'flowchart' | 'sequence' | 'gantt';
    diagramText: string;
    isApproved?: boolean;
    userFeedback?: string;
    version: number;
  };
}> {
  const shouldIncludeDiagram = shouldGenerateDiagram(prompt);
  
  if (!shouldIncludeDiagram) {
    // Generate normal response
    const response = await generateAIResponse(prompt);
    return { response };
  }
  
  // Generate diagram-enhanced response
  const diagramPrompt = createDiagramPrompt(prompt);
  const response = await generateAIResponse(diagramPrompt);
  
  // Parse diagram from response
  const diagramInfo = parseDiagramFromResponse(response);
  
  if (diagramInfo) {
    return {
      response,
      diagramData: {
        type: diagramInfo.type,
        diagramText: diagramInfo.diagramText,
        version: 1,
      }
    };
  }
  
  return { response };
}

// Generate updated diagram based on feedback
export async function generateUpdatedDiagram(
  originalDiagram: string,
  feedback: string,
  diagramType: 'mermaid' | 'flowchart' | 'sequence' | 'gantt',
  version: number
): Promise<{
  diagramText: string;
  version: number;
}> {
  const updatePrompt = `${DIAGRAM_SYSTEM_PROMPT}

TASK: Update the following ${diagramType} diagram based on user feedback.

ORIGINAL DIAGRAM:
\`\`\`mermaid
${originalDiagram}
\`\`\`

USER FEEDBACK:
${feedback}

Please provide an improved version of the diagram that addresses the user's feedback. Return only the updated Mermaid diagram code within \`\`\`mermaid code blocks.

Requirements:
- Address all points in the user feedback
- Maintain the same diagram type (${diagramType})
- Keep the diagram clear and well-structured
- Ensure all node IDs and connections are valid`;

  const response = await generateAIResponse(updatePrompt);
  const diagramInfo = parseDiagramFromResponse(response);
  
  if (diagramInfo) {
    return {
      diagramText: diagramInfo.diagramText,
      version: version + 1,
    };
  }
  
  // Fallback: return original with incremented version
  return {
    diagramText: originalDiagram,
    version: version + 1,
  };
}