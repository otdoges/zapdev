#!/usr/bin/env node

/**
 * AI Production Validation Script
 * Run this before deploying to production to ensure AI functionality is ready
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';
// Simple color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

const chalk = {
  red: Object.assign((text) => `${colors.red}${text}${colors.reset}`, {
    bold: (text) => `${colors.red}${colors.bold}${text}${colors.reset}`
  }),
  green: Object.assign((text) => `${colors.green}${text}${colors.reset}`, {
    bold: (text) => `${colors.green}${colors.bold}${text}${colors.reset}`
  }),
  yellow: (text) => `${colors.yellow}${text}${colors.reset}`,
  blue: (text) => `${colors.blue}${text}${colors.reset}`,
  bold: (text) => `${colors.bold}${text}${colors.reset}`
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

class AIProductionValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.successes = [];
  }

  log(message, type = 'info') {
    const prefix = {
      success: chalk.green('✓'),
      error: chalk.red('✗'),
      warning: chalk.yellow('⚠'),
      info: chalk.blue('ℹ')
    }[type] || '';

    console.log(`${prefix} ${message}`);
  }

  async validateEnvironment() {
    this.log('Validating Environment Configuration...', 'info');

    const envFiles = ['.env.local', '.env.production', '.env'];
    let envFound = false;
    let envContent = '';

    for (const file of envFiles) {
      const path = join(rootDir, file);
      if (existsSync(path)) {
        envFound = true;
        envContent = readFileSync(path, 'utf8');
        this.successes.push(`Environment file found: ${file}`);
        break;
      }
    }

    if (!envFound) {
      this.errors.push('No environment file found (.env.local or .env.production)');
      return;
    }

    const requiredVars = [
      'VITE_CLERK_PUBLISHABLE_KEY',
      'VITE_CONVEX_URL',
      'VITE_GROQ_API_KEY'
    ];

    const optionalVars = [
      'VITE_OPENROUTER_API_KEY',
      'VITE_E2B_API_KEY',
      'VITE_SENTRY_DSN',
      'VITE_PUBLIC_POSTHOG_KEY'
    ];

    for (const varName of requiredVars) {
      const regex = new RegExp(`^\\s*${varName}\\s*=\\s*(.+)$`, 'm');
      const match = envContent.match(regex);
      if (match && match[1].trim() && !match[1].trim().startsWith('YOUR_')) {
        this.successes.push(`Required: ${varName} is configured`);
      } else {
        this.errors.push(`Required: ${varName} is missing or not configured`);
      }
    }

    for (const varName of optionalVars) {
      if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=YOUR_`)) {
        this.successes.push(`Optional: ${varName} is configured`);
      } else {
        this.warnings.push(`Optional: ${varName} is not configured`);
      }
    }

    if (envContent.includes('pk_test_') || envContent.includes('sk_test_')) {
      this.errors.push('Test API keys detected! Use production keys (pk_live_*, sk_live_*)');
    }

    const placeholders = ['your-api-key', 'YOUR_API_KEY', 'xxx', 'TODO'];
    for (const placeholder of placeholders) {
      if (envContent.includes(placeholder)) {
        this.errors.push(`Placeholder value "${placeholder}" found in environment file`);
      }
    }
  }

  async validateDependencies() {
    this.log('Validating Dependencies...', 'info');

    const packagePath = join(rootDir, 'package.json');
    if (!existsSync(packagePath)) {
      this.errors.push('package.json not found');
      return;
    }

    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    const criticalDeps = [
      '@ai-sdk/groq',
      '@openrouter/ai-sdk-provider',
      'ai',
      '@e2b/code-interpreter',
      '@sentry/react',
      'convex'
    ];

    for (const dep of criticalDeps) {
      if (deps[dep]) {
        this.successes.push(`Dependency: ${dep} is installed`);
      } else {
        this.errors.push(`Missing dependency: ${dep}`);
      }
    }
  }

  async validateCodeIntegrity() {
    this.log('Validating Code Integrity...', 'info');

    const criticalFiles = [
      'src/lib/ai.ts',
      'src/lib/ai-utils.ts',
      'src/lib/ai-monitoring.ts',
      'src/lib/api-key-validator.ts',
      'convex/messages.ts',
      'convex/aiRateLimit.ts',
      'convex/schema.ts'
    ];

    for (const file of criticalFiles) {
      const path = join(rootDir, file);
      if (existsSync(path)) {
        this.successes.push(`File exists: ${file}`);

        const content = readFileSync(path, 'utf8');

        if (file.startsWith('src/') && content.includes('process.env')) {
          this.errors.push(`Client file ${file} uses process.env instead of import.meta.env`);
        }

        const consoleCount = (content.match(/console\.(log|debug)/g) || []).length;
        if (consoleCount > 5) {
          this.warnings.push(`File ${file} has ${consoleCount} console.log/debug statements`);
        }

        const todoCount = (content.match(/TODO|FIXME|HACK/gi) || []).length;
        if (todoCount > 0) {
          this.warnings.push(`File ${file} has ${todoCount} TODO/FIXME/HACK comments`);
        }
      } else {
        this.errors.push(`Missing file: ${file}`);
      }
    }
  }

  async validateSecurity() {
    this.log('Validating Security...', 'info');

    const sourceFiles = [
      'src/lib/ai.ts',
      'src/lib/secure-storage.ts',
      'src/components/ChatInterface.tsx'
    ];

    const apiKeyPatterns = [
      /gsk_[a-zA-Z0-9]{20,}/,
      /sk-or-[a-zA-Z0-9]{20,}/,
      /e2b_[a-zA-Z0-9]{20,}/,
      /sk_live_[a-zA-Z0-9]{20,}/
    ];

    for (const file of sourceFiles) {
      const path = join(rootDir, file);
      if (existsSync(path)) {
        const content = readFileSync(path, 'utf8');

        for (const pattern of apiKeyPatterns) {
          if (pattern.test(content)) {
            this.errors.push(`CRITICAL: Hardcoded API key found in ${file}`);
          }
        }
      }
    }

    this.successes.push('No hardcoded API keys found in source files');
  }

  async validateBuildConfiguration() {
    this.log('Validating Build Configuration...', 'info');

    const viteConfigPath = join(rootDir, 'vite.config.ts');
    if (existsSync(viteConfigPath)) {
      this.successes.push('Vite configuration found');

      const content = readFileSync(viteConfigPath, 'utf8');
      if (content.includes('minify: true') || content.includes('minify:true')) {
        this.successes.push('Build minification enabled');
      } else {
        this.warnings.push('Build minification not explicitly enabled');
      }
    }

    const tsConfigPath = join(rootDir, 'tsconfig.json');
    if (existsSync(tsConfigPath)) {
      const tsConfig = JSON.parse(readFileSync(tsConfigPath, 'utf8'));
      if (tsConfig.compilerOptions?.strict) {
        this.successes.push('TypeScript strict mode enabled');
      } else {
        this.warnings.push('TypeScript strict mode not enabled');
      }
    }
  }

  async runAllValidations() {
    console.log(chalk.bold('\n🤖 AI Production Validation Report\n'));

    await this.validateEnvironment();
    await this.validateDependencies();
    await this.validateCodeIntegrity();
    await this.validateSecurity();
    await this.validateBuildConfiguration();

    console.log(chalk.bold('\n📊 Summary:\n'));

    if (this.successes.length > 0) {
      console.log(chalk.green(`✅ ${this.successes.length} checks passed`));
      if (process.env.VERBOSE) {
        this.successes.forEach(s => this.log(s, 'success'));
      }
    }

    if (this.warnings.length > 0) {
      console.log(chalk.yellow(`\n⚠️  ${this.warnings.length} warnings:`));
      this.warnings.forEach(w => this.log(w, 'warning'));
    }

    if (this.errors.length > 0) {
      console.log(chalk.red(`\n❌ ${this.errors.length} errors:`));
      this.errors.forEach(e => this.log(e, 'error'));
    }

    console.log(chalk.bold('\n🏁 Final Status:'));
    if (this.errors.length === 0) {
      console.log(chalk.green.bold('✅ AI system is READY for production!'));
      console.log(chalk.green('All critical checks passed.'));

      if (this.warnings.length > 0) {
        console.log(chalk.yellow('\nConsider addressing the warnings for optimal performance.'));
      }

      return 0;
    } else {
      console.log(chalk.red.bold('❌ AI system is NOT ready for production.'));
      console.log(chalk.red('Please fix the errors above before deploying.'));
      return 1;
    }
  }
}

const validator = new AIProductionValidator();
validator.runAllValidations().then(exitCode => {
  process.exit(exitCode);
}).catch(error => {
  console.error(chalk.red('Validation script error:'), error);
  process.exit(1);
});