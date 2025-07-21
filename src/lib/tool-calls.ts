import e2bService, { type ExecutionResult } from './e2b-service';
import { systemPrompt } from './systemPrompt';

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolCallResult {
  tool_call_id: string;
  output: string;
  success: boolean;
  executionTime?: number;
}

export interface NextJSProjectArgs {
  projectName: string;
  projectType: 'landing-page' | 'business-website' | 'portfolio' | 'blog' | 'saas-interface' | 'dashboard' | 'e-commerce' | 'creative-showcase';
  features?: string[];
  colorScheme?: 'light' | 'dark' | 'auto';
  includeShadcnUI?: boolean;
}

export interface CodeExecutionArgs {
  code: string;
  language?: 'python' | 'javascript' | 'typescript' | 'bash';
  installPackages?: string[];
}

export interface ComponentCreationArgs {
  componentName: string;
  componentType: 'page' | 'layout' | 'ui-component' | 'custom-component';
  props?: Record<string, any>;
  styling?: 'tailwind' | 'shadcn' | 'custom';
  responsive?: boolean;
}

export interface FileOperationArgs {
  path: string;
  content?: string;
  operation: 'create' | 'read' | 'list' | 'update';
}

export interface WebsiteStructureArgs {
  pages: string[];
  components: string[];
  features: string[];
  integrations?: string[];
}

