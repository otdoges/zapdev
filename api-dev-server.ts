import { createServer, IncomingMessage, ServerResponse } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readdirSync } from 'fs';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3000;

// Mock VercelRequest for local development
class MockVercelRequest implements VercelRequest {
  url: string;
  method: string;
  headers: IncomingMessage['headers'];
  body: any;
  query: { [key: string]: string | string[] };
  cookies: { [key: string]: string };

  constructor(req: IncomingMessage, body: string) {
    this.url = req.url || '';
    this.method = req.method || 'GET';
    this.headers = req.headers;
    this.cookies = {};
    
    // Parse URL and query
    const url = new URL(this.url, `http://localhost:${PORT}`);
    this.query = Object.fromEntries(url.searchParams.entries());
    
    // Try to parse JSON body
    this.body = body;
    if (body && body.trim().startsWith('{')) {
      try {
        this.body = JSON.parse(body);
      } catch (e) {
        // Keep as string if not valid JSON
      }
    }
  }
}

// Mock VercelResponse for local development
class MockVercelResponse implements VercelResponse {
  private res: ServerResponse;
  private statusCode: number = 200;
  private headers: { [key: string]: string } = {};
  
  constructor(res: ServerResponse) {
    this.res = res;
  }
  
  setHeader(name: string, value: string | number | readonly string[]): this {
    this.headers[name] = String(value);
    this.res.setHeader(name, value);
    return this;
  }
  
  status(code: number): this {
    this.statusCode = code;
    return this;
  }
  
  json(data: any): void {
    this.setHeader('Content-Type', 'application/json');
    this.res.writeHead(this.statusCode, this.headers);
    this.res.end(JSON.stringify(data));
  }
  
  send(data: any): void {
    this.res.writeHead(this.statusCode, this.headers);
    this.res.end(data);
  }
  
  end(): void {
    this.res.writeHead(this.statusCode, this.headers);
    this.res.end();
  }
  
  redirect(statusOrUrl: string | number, url?: string): void {
    if (typeof statusOrUrl === 'number') {
      this.statusCode = statusOrUrl;
      this.setHeader('Location', url || '');
    } else {
      this.statusCode = 302;
      this.setHeader('Location', statusOrUrl);
    }
    this.end();
  }
  
  revalidate(): Promise<void> {
    return Promise.resolve();
  }
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  const url = new URL(req.url || '', `http://localhost:${PORT}`);
  
  // Only handle /api/* routes
  if (!url.pathname.startsWith('/api/')) {
    res.writeHead(404);
    res.end('Not Found - This server only handles /api/* routes');
    return;
  }
  
  // Extract endpoint name
  const endpoint = url.pathname.replace('/api/', '');
  const apiFilePath = join(__dirname, 'api', `${endpoint}.ts`);
  
  if (!existsSync(apiFilePath)) {
    console.log(`API endpoint not found: ${endpoint} (${apiFilePath})`);
    res.writeHead(404);
    res.end(JSON.stringify({ error: `API endpoint not found: ${endpoint}` }));
    return;
  }
  
  // Read request body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', async () => {
    try {
      // Create mock Vercel request/response objects
      const mockReq = new MockVercelRequest(req, body);
      const mockRes = new MockVercelResponse(res);
      
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      
      // Import and execute the API handler
      // Add timestamp to avoid module caching for development
      const moduleUrl = `file://${apiFilePath}?t=${Date.now()}`;
      const module = await import(moduleUrl);
      const handler = module.default;
      
      if (typeof handler === 'function') {
        await handler(mockReq, mockRes);
      } else {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Invalid API handler export' }));
      }
    } catch (error: any) {
      console.error(`Error handling ${endpoint}:`, error);
      res.writeHead(500);
      res.end(JSON.stringify({ 
        error: 'Internal Server Error'
      }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 API dev server running on http://localhost:${PORT}`);
  console.log('\\nAvailable endpoints:');
  
  // List available API endpoints
  const apiDir = join(__dirname, 'api');
  if (existsSync(apiDir)) {
    const files = readdirSync(apiDir);
    files.forEach(file => {
      if (file.endsWith('.ts') && !file.startsWith('_')) {
        const endpoint = file.replace('.ts', '');
        console.log(`  • /api/${endpoint}`);
      }
    });
  }
  
  console.log('\\n✨ Ready to handle API requests!');
});