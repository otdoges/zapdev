#!/usr/bin/env node

/**
 * Script to replace console.log statements with proper error logging
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Files/directories to exclude
const excludePatterns = [
  'node_modules',
  '.next',
  '.git',
  'scripts/', // Scripts can keep console.log
  'error-logger.ts', // Error logger itself needs console.log
  'public/',
  '*.log',
  '*.json',
];

// Map of console methods to error logger methods
const consoleToLoggerMap = {
  'console.log': 'errorLogger.info',
  'console.error': 'errorLogger.error',
  'console.warn': 'errorLogger.warning',
  'console.debug': 'errorLogger.debug',
};

let totalReplacements = 0;
let filesModified = 0;

function shouldExclude(filePath) {
  return excludePatterns.some((pattern) => {
    if (pattern.endsWith('/')) {
      return filePath.includes(pattern);
    }
    return filePath.includes(pattern) || filePath.endsWith(pattern);
  });
}

function processFile(filePath) {
  if (shouldExclude(filePath)) {
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let replacements = 0;

    // Check if file already imports errorLogger
    const hasErrorLoggerImport =
      content.includes('errorLogger') || content.includes('error-logger');

    // Replace console statements
    Object.entries(consoleToLoggerMap).forEach(([consoleMethod, loggerMethod]) => {
      const regex = new RegExp(`${consoleMethod}\\(`, 'g');
      const matches = content.match(regex);

      if (matches) {
        // Determine appropriate category based on file path
        let category = 'ErrorCategory.GENERAL';
        if (filePath.includes('/api/')) {
          category = 'ErrorCategory.API';
        } else if (filePath.includes('/auth/')) {
          category = 'ErrorCategory.AUTH';
        } else if (filePath.includes('supabase')) {
          category = 'ErrorCategory.DATABASE';
        } else if (filePath.includes('ai') || filePath.includes('groq')) {
          category = 'ErrorCategory.AI_MODEL';
        } else if (filePath.includes('webcontainer')) {
          category = 'ErrorCategory.WEBCONTAINER';
        }

        // Replace console calls
        content = content.replace(regex, (match) => {
          replacements++;
          return `${loggerMethod}(${category}, `;
        });

        modified = true;
      }
    });

    // Add import if needed and file was modified
    if (modified && !hasErrorLoggerImport && !filePath.endsWith('.js')) {
      const importStatement = `import { errorLogger, ErrorCategory } from '@/lib/error-logger';\n`;

      // Find the right place to add import
      const firstImportIndex = content.indexOf('import ');
      if (firstImportIndex !== -1) {
        // Add after other imports
        const afterImports = content.indexOf('\n\n', firstImportIndex);
        if (afterImports !== -1) {
          content =
            content.slice(0, afterImports) + '\n' + importStatement + content.slice(afterImports);
        } else {
          // Add at the beginning
          content = importStatement + '\n' + content;
        }
      } else {
        // Add at the beginning
        content = importStatement + '\n' + content;
      }
    }

    // Write back if modified
    if (modified) {
      fs.writeFileSync(filePath, content);
      filesModified++;
      totalReplacements += replacements;
      log(`✅ ${filePath} - ${replacements} replacements`, 'green');
    }
  } catch (error) {
    log(`❌ Error processing ${filePath}: ${error.message}`, 'red');
  }
}

function processDirectory(dir) {
  try {
    const items = fs.readdirSync(dir);

    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !shouldExclude(fullPath)) {
        processDirectory(fullPath);
      } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
        processFile(fullPath);
      }
    });
  } catch (error) {
    log(`❌ Error reading directory ${dir}: ${error.message}`, 'red');
  }
}

// Main execution
log('🔍 Replacing console.log statements with error logger...', 'bright');
log('━'.repeat(50), 'blue');

// Process app, components, and lib directories
const dirsToProcess = ['app', 'components', 'lib'];

dirsToProcess.forEach((dir) => {
  if (fs.existsSync(dir)) {
    log(`\n📁 Processing ${dir}/...`, 'blue');
    processDirectory(dir);
  }
});

log('\n' + '━'.repeat(50), 'blue');
log(`✅ Complete! Modified ${filesModified} files with ${totalReplacements} replacements`, 'green');

if (filesModified > 0) {
  log('\n📝 Next steps:', 'yellow');
  log('   1. Review the changes with git diff', 'yellow');
  log('   2. Test the application to ensure logging works', 'yellow');
  log('   3. Commit the changes', 'yellow');
}