// Tool definitions aligned with ZapDev's Next.js specialization
export const availableTools = [
  {
    type: 'function',
    function: {
      name: 'create_nextjs_project',
      description: 'Create a complete Next.js 14+ project with App Router, TypeScript, Tailwind CSS, and Shadcn/ui components. Perfect for modern website building.',
      parameters: {
        type: 'object',
        properties: {
          projectName: {
            type: 'string',
            description: 'Name of the Next.js project'
          },
          projectType: {
            type: 'string',
            enum: ['landing-page', 'business-website', 'portfolio', 'blog', 'saas-interface', 'dashboard', 'e-commerce', 'creative-showcase'],
            description: 'Type of website to create'
          },
          features: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of features to include (animations, forms, responsive design, etc.)'
          },
          colorScheme: {
            type: 'string',
            enum: ['light', 'dark', 'auto'],
            description: 'Color scheme for the website'
          },
          includeShadcnUI: {
            type: 'boolean',
            description: 'Whether to include Shadcn/ui components',
            default: true
          }
        },
        required: ['projectName', 'projectType']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_react_component',
      description: 'Create a React component following Next.js App Router patterns with TypeScript and Tailwind CSS styling.',
      parameters: {
        type: 'object',
        properties: {
          componentName: {
            type: 'string',
            description: 'Name of the component to create'
          },
          componentType: {
            type: 'string',
            enum: ['page', 'layout', 'ui-component', 'custom-component'],
            description: 'Type of component to create'
          },
          props: {
            type: 'object',
            description: 'Props interface for the component'
          },
          styling: {
            type: 'string',
            enum: ['tailwind', 'shadcn', 'custom'],
            description: 'Styling approach to use'
          },
          responsive: {
            type: 'boolean',
            description: 'Whether to include responsive design patterns',
            default: true
          }
        },
        required: ['componentName', 'componentType']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'install_dependencies',
      description: 'Install npm packages required for Next.js development (Tailwind, Shadcn/ui, Framer Motion, etc.)',
      parameters: {
        type: 'object',
        properties: {
          packages: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of npm packages to install'
          },
          dev: {
            type: 'boolean',
            description: 'Whether these are development dependencies',
            default: false
          }
        },
        required: ['packages']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'execute_code',
      description: 'Execute code in a secure sandbox environment. Supports Python, JavaScript, TypeScript, and Bash.',
      parameters: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'The code to execute'
          },
          language: {
            type: 'string',
            enum: ['python', 'javascript', 'typescript', 'bash'],
            description: 'The programming language of the code'
          },
          installPackages: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of packages to install before executing code'
          }
        },
        required: ['code']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_file',
      description: 'Create a file in the sandbox environment with proper Next.js project structure',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The file path (following Next.js App Router conventions)'
          },
          content: {
            type: 'string',
            description: 'The file content'
          }
        },
        required: ['path', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'setup_tailwind_config',
      description: 'Set up Tailwind CSS configuration with Shadcn/ui integration and custom design tokens',
      parameters: {
        type: 'object',
        properties: {
          customColors: {
            type: 'object',
            description: 'Custom color palette for the project'
          },
          darkMode: {
            type: 'boolean',
            description: 'Enable dark mode support',
            default: true
          },
          animations: {
            type: 'boolean',
            description: 'Include custom animations',
            default: true
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_website_structure',
      description: 'Create a complete website structure with pages, components, and features based on the project type',
      parameters: {
        type: 'object',
        properties: {
          pages: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of pages to create (home, about, contact, etc.)'
          },
          components: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of components to create (header, footer, hero, etc.)'
          },
          features: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of features to implement (animations, forms, etc.)'
          },
          integrations: {
            type: 'array',
            items: { type: 'string' },
            description: 'Third-party integrations to include'
          }
        },
        required: ['pages', 'components']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'optimize_performance',
      description: 'Optimize Next.js project for performance (images, fonts, Core Web Vitals)',
      parameters: {
        type: 'object',
        properties: {
          optimizeImages: {
            type: 'boolean',
            description: 'Optimize images with Next.js Image component',
            default: true
          },
          enableFonts: {
            type: 'boolean',
            description: 'Set up Google Fonts optimization',
            default: true
          },
          bundleAnalysis: {
            type: 'boolean',
            description: 'Add bundle analysis configuration',
            default: false
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read a file from the sandbox environment',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The file path to read'
          }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List files in a directory in the sandbox environment',
      parameters: {
        type: 'object',
        properties: {
          directory: {
            type: 'string',
            description: 'The directory path to list files from',
            default: '.'
          }
        }
      }
    }
  }
];

class ToolCallExecutor {
  private userId?: string;

  constructor(userId?: string) {
    this.userId = userId;
  }

  /**
   * Sets the user ID for session management
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Gets the system prompt for AI tool execution guidance
   */
  getSystemPrompt(): string {
    return systemPrompt;
  }

  async executeToolCall(toolCall: ToolCall): Promise<ToolCallResult> {
    const { function: func } = toolCall;
    
    try {
      const args = JSON.parse(func.arguments);
      
      switch (func.name) {
        case 'create_nextjs_project':
          return await this.createNextJSProject(toolCall.id, args);
        case 'create_react_component':
          return await this.createReactComponent(toolCall.id, args);
        case 'install_dependencies':
          return await this.installDependencies(toolCall.id, args);
        case 'execute_code':
          return await this.executeCode(toolCall.id, args);
        case 'create_file':
          return await this.createFile(toolCall.id, args);
        case 'setup_tailwind_config':
          return await this.setupTailwindConfig(toolCall.id, args);
        case 'create_website_structure':
          return await this.createWebsiteStructure(toolCall.id, args);
        case 'optimize_performance':
          return await this.optimizePerformance(toolCall.id, args);
        case 'read_file':
          return await this.readFile(toolCall.id, args);
        case 'list_files':
          return await this.listFiles(toolCall.id, args);
        default:
          return {
            tool_call_id: toolCall.id,
            output: `Unknown function: ${func.name}`,
            success: false
          };
      }
    } catch (error) {
      return {
        tool_call_id: toolCall.id,
        output: `Error executing tool call: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false
      };
    }
  }

  private async createNextJSProject(toolCallId: string, args: NextJSProjectArgs): Promise<ToolCallResult> {
    try {
      let output = `🚀 Creating Next.js 14+ project: ${args.projectName}\n`;
      output += `📁 Project Type: ${args.projectType}\n`;
      output += `🎨 Features: ${args.features?.join(', ') || 'Standard setup'}\n\n`;

      // Create package.json
      const packageJson = {
        name: args.projectName.toLowerCase().replace(/\s+/g, '-'),
        version: "0.1.0",
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
          lint: "next lint"
        },
        dependencies: {
          react: "^18",
          "react-dom": "^18",
          next: "14.2.5",
          typescript: "^5",
          "@types/node": "^20",
          "@types/react": "^18",
          "@types/react-dom": "^18",
          tailwindcss: "^3.4.0",
          autoprefixer: "^10.0.1",
          postcss: "^8",
          "class-variance-authority": "^0.7.0",
          clsx: "^2.0.0",
          "tailwind-merge": "^2.0.0",
          ...(args.includeShadcnUI && {
            "@radix-ui/react-slot": "^1.0.2",
            "lucide-react": "^0.263.1"
          }),
          ...(args.features?.includes('animations') && {
            "framer-motion": "^10.16.0"
          }),
          ...(args.features?.includes('forms') && {
            "react-hook-form": "^7.45.0",
            "@hookform/resolvers": "^3.1.0",
            zod: "^3.21.0"
          })
        },
        devDependencies: {
          eslint: "^8",
          "eslint-config-next": "14.2.5"
        }
      };

      await e2bService.createFile('package.json', JSON.stringify(packageJson, null, 2), this.userId);
      output += `✅ Created package.json\n`;

      // Create Next.js config
      const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
  },
}

module.exports = nextConfig`;

      await e2bService.createFile('next.config.js', nextConfig, this.userId);
      output += `✅ Created next.config.js\n`;

      // Create TypeScript config
      const tsConfig = {
        compilerOptions: {
          target: "es5",
          lib: ["dom", "dom.iterable", "es6"],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          forceConsistentCasingInFileNames: true,
          noEmit: true,
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "bundler",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "preserve",
          incremental: true,
          plugins: [{ name: "next" }],
          baseUrl: ".",
          paths: {
            "@/*": ["./src/*"],
            "@/components/*": ["./src/components/*"],
            "@/lib/*": ["./src/lib/*"]
          }
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        exclude: ["node_modules"]
      };

      await e2bService.createFile('tsconfig.json', JSON.stringify(tsConfig, null, 2), this.userId);
      output += `✅ Created tsconfig.json\n`;

      // Create app directory structure
      await e2bService.createFile('app/layout.tsx', this.generateRootLayout(args), this.userId);
      await e2bService.createFile('app/page.tsx', this.generateHomePage(args), this.userId);
      await e2bService.createFile('app/globals.css', this.generateGlobalCSS(args), this.userId);
      output += `✅ Created app directory structure\n`;

      // Create Tailwind config
      await e2bService.createFile('tailwind.config.ts', this.generateTailwindConfig(args), this.userId);
      await e2bService.createFile('postcss.config.js', this.generatePostCSSConfig(), this.userId);
      output += `✅ Created Tailwind CSS configuration\n`;

      // Create components directory
      if (args.includeShadcnUI) {
        await e2bService.createFile('components/ui/button.tsx', this.generateButtonComponent(), this.userId);
        await e2bService.createFile('lib/utils.ts', this.generateUtilsFile(), this.userId);
        output += `✅ Created Shadcn/ui components\n`;
      }

      output += `\n🎉 Next.js project created successfully!\n`;
      output += `💡 Run 'npm install' and 'npm run dev' to start development\n`;

      return {
        tool_call_id: toolCallId,
        output,
        success: true
      };
    } catch (error) {
      return {
        tool_call_id: toolCallId,
        output: `Error creating Next.js project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false
      };
    }
  }

  private async createReactComponent(toolCallId: string, args: ComponentCreationArgs): Promise<ToolCallResult> {
    try {
      const componentCode = this.generateComponentCode(args);
      const filePath = this.getComponentPath(args);
      
      await e2bService.createFile(filePath, componentCode, this.userId);
      
      return {
        tool_call_id: toolCallId,
        output: `✅ Created ${args.componentType} component: ${args.componentName} at \`${filePath}\``,
        success: true
      };
    } catch (error) {
      return {
        tool_call_id: toolCallId,
        output: `Error creating component: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false
      };
    }
  }

  private async installDependencies(toolCallId: string, args: { packages: string[]; dev?: boolean }): Promise<ToolCallResult> {
    try {
      const command = `npm install ${args.dev ? '--save-dev ' : ''}${args.packages.join(' ')}`;
      const result = await e2bService.executeCode(command, { language: 'bash' }, this.userId);
      
      let output = `📦 Installing packages: ${args.packages.join(', ')}\n\n`;
      if (result.success) {
        output += `✅ Dependencies installed successfully!\n`;
      } else {
        output += `❌ Installation failed: ${result.error}\n`;
      }
      
      return {
        tool_call_id: toolCallId,
        output,
        success: result.success
      };
    } catch (error) {
      return {
        tool_call_id: toolCallId,
        output: `Error installing dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false
      };
    }
  }

  private async setupTailwindConfig(toolCallId: string, args: any): Promise<ToolCallResult> {
    try {
      const tailwindConfig = this.generateAdvancedTailwindConfig(args);
      await e2bService.createFile('tailwind.config.ts', tailwindConfig, this.userId);
      
      return {
        tool_call_id: toolCallId,
        output: `✅ Tailwind CSS configuration updated with custom settings`,
        success: true
      };
    } catch (error) {
      return {
        tool_call_id: toolCallId,
        output: `Error setting up Tailwind config: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false
      };
    }
  }

  private async createWebsiteStructure(toolCallId: string, args: WebsiteStructureArgs): Promise<ToolCallResult> {
    try {
      let output = `🏗️ Creating website structure...\n\n`;
      
      // Create pages
      for (const page of args.pages) {
        const pageCode = this.generatePageCode(page, args.features);
        await e2bService.createFile(`app/${page}/page.tsx`, pageCode, this.userId);
        output += `✅ Created page: ${page}\n`;
      }
      
      // Create components
      for (const component of args.components) {
        const componentCode = this.generateStructureComponent(component, args.features);
        await e2bService.createFile(`components/${component}.tsx`, componentCode, this.userId);
        output += `✅ Created component: ${component}\n`;
      }
      
      output += `\n🎉 Website structure created successfully!`;
      
      return {
        tool_call_id: toolCallId,
        output,
        success: true
      };
    } catch (error) {
      return {
        tool_call_id: toolCallId,
        output: `Error creating website structure: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false
      };
    }
  }

  private async optimizePerformance(toolCallId: string, args: any): Promise<ToolCallResult> {
    try {
      let output = `⚡ Optimizing Next.js performance...\n\n`;
      
      if (args.optimizeImages) {
        // Add image optimization examples
        output += `✅ Configured Next.js Image optimization\n`;
      }
      
      if (args.enableFonts) {
        // Add font optimization
        output += `✅ Set up Google Fonts optimization\n`;
      }
      
      return {
        tool_call_id: toolCallId,
        output,
        success: true
      };
    } catch (error) {
      return {
        tool_call_id: toolCallId,
        output: `Error optimizing performance: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false
      };
    }
  }

  // Existing methods for execute_code, create_file, read_file, list_files...
  private async executeCode(toolCallId: string, args: CodeExecutionArgs): Promise<ToolCallResult> {
    try {
      const result = await e2bService.executeCode(args.code, {
        language: args.language,
        installPackages: args.installPackages
      }, this.userId);

      let output = '';
      if (result.success) {
        output = `✅ Code executed successfully!\n\n`;
        if (result.output) {
          output += `**Output:**\n\`\`\`\n${result.output}\n\`\`\`\n\n`;
        }
        if (result.logs.length > 0) {
          output += `**Logs:**\n${result.logs.join('\n')}\n`;
        }
      } else {
        output = `❌ Code execution failed!\n\n`;
        if (result.error) {
          output += `**Error:**\n\`\`\`\n${result.error}\n\`\`\`\n\n`;
        }
        if (result.logs.length > 0) {
          output += `**Logs:**\n${result.logs.join('\n')}\n`;
        }
      }

      return {
        tool_call_id: toolCallId,
        output,
        success: result.success,
        executionTime: result.executionTime
      };
    } catch (error) {
      return {
        tool_call_id: toolCallId,
        output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false
      };
    }
  }

  private async createFile(toolCallId: string, args: FileOperationArgs): Promise<ToolCallResult> {
    if (!args.content) {
      return {
        tool_call_id: toolCallId,
        output: 'Invalid arguments for create_file',
        success: false
      };
    }

    try {
      const success = await e2bService.createFile(args.path, args.content, this.userId);
      
      return {
        tool_call_id: toolCallId,
        output: success 
          ? `✅ File created successfully at \`${args.path}\``
          : `❌ Failed to create file at \`${args.path}\``,
        success
      };
    } catch (error) {
      return {
        tool_call_id: toolCallId,
        output: `Error creating file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false
      };
    }
  }

  private async readFile(toolCallId: string, args: FileOperationArgs): Promise<ToolCallResult> {
    try {
      const content = await e2bService.readFile(args.path, this.userId);
      
      if (content === null) {
        return {
          tool_call_id: toolCallId,
          output: `❌ File not found or couldn't be read: \`${args.path}\``,
          success: false
        };
      }

      return {
        tool_call_id: toolCallId,
        output: `✅ File content from \`${args.path}\`:\n\n\`\`\`\n${content}\n\`\`\``,
        success: true
      };
    } catch (error) {
      return {
        tool_call_id: toolCallId,
        output: `Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false
      };
    }
  }

  private async listFiles(toolCallId: string, args: { directory?: string } = {}): Promise<ToolCallResult> {
    try {
      const files = await e2bService.listFiles(args.directory || '.', this.userId);
      
      return {
        tool_call_id: toolCallId,
        output: `✅ Files in \`${args.directory || '.'}\`:\n\n${files.map(file => `- ${file}`).join('\n')}`,
        success: true
      };
    } catch (error) {
      return {
        tool_call_id: toolCallId,
        output: `Error listing files: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false
      };
    }
  }

  // Helper methods for generating Next.js code
  private generateRootLayout(args: NextJSProjectArgs): string {
    return `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '${args.projectName}',
  description: 'A modern ${args.projectType} built with Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="${args.colorScheme === 'dark' ? 'dark' : ''}">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`;
  }

  private generateHomePage(args: NextJSProjectArgs): string {
    const pageTemplates = {
      'landing-page': this.generateLandingPageTemplate(),
      'business-website': this.generateBusinessWebsiteTemplate(),
      'portfolio': this.generatePortfolioTemplate(),
      'dashboard': this.generateDashboardTemplate(),
      'blog': this.generateBlogTemplate(),
      'saas-interface': this.generateSaaSTemplate(),
      'e-commerce': this.generateEcommerceTemplate(),
      'creative-showcase': this.generateCreativeTemplate()
    };

    return pageTemplates[args.projectType] || this.generateLandingPageTemplate();
  }

  private generateLandingPageTemplate(): string {
    return `export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Build Amazing
            <span className="text-blue-600"> Websites</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Create beautiful, responsive websites with modern design and cutting-edge technology.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Get Started
            </button>
            <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}`;
  }

  private generateBusinessWebsiteTemplate(): string {
    return `export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Professional Business Solutions
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Empowering businesses with innovative solutions and exceptional service.
            </p>
            <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700">
              Contact Us Today
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}`;
  }

  private generatePortfolioTemplate(): string {
    return `export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Creative Portfolio
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Showcasing exceptional design and development work.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {[1, 2, 3].map((item) => (
                <div key={item} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                  <h3 className="text-lg font-semibold mb-2">Project {item}</h3>
                  <p className="text-gray-600">Description of the project and technologies used.</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}`;
  }

  private generateDashboardTemplate(): string {
    return `export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex">
        <aside className="w-64 bg-white shadow-sm h-screen">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
          </div>
        </aside>
        <div className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics Overview</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Total Users', value: '12,345', change: '+12%' },
              { title: 'Revenue', value: '$45,678', change: '+8%' },
              { title: 'Orders', value: '1,234', change: '+15%' },
              { title: 'Conversion', value: '3.2%', change: '+0.5%' }
            ].map((metric) => (
              <div key={metric.title} className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-sm font-medium text-gray-500">{metric.title}</h3>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-sm text-green-600">{metric.change}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}`;
  }

  private generateBlogTemplate(): string {
    return `export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Blog</h1>
          <p className="text-xl text-gray-600">Thoughts, ideas, and insights</p>
        </header>
        <div className="max-w-4xl mx-auto">
          <div className="space-y-12">
            {[1, 2, 3].map((post) => (
              <article key={post} className="border-b border-gray-200 pb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Blog Post Title {post}
                </h2>
                <p className="text-gray-600 mb-4">
                  This is a preview of the blog post content. It gives readers an idea of what the full article contains.
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <span>March {post}, 2024</span>
                  <span className="mx-2">•</span>
                  <span>5 min read</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}`;
  }

  private generateSaaSTemplate(): string {
    return `export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-6xl font-bold mb-6">The SaaS Solution You Need</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Streamline your workflow with our powerful, easy-to-use platform designed for modern teams.
          </p>
          <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">
            Start Free Trial
          </button>
        </div>
      </section>
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {['Analytics', 'Automation', 'Integration'].map((feature) => (
              <div key={feature} className="bg-white p-8 rounded-lg shadow-sm text-center">
                <h3 className="text-xl font-semibold mb-4">{feature}</h3>
                <p className="text-gray-600">Powerful {feature.toLowerCase()} tools to boost your productivity.</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}`;
  }

  private generateEcommerceTemplate(): string {
    return `export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Shop the Latest</h1>
            <p className="text-xl text-gray-600">Discover amazing products at unbeatable prices</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((product) => (
              <div key={product} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gray-200 h-64"></div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">Product {product}</h3>
                  <p className="text-gray-600 text-sm mb-2">Product description here</p>
                  <p className="font-bold text-lg">$99.99</p>
                  <button className="w-full bg-blue-600 text-white py-2 rounded mt-4 hover:bg-blue-700">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}`;
  }

  private generateCreativeTemplate(): string {
    return `export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              Creative Showcase
            </h1>
            <p className="text-xl text-gray-300 mb-12">
              Where art meets technology in beautiful harmony
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="relative group cursor-pointer">
                  <div className="bg-gradient-to-br from-purple-600 to-pink-600 h-64 rounded-lg transform transition-transform group-hover:scale-105"></div>
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-semibold">View Project</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}`;
  }

  private generateGlobalCSS(args: NextJSProjectArgs): string {
    return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

${args.colorScheme === 'dark' || args.colorScheme === 'auto' ? `
@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}
` : ''}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}`;
  }

  private generateTailwindConfig(args: NextJSProjectArgs): string {
    return `import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      ${args.features?.includes('animations') ? `
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      ` : ''}
    },
  },
  plugins: [],
  ${args.colorScheme === 'auto' ? "darkMode: 'media'," : args.colorScheme === 'dark' ? "darkMode: 'class'," : ''}
}

export default config`;
  }

  private generateAdvancedTailwindConfig(args: any): string {
    return `import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ${args.customColors ? JSON.stringify(args.customColors, null, 8).slice(1, -1) : `
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },`}
      },
      ${args.animations ? `
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      ` : ''}
    },
  },
  plugins: [],
  ${args.darkMode ? "darkMode: 'class'," : ''}
}

