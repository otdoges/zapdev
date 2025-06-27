import { BaseProjectTemplate, ProjectSetupOptions, ProjectTemplateConfig } from './base-template';
import { FileSystemTree } from '../webcontainer/file-manager';

export class ReactProjectTemplate extends BaseProjectTemplate {
  constructor() {
    super({
      name: 'React App',
      type: 'react',
      description: 'Modern React application with Vite, TypeScript, and Tailwind CSS',
      version: '1.0.0',
    });
  }

  detectProjectType(codeContent: string): boolean {
    return codeContent.includes('import React') || 
           codeContent.includes('from "react"') || 
           codeContent.includes('from \'react\'') ||
           codeContent.includes('useState') ||
           codeContent.includes('useEffect');
  }

  getDefaultDependencies(): string[] {
    return ['react', 'react-dom'];
  }

  getDefaultDevDependencies(): string[] {
    return [
      'vite',
      '@vitejs/plugin-react',
      '@types/react',
      '@types/react-dom',
      'typescript',
      'tailwindcss',
      'autoprefixer',
      'postcss',
    ];
  }

  getDefaultScripts(): Record<string, string> {
    return {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
      lint: 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0',
    };
  }

  async generateFiles(options: ProjectSetupOptions): Promise<FileSystemTree> {
    const { codeContent = '', instructions = '' } = options;
    
    const analysis = this.analyzeInstructions(instructions);
    
    const appContent = codeContent || this.generateAppComponent(analysis);
    
    return {
      'package.json': {
        file: { contents: this.createPackageJson() },
      },
      'vite.config.ts': {
        file: { contents: this.generateViteConfig() },
      },
      'index.html': {
        file: { contents: this.generateIndexHTML() },
      },
      'tsconfig.json': {
        file: { contents: this.generateTSConfig() },
      },
      'tsconfig.node.json': {
        file: { contents: this.generateTSNodeConfig() },
      },
      'tailwind.config.js': {
        file: { contents: this.generateTailwindConfig() },
      },
      'postcss.config.js': {
        file: { contents: this.generatePostCSSConfig() },
      },
      src: {
        directory: {
          'main.tsx': {
            file: { contents: this.generateMainTSX() },
          },
          'App.tsx': {
            file: { contents: appContent },
          },
          'index.css': {
            file: { contents: this.generateGlobalCSS() },
          },
          'App.css': {
            file: { contents: this.generateAppCSS() },
          },
          'vite-env.d.ts': {
            file: { contents: this.generateViteEnvTypes() },
          },
          components: {
            directory: {
              'Hero.tsx': {
                file: { contents: this.generateHeroComponent(analysis) },
              },
              'Features.tsx': {
                file: { contents: this.generateFeaturesComponent() },
              },
              ...(analysis.hasForm ? {
                'ContactForm.tsx': {
                  file: { contents: this.generateContactFormComponent() },
                },
              } : {}),
              ...(analysis.hasList ? {
                'DataList.tsx': {
                  file: { contents: this.generateDataListComponent() },
                },
              } : {}),
            },
          },
          hooks: {
            directory: {
              'useLocalStorage.ts': {
                file: { contents: this.generateUseLocalStorageHook() },
              },
            },
          },
          utils: {
            directory: {
              'cn.ts': {
                file: { contents: this.generateCNUtil() },
              },
            },
          },
        },
      },
      'README.md': {
        file: { contents: this.generateReadme() },
      },
    };
  }

  private generateViteConfig(): string {
    return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    strictPort: false
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})`;
  }

  private generateIndexHTML(): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
    <link rel="icon" type="image/svg+xml" href="/react.svg" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
  }

  private generateTSConfig(): string {
    return `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`;
  }

  private generateTSNodeConfig(): string {
    return `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}`;
  }

  private generateTailwindConfig(): string {
    return `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
}`;
  }

  private generatePostCSSConfig(): string {
    return `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
  }

  private generateMainTSX(): string {
    return `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;
  }

  private generateAppComponent(analysis: ReturnType<typeof this.analyzeInstructions>): string {
    return `import React from 'react'
import './App.css'
import Hero from './components/Hero'
import Features from './components/Features'
${analysis.hasForm ? "import ContactForm from './components/ContactForm'" : ''}
${analysis.hasList ? "import DataList from './components/DataList'" : ''}

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            ⚛️ React App
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Built with React, TypeScript, Vite, and Tailwind CSS
          </p>
        </header>

        {/* Main Content */}
        <main className="space-y-16">
          <Hero />
          <Features />
          ${analysis.hasForm ? '<ContactForm />' : ''}
          ${analysis.hasList ? '<DataList />' : ''}
        </main>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-600">
          <p>&copy; 2024 React App. Built with modern web technologies.</p>
        </footer>
      </div>
    </div>
  )
}

