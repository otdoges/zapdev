import { executeCode } from './sandbox';

export type ToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

export type ToolCallResult = {
  ok: boolean;
  content: string;
};

// Attempt to parse a tool_call JSON object from raw assistant text.
// Rules:
// - The entire trimmed string should be a single JSON object with shape { name, arguments }
// - No code fences; no leading/trailing commentary
export function parseToolCallFromText(text: string): ToolCall | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null;
  try {
    const obj = JSON.parse(trimmed);
    if (obj && typeof obj === 'object' && typeof obj.name === 'string' && obj.arguments && typeof obj.arguments === 'object') {
      return { name: obj.name, arguments: obj.arguments as Record<string, unknown> };
    }
  } catch {
    return null;
  }
  return null;
}

// Small helper to stringify outputs and clamp to a safe display length
function formatOutput(label: string, value: string | undefined, max = 4000): string {
  if (!value) return '';
  const clipped = value.length > max ? value.slice(0, max) + '\n…\n[truncated]' : value;
  return `${label}:\n${clipped}`;
}

export async function handleToolCall(toolCall: ToolCall): Promise<ToolCallResult> {
  switch (toolCall.name) {
    case 'code_execute': {
      // Expected args: { language?: 'javascript' | 'typescript', code: string, timeoutMs?: number }
      const language = ((toolCall.arguments.language as string) || 'javascript').toLowerCase();
      const code = String(toolCall.arguments.code || '').slice(0, 50000);
      const timeout = typeof toolCall.arguments.timeoutMs === 'number' ? toolCall.arguments.timeoutMs : undefined;

      if (!code) {
        return { ok: false, content: 'Tool code_execute: missing code argument' };
      }

      if (language === 'python') {
        return { ok: false, content: 'Tool code_execute only supports JavaScript. Python is disabled.' };
      }

      if (language === 'typescript') {
        return { ok: false, content: 'Provide transpiled JavaScript to execute. TypeScript execution is not supported directly in the sandbox.' };
      }

      const result = await executeCode(code, 'javascript');

      const parts: string[] = [];
      parts.push(`Tool code_execute run complete (language=${language}).`);
      parts.push(formatOutput('Output', result.stdout));
      if (result.stderr) parts.push(formatOutput('Errors', result.stderr));
      return { ok: result.success, content: parts.filter(Boolean).join('\n\n') };
    }
    default:
      return { ok: false, content: `Unknown tool: ${toolCall.name}` };
  }
}