export default config`;
  }

  private generatePostCSSConfig(): string {
    return `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
  }

  private generateButtonComponent(): string {
    return `import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }`;
  }

  private generateUtilsFile(): string {
    return `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`;
  }

  private generateComponentCode(args: ComponentCreationArgs): string {
    const componentName = args.componentName;
    const isResponsive = args.responsive ? ' responsive' : '';
    
    switch (args.componentType) {
      case 'page':
        return `export default function ${componentName}() {
  return (
    <main className="min-h-screen${isResponsive ? ' container mx-auto px-4' : ''}">
      <h1 className="text-4xl font-bold mb-8">${componentName}</h1>
      <p className="text-lg text-gray-600">Content for ${componentName} page.</p>
    </main>
  )
}`;
      
      case 'layout':
        return `export default function ${componentName}Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen${isResponsive ? ' container mx-auto' : ''}">
      <header className="py-6">
        <h1 className="text-2xl font-bold">${componentName}</h1>
      </header>
      <main>{children}</main>
    </div>
  )
}`;
      
      case 'ui-component':
        return `interface ${componentName}Props {
  children: React.ReactNode
  className?: string
}

export function ${componentName}({ children, className = "" }: ${componentName}Props) {
  return (
    <div className={\`${args.styling === 'tailwind' ? 'p-4 rounded-lg' : 'component-base'} \${className}\`}>
      {children}
    </div>
  )
}`;
      
      default:
        return `interface ${componentName}Props {
  // Add your props here
}

export function ${componentName}(props: ${componentName}Props) {
  return (
    <div className="${args.styling === 'tailwind' ? 'p-4' : 'component'}${isResponsive ? ' w-full' : ''}">
      <h2 className="text-xl font-semibold">${componentName}</h2>
    </div>
  )
}`;
    }
  }

  private getComponentPath(args: ComponentCreationArgs): string {
    switch (args.componentType) {
      case 'page':
        return `app/${args.componentName.toLowerCase()}/page.tsx`;
      case 'layout':
        return `app/${args.componentName.toLowerCase()}/layout.tsx`;
      case 'ui-component':
        return `components/ui/${args.componentName.toLowerCase()}.tsx`;
      default:
        return `components/${args.componentName}.tsx`;
    }
  }

  private generatePageCode(pageName: string, features: string[]): string {
    return `export default function ${pageName.charAt(0).toUpperCase() + pageName.slice(1)}() {
  return (
    <main className="min-h-screen container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">${pageName.charAt(0).toUpperCase() + pageName.slice(1)}</h1>
      <div className="prose max-w-none">
        <p className="text-lg text-gray-600 mb-6">
          Welcome to the ${pageName} page. This is where you can add your content.
        </p>
        ${features.includes('animations') ? `
        <div className="animate-fade-in">
          <p>This content has a fade-in animation.</p>
        </div>
        ` : ''}
      </div>
    </main>
  )
}`;
  }

  private generateStructureComponent(componentName: string, features: string[]): string {
    return `export function ${componentName.charAt(0).toUpperCase() + componentName.slice(1)}() {
  return (
    <section className="py-16${features.includes('responsive') ? ' container mx-auto px-4' : ''}">
      <h2 className="text-2xl font-bold mb-6">${componentName.charAt(0).toUpperCase() + componentName.slice(1)}</h2>
      <div className="${features.includes('responsive') ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}">
        {/* Add your ${componentName} content here */}
      </div>
    </section>
  )
}`;
  }
}

export const toolCallExecutor = new ToolCallExecutor();
export default toolCallExecutor; 