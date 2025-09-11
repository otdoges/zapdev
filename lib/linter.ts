// Linter utility for automatic code fixing

export interface LintResult {
  success: boolean;
  fixedCode: string;
  errors: Array<{
    line: number;
    column: number;
    message: string;
    ruleId: string | null;
  }>;
  warnings: Array<{
    line: number;
    column: number;
    message: string;
    ruleId: string | null;
  }>;
  wasFixed: boolean;
  fixableErrorCount?: number;
  fixableWarningCount?: number;
}

export async function lintAndFixCode(code: string, fileName?: string): Promise<LintResult> {
  try {
    const response = await fetch('/api/lint-and-fix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        fileName: fileName || 'temp.tsx'
      }),
    });

    if (!response.ok) {
      throw new Error(`Lint API failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Linting failed');
    }

    return result;
  } catch (error) {
    console.error('Linter error:', error);
    
    // Return original code if linting fails
    return {
      success: false,
      fixedCode: code,
      errors: [],
      warnings: [],
      wasFixed: false
    };
  }
}

export function hasErrors(result: LintResult): boolean {
  return result.errors.length > 0;
}

export function hasWarnings(result: LintResult): boolean {
  return result.warnings.length > 0;
}

export function formatLintIssues(result: LintResult): string {
  const issues: string[] = [];
  
  if (result.errors.length > 0) {
    issues.push('Errors:');
    result.errors.forEach(error => {
      issues.push(`  Line ${error.line}:${error.column} - ${error.message} (${error.ruleId || 'unknown'})`);
    });
  }
  
  if (result.warnings.length > 0) {
    issues.push('Warnings:');
    result.warnings.forEach(warning => {
      issues.push(`  Line ${warning.line}:${warning.column} - ${warning.message} (${warning.ruleId || 'unknown'})`);
    });
  }
  
  return issues.join('\n');
}

// For server-side use (direct ESLint integration)
export async function lintCodeServerSide(code: string, fileName?: string) {
  // This would be used in API routes where we can import ESLint directly
  // For now, we'll use the API endpoint approach
  return lintAndFixCode(code, fileName);
}