export default App`;
  }

  private generateGlobalCSS(): string {
    return `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: 'Inter', system-ui, sans-serif;
  }
}

@layer components {
  .btn {
    @apply inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200;
  }
  
  .btn-primary {
    @apply bg-primary-600 text-white hover:bg-primary-700 focus:ring-4 focus:ring-primary-200;
  }
  
  .btn-secondary {
    @apply bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-4 focus:ring-gray-100;
  }
  
  .card {
    @apply bg-white rounded-xl shadow-lg border border-gray-100 p-6;
  }
  
  .input {
    @apply w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  }
}`;
  }

  private generateAppCSS(): string {
    return `/* Custom component styles */
.hero-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.feature-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}`;
  }

  private generateViteEnvTypes(): string {
    return `/// <reference types="vite/client" />`;
  }

  private generateHeroComponent(analysis: ReturnType<typeof this.analyzeInstructions>): string {
    return `import React from 'react'

const Hero: React.FC = () => {
  return (
    <section className="hero-gradient rounded-2xl text-white p-12 text-center">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-bold mb-6">
          Welcome to Your React App
        </h2>
        <p className="text-xl md:text-2xl mb-8 opacity-90">
          A modern, fast, and beautiful application built with the latest web technologies
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <button className="btn btn-primary bg-white text-primary-600 hover:bg-gray-100">
            <span>🚀</span>
            Get Started
          </button>
          <button className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600">
            <span>📖</span>
            Learn More
          </button>
        </div>
      </div>
    </section>
  )
}

export default Hero`;
  }

  private generateFeaturesComponent(): string {
    return `import React from 'react'

const Features: React.FC = () => {
  const features = [
    {
      icon: '⚡',
      title: 'Fast & Modern',
      description: 'Built with Vite for lightning-fast development and optimized builds',
    },
    {
      icon: '🎨',
      title: 'Beautiful Design',
      description: 'Styled with Tailwind CSS for a modern and responsive interface',
    },
    {
      icon: '🔧',
      title: 'TypeScript Ready',
      description: 'Full TypeScript support for better developer experience',
    },
    {
      icon: '📱',
      title: 'Responsive',
      description: 'Mobile-first design that works perfectly on all devices',
    },
    {
      icon: '🧩',
      title: 'Component Based',
      description: 'Modular React components for easy maintenance and scaling',
    },
    {
      icon: '🚀',
      title: 'Production Ready',
      description: 'Optimized build process and best practices included',
    },
  ]

  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Features
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Everything you need to build modern web applications
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className="card feature-card animate-fade-in text-center"
            style={{ animationDelay: \`\${index * 0.1}s\` }}
          >
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {feature.title}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Features`;
  }

  private generateContactFormComponent(): string {
    return `import React, { useState } from 'react'

interface FormData {
  name: string
  email: string
  message: string
}

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    alert(\`Thank you \${formData.name}! Your message has been received.\`)
    setFormData({ name: '', email: '', message: '' })
    setIsSubmitting(false)
  }

  return (
    <section className="py-16">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Contact Us
          </h2>
          <p className="text-lg text-gray-600">
            Get in touch with our team
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="card space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input"
              placeholder="Your full name"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input"
              placeholder="your.email@example.com"
            />
          </div>
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={5}
              className="input resize-none"
              placeholder="Tell us about your project..."
            />
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Sending...
              </>
            ) : (
              <>
                <span>📧</span>
                Send Message
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  )
}

export default ContactForm`;
  }

  private generateDataListComponent(): string {
    return `import React, { useState, useEffect } from 'react'

interface DataItem {
  id: number
  title: string
  description: string
  status: 'active' | 'inactive' | 'pending'
  createdAt: string
}

const DataList: React.FC = () => {
  const [data, setData] = useState<DataItem[]>([])
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all')

  useEffect(() => {
    // Simulate API call
    const mockData: DataItem[] = [
      {
        id: 1,
        title: 'Project Alpha',
        description: 'A revolutionary new application with cutting-edge features',
        status: 'active',
        createdAt: '2024-01-15',
      },
      {
        id: 2,
        title: 'Project Beta',
        description: 'Enhanced user experience with modern design principles',
        status: 'pending',
        createdAt: '2024-01-14',
      },
      {
        id: 3,
        title: 'Project Gamma',
        description: 'Performance optimization and scalability improvements',
        status: 'inactive',
        createdAt: '2024-01-13',
      },
      {
        id: 4,
        title: 'Project Delta',
        description: 'Advanced analytics and reporting capabilities',
        status: 'active',
        createdAt: '2024-01-12',
      },
    ]
    
    setData(mockData)
  }, [])

  const filteredData = filter === 'all' 
    ? data 
    : data.filter(item => item.status === filter)

  const getStatusColor = (status: DataItem['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Data Management
        </h2>
        <p className="text-lg text-gray-600">
          Manage and filter your project data
        </p>
      </div>
      
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {(['all', 'active', 'inactive', 'pending'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={\`btn \${filter === status ? 'btn-primary' : 'btn-secondary'}\`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status !== 'all' && (
              <span className="ml-1 text-xs bg-white bg-opacity-30 px-2 py-1 rounded-full">
                {data.filter(item => item.status === status).length}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Data List */}
      <div className="grid gap-6 max-w-4xl mx-auto">
        {filteredData.map((item, index) => (
          <div
            key={item.id}
            className="card animate-fade-in hover:shadow-xl transition-shadow"
            style={{ animationDelay: \`\${index * 0.1}s\` }}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {item.title}
              </h3>
              <span className={\`px-3 py-1 rounded-full text-sm font-medium \${getStatusColor(item.status)}\`}>
                {item.status}
              </span>
            </div>
            <p className="text-gray-600 mb-4 leading-relaxed">
              {item.description}
            </p>
            <div className="text-sm text-gray-500">
              Created: {new Date(item.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
        
        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No items found for the selected filter.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default DataList`;
  }

  private generateUseLocalStorageHook(): string {
    return `import { useState, useEffect } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Get value from localStorage or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(\`Error reading localStorage key "\${key}":\`, error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(\`Error setting localStorage key "\${key}":\`, error)
    }
  }

  return [storedValue, setValue]
}`;
  }

  private generateCNUtil(): string {
    return `import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`;
  }

  private generateReadme(): string {
    return `# React App

A modern React application built with Vite, TypeScript, and Tailwind CSS.

## Features

- ⚡ **Vite** - Fast build tool and development server
- ⚛️ **React 18** - Latest React with concurrent features
- 🏷️ **TypeScript** - Type safety and better developer experience
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 📱 **Responsive Design** - Mobile-first approach
- 🧩 **Component Based** - Modular and reusable components
- 🔧 **Development Tools** - ESLint, Prettier, and more

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

3. Open your browser and visit \`http://localhost:3000\`

## Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run preview\` - Preview production build
- \`npm run lint\` - Run ESLint

## Project Structure

\`\`\`
src/
├── components/     # Reusable UI components
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
├── App.tsx        # Main app component
├── main.tsx       # Application entry point
└── index.css      # Global styles
\`\`\`

## Customization

- Modify \`tailwind.config.js\` to customize your design system
- Add new components in the \`src/components/\` directory
- Create custom hooks in \`src/hooks/\` for reusable logic
- Update \`src/App.tsx\` to modify the main application structure

## Building for Production

\`\`\`bash
npm run build
\`\`\`

The build artifacts will be stored in the \`dist/\` directory.

## License

MIT License
`;
  }
}