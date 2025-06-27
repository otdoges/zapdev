import { BaseProjectTemplate, ProjectSetupOptions, ProjectTemplateConfig } from './base-template';
import { FileSystemTree } from '../webcontainer/file-manager';

export class GenericProjectTemplate extends BaseProjectTemplate {
  constructor() {
    super({
      name: 'Generic JavaScript Project',
      type: 'generic',
      description: 'Simple JavaScript/Node.js project with modern tooling',
      version: '1.0.0',
    });
  }

  detectProjectType(codeContent: string): boolean {
    // If it's not HTML or React, default to generic
    return !codeContent.includes('<!DOCTYPE html>') && 
           !codeContent.includes('<html') &&
           !codeContent.includes('import React') && 
           !codeContent.includes('from "react"');
  }

  getDefaultDependencies(): string[] {
    return [];
  }

  getDefaultDevDependencies(): string[] {
    return ['nodemon', '@types/node'];
  }

  getDefaultScripts(): Record<string, string> {
    return {
      start: 'node index.js',
      dev: 'nodemon index.js',
      test: 'echo "Error: no test specified" && exit 1',
    };
  }

  async generateFiles(options: ProjectSetupOptions): Promise<FileSystemTree> {
    const { codeContent = '', instructions = '' } = options;
    
    const analysis = this.analyzeInstructions(instructions);
    const mainContent = codeContent || this.generateDefaultCode(analysis);

    return {
      'index.js': {
        file: { contents: mainContent },
      },
      'package.json': {
        file: { contents: this.createPackageJson() },
      },
      'README.md': {
        file: { contents: this.generateReadme() },
      },
      '.gitignore': {
        file: { contents: this.generateGitignore() },
      },
    };
  }

  private generateDefaultCode(analysis: ReturnType<typeof this.analyzeInstructions>): string {
    if (analysis.hasApi) {
      return this.generateExpressServer();
    }
    
    return this.generateSimpleNodeApp();
  }

  private generateExpressServer(): string {
    return `const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to your Express API!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime() });
});

app.get('/api/hello/:name?', (req, res) => {
  const name = req.params.name || 'World';
  res.json({ message: \`Hello, \${name}!\` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(\`🚀 Server running on http://localhost:\${PORT}\`);
  console.log(\`📚 API endpoints:\`);
  console.log(\`   GET / - Welcome message\`);
  console.log(\`   GET /api/health - Health check\`);
  console.log(\`   GET /api/hello/:name - Greeting\`);
});`;
  }

  private generateSimpleNodeApp(): string {
    return `#!/usr/bin/env node

console.log('🚀 Welcome to your JavaScript project!');
console.log('==================================');

// Example function
function greet(name = 'World') {
  return \`Hello, \${name}!\`;
}

// Example class
class Calculator {
  add(a, b) {
    return a + b;
  }
  
  subtract(a, b) {
    return a - b;
  }
  
  multiply(a, b) {
    return a * b;
  }
  
  divide(a, b) {
    if (b === 0) {
      throw new Error('Division by zero is not allowed');
    }
    return a / b;
  }
}

// Example usage
const calc = new Calculator();

console.log(greet('JavaScript'));
console.log(\`2 + 3 = \${calc.add(2, 3)}\`);
console.log(\`10 - 4 = \${calc.subtract(10, 4)}\`);
console.log(\`5 * 6 = \${calc.multiply(5, 6)}\`);
console.log(\`15 / 3 = \${calc.divide(15, 3)}\`);

// Export for use in other files
module.exports = {
  greet,
  Calculator
};`;
  }

  private generateGitignore(): string {
    return `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Compiled binary addons
build/Release/

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db`;
  }

  private generateReadme(): string {
    return `# Generic JavaScript Project

A simple JavaScript/Node.js project with modern tooling and best practices.

## Features

- 🟨 **JavaScript/Node.js** - Modern JavaScript with ES6+ features
- 📦 **NPM Scripts** - Pre-configured development scripts
- 🔄 **Nodemon** - Auto-restart during development
- 📝 **Best Practices** - Clean code structure and examples

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

3. Or run the production version:
   \`\`\`bash
   npm start
   \`\`\`

## Available Scripts

- \`npm start\` - Run the application
- \`npm run dev\` - Run with auto-restart (nodemon)
- \`npm test\` - Run tests (add your test framework)

## Project Structure

\`\`\`
.
├── index.js          # Main application file
├── package.json      # Project configuration and dependencies
├── README.md         # This file
└── .gitignore       # Git ignore rules
\`\`\`

## Development

The main application logic is in \`index.js\`. Add your code there or create additional modules as needed.

## License

MIT License
`;
  }
}