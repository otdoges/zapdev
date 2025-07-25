import { FileStructure } from "@/types/webcontainer";

/**
 * Convert HTML content to a Next.js page component
 */
export const convertHtmlToNextJS = (html: string): string => {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;
  
  return `
export default function HomePage() {
  return (
    <div>
      ${bodyContent}
    </div>
  );
}`;
};

/**
 * Extract code blocks from AI-generated code string
 */
const extractCodeBlocks = (code: string) => {
  const blocks: { [key: string]: string } = {};
  
  // Extract specific files mentioned in the code
  const fileMatches = code.matchAll(/```(?:tsx?|jsx?|css|json|md)\s*(?:\/\/\s*(.+\.(?:tsx?|jsx?|css|json|md)))?[\n\r]([\s\S]*?)```/g);
  
  for (const match of fileMatches) {
    const filename = match[1] || 'component.tsx';
    const content = match[2];
    blocks[filename] = content;
  }
  
  // If no specific files found, try to detect by content
  if (Object.keys(blocks).length === 0) {
    // Check if it looks like a React component
    if (code.includes('export default') && (code.includes('function') || code.includes('const'))) {
      blocks['page.tsx'] = code;
    } else if (code.includes('<html') || code.includes('<!DOCTYPE')) {
      // Convert HTML to Next.js page
      blocks['page.tsx'] = convertHtmlToNextJS(code);
    } else {
      // Default to a simple page
      blocks['page.tsx'] = `
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Your Website
          </h1>
          <p className="text-xl text-gray-600">
            Generated by ZapDev
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-8">
          <pre className="whitespace-pre-wrap text-sm text-gray-800">
            ${code.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}
          </pre>
        </div>
      </div>
    </div>
  );
}`;
    }
  }
  
  return blocks;
};

/**
 * Generate base Next.js project configuration files
 */
const generateBaseProjectFiles = (): FileStructure => {
  return {
    'package.json': {
      file: {
        contents: JSON.stringify({
          name: "zapdev-nextjs-app",
          version: "0.1.0",
          private: true,
          scripts: {
            dev: "next dev",
            build: "next build",
            start: "next start",
            lint: "next lint"
          },
          dependencies: {
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "next": "^14.1.0",
            "@types/node": "^20.11.0",
            "@types/react": "^18.2.48",
            "@types/react-dom": "^18.2.18",
            "typescript": "^5.3.3",
            "tailwindcss": "^3.4.1",
            "autoprefixer": "^10.4.17",
            "postcss": "^8.4.35",
            "clsx": "^2.1.0",
            "lucide-react": "^0.323.0"
          }
        }, null, 2)
      }
    },
    'next.config.js': {
      file: {
        contents: `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig`
      }
    },
    'tsconfig.json': {
      file: {
        contents: JSON.stringify({
          compilerOptions: {
            target: "es5",
            lib: ["dom", "dom.iterable", "es6"],
            allowJs: true,
            skipLibCheck: true,
            strict: true,
            noEmit: true,
            esModuleInterop: true,
            module: "esnext",
            moduleResolution: "bundler",
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: "preserve",
            incremental: true,
            plugins: [
              {
                name: "next"
              }
            ],
            baseUrl: ".",
            paths: {
              "@/*": ["./src/*"]
            }
          },
          include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
          exclude: ["node_modules"]
        }, null, 2)
      }
    },
    'tailwind.config.js': {
      file: {
        contents: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`
      }
    },
    'postcss.config.js': {
      file: {
        contents: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`
      }
    }
  };
};

/**
 * Generate Next.js app directory structure
 */
const generateAppDirectory = (mainPageContent: string): FileStructure => {
  return {
    'src': {
      directory: {
        'app': {
          directory: {
            'globals.css': {
              file: {
                contents: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}`
              }
            },
            'layout.tsx': {
              file: {
                contents: `import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ZapDev App',
  description: 'Generated by ZapDev AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`
              }
            },
            'page.tsx': {
              file: {
                contents: mainPageContent || `
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to Your Next.js App
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Built with Next.js, TypeScript, and Tailwind CSS
          </p>
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl mx-auto">
            <p className="text-lg text-gray-700">
              Your application is ready! Start building amazing features.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}`
              }
            }
          }
        },
        'components': {
          directory: {
            'ui': {
              directory: {}
            }
          }
        }
      }
    }
  };
};

/**
 * Parse AI-generated code and create complete Next.js project structure
 */
export const parseCodeToNextJSProject = (codeString: string): FileStructure => {
  const codeBlocks = extractCodeBlocks(codeString);
  
  // Create base project structure
  const projectStructure: FileStructure = {
    ...generateBaseProjectFiles(),
    ...generateAppDirectory(
      codeBlocks['page.tsx'] || 
      codeBlocks['component.tsx'] || 
      Object.values(codeBlocks)[0]
    )
  };

  // Add any additional components from code blocks
  Object.entries(codeBlocks).forEach(([filename, content]) => {
    if (filename !== 'page.tsx' && filename !== 'component.tsx') {
      if (filename.includes('/')) {
        // Handle nested paths
        const pathParts = filename.split('/');
        let current = projectStructure.src.directory!;
        
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          if (!current[part]) {
            current[part] = { directory: {} };
          }
          current = current[part].directory!;
        }
        
        current[pathParts[pathParts.length - 1]] = {
          file: { contents: content }
        };
      } else {
        // Add to components directory
        projectStructure.src.directory!.components.directory![filename] = {
          file: { contents: content }
        };
      }
    }
  });

  return projectStructure;
}; 