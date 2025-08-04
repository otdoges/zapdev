/**
 * React component for HTML generation interface
 * Replaces complex code execution with simple HTML generation
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { HTMLGenerator, HTMLGenerationOptions } from '@/lib/htmlGenerator';
import { Download, Eye, Code } from 'lucide-react';

export function HTMLGeneratorComponent() {
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [customStyles, setCustomStyles] = useState('');
  const [customScripts, setCustomScripts] = useState('');
  const [includeTailwind, setIncludeTailwind] = useState(true);
  const [includeBootstrap, setIncludeBootstrap] = useState(false);
  const [generatedHTML, setGeneratedHTML] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const generator = new HTMLGenerator();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    
    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const options: HTMLGenerationOptions = {
        title: title || 'Generated Page',
        bodyContent: generateContentFromPrompt(prompt),
        styles: customStyles,
        scripts: customScripts,
        includeTailwind,
        includeBootstrap,
      };

      const html = generator.generateHTML(options);
      setGeneratedHTML(html);
      setShowPreview(true);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateContentFromPrompt = (prompt: string): string => {
    // Simple prompt-to-HTML conversion
    // In a real implementation, this would use AI
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('landing page') || lowerPrompt.includes('homepage')) {
      return generateLandingPageContent(prompt);
    } else if (lowerPrompt.includes('portfolio') || lowerPrompt.includes('resume')) {
      return generatePortfolioContent(prompt);
    } else if (lowerPrompt.includes('blog') || lowerPrompt.includes('article')) {
      return generateBlogContent(prompt);
    } else {
      return generateGenericContent(prompt);
    }
  };

  const generateLandingPageContent = (prompt: string): string => {
    return `
      <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <nav class="bg-white shadow-sm">
          <div class="container mx-auto px-4 py-4">
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-bold text-gray-900">Brand</h2>
              <div class="space-x-4">
                <a href="#" class="text-gray-600 hover:text-gray-900">Home</a>
                <a href="#" class="text-gray-600 hover:text-gray-900">About</a>
                <a href="#" class="text-gray-600 hover:text-gray-900">Contact</a>
              </div>
            </div>
          </div>
        </nav>
        
        <div class="container mx-auto px-4 py-16">
          <div class="text-center mb-16">
            <h1 class="text-5xl font-bold text-gray-900 mb-4">Welcome to Our Product</h1>
            <p class="text-xl text-gray-600 max-w-2xl mx-auto mb-8">Based on your prompt: "${prompt}"</p>
            <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200">
              Get Started
            </button>
          </div>
          
          <div class="grid md:grid-cols-3 gap-8">
            <div class="bg-white rounded-lg shadow-lg p-6">
              <h3 class="text-xl font-semibold mb-3">Feature 1</h3>
              <p class="text-gray-600">Amazing feature description here.</p>
            </div>
            <div class="bg-white rounded-lg shadow-lg p-6">
              <h3 class="text-xl font-semibold mb-3">Feature 2</h3>
              <p class="text-gray-600">Another great feature description.</p>
            </div>
            <div class="bg-white rounded-lg shadow-lg p-6">
              <h3 class="text-xl font-semibold mb-3">Feature 3</h3>
              <p class="text-gray-600">Yet another awesome feature.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const generatePortfolioContent = (prompt: string): string => {
    return `
      <div class="min-h-screen bg-gray-50">
        <div class="container mx-auto px-4 py-16">
          <header class="text-center mb-16">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">John Doe</h1>
            <p class="text-xl text-gray-600">Full Stack Developer</p>
            <p class="text-gray-500 mt-2">Generated from: "${prompt}"</p>
          </header>
          
          <div class="grid md:grid-cols-2 gap-12 mb-16">
            <div>
              <h2 class="text-2xl font-bold mb-4">About Me</h2>
              <p class="text-gray-600">Passionate developer with experience in modern web technologies.</p>
            </div>
            <div>
              <h2 class="text-2xl font-bold mb-4">Skills</h2>
              <div class="flex flex-wrap gap-2">
                <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">React</span>
                <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full">Node.js</span>
                <span class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">TypeScript</span>
              </div>
            </div>
          </div>
          
          <div>
            <h2 class="text-2xl font-bold mb-8">Projects</h2>
            <div class="grid md:grid-cols-2 gap-8">
              <div class="bg-white rounded-lg shadow-lg p-6">
                <h3 class="text-xl font-semibold mb-2">Project 1</h3>
                <p class="text-gray-600">Description of an amazing project.</p>
              </div>
              <div class="bg-white rounded-lg shadow-lg p-6">
                <h3 class="text-xl font-semibold mb-2">Project 2</h3>
                <p class="text-gray-600">Description of another great project.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const generateBlogContent = (prompt: string): string => {
    return `
      <div class="min-h-screen bg-white">
        <div class="container mx-auto px-4 py-16 max-w-4xl">
          <header class="mb-12">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">My Blog</h1>
            <p class="text-gray-600">Generated from: "${prompt}"</p>
          </header>
          
          <article class="mb-12">
            <h2 class="text-3xl font-bold mb-4">Sample Blog Post</h2>
            <p class="text-gray-500 mb-6">Published on ${new Date().toLocaleDateString()}</p>
            <div class="prose prose-lg max-w-none">
              <p>This is a sample blog post generated based on your prompt. In a real implementation, AI would create relevant content based on your specific requirements.</p>
              <p>The content would be tailored to your needs and include relevant information, proper formatting, and engaging writing.</p>
            </div>
          </article>
          
          <div class="border-t pt-8">
            <h3 class="text-xl font-bold mb-4">Recent Posts</h3>
            <div class="space-y-4">
              <div class="border-b pb-4">
                <h4 class="text-lg font-semibold">Another Blog Post</h4>
                <p class="text-gray-600">Brief description of another post...</p>
              </div>
              <div class="border-b pb-4">
                <h4 class="text-lg font-semibold">Yet Another Post</h4>
                <p class="text-gray-600">Brief description of yet another post...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const generateGenericContent = (prompt: string): string => {
    return `
      <div class="container mx-auto px-4 py-16">
        <div class="max-w-4xl mx-auto">
          <h1 class="text-4xl font-bold text-gray-900 mb-8">Generated Content</h1>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 class="text-xl font-semibold mb-2">Your Prompt</h2>
            <p class="text-gray-700">"${prompt}"</p>
          </div>
          <div class="bg-white rounded-lg shadow-lg p-8">
            <h2 class="text-2xl font-bold mb-4">Generated HTML Page</h2>
            <p class="text-gray-600 mb-6">This is a simple HTML page generated from your prompt. In a full AI implementation, this would be much more sophisticated and tailored to your specific needs.</p>
            <div class="grid md:grid-cols-2 gap-6">
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-semibold mb-2">Feature 1</h3>
                <p class="text-sm text-gray-600">Sample feature based on your request.</p>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-semibold mb-2">Feature 2</h3>
                <p class="text-sm text-gray-600">Another sample feature.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const handleDownload = () => {
    if (generatedHTML) {
      generator.saveHTML(generatedHTML, `${title || 'generated'}.html`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            HTML Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="prompt">Describe what you want to create</Label>
            <Textarea
              id="prompt"
              placeholder="e.g., Create a landing page for a tech startup, Make a portfolio website, Build a blog layout..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Page Title</Label>
              <Input
                id="title"
                placeholder="My Awesome Page"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="tailwind"
                  checked={includeTailwind}
                  onCheckedChange={setIncludeTailwind}
                />
                <Label htmlFor="tailwind">Tailwind CSS</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="bootstrap"
                  checked={includeBootstrap}
                  onCheckedChange={setIncludeBootstrap}
                />
                <Label htmlFor="bootstrap">Bootstrap</Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="styles">Custom CSS (optional)</Label>
            <Textarea
              id="styles"
              placeholder="body { background: #f0f0f0; }"
              value={customStyles}
              onChange={(e) => setCustomStyles(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="scripts">Custom JavaScript (optional)</Label>
            <Textarea
              id="scripts"
              placeholder="console.log('Hello World!');"
              value={customScripts}
              onChange={(e) => setCustomScripts(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full"
          >
            {isGenerating ? 'Generating...' : 'Generate HTML'}
          </Button>
        </CardContent>
      </Card>

      {generatedHTML && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Generated HTML</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {showPreview ? 'Hide' : 'Preview'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showPreview ? (
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  srcDoc={generatedHTML}
                  className="w-full h-[600px]"
                  title="HTML Preview"
                />
              </div>
            ) : (
              <div className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-[400px]">
                <pre className="text-sm">
                  <code>{generatedHTML}</code>
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}