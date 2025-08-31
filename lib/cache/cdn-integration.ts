import { createHash } from 'crypto';
import { readFileSync, existsSync, statSync, writeFileSync } from 'fs';
import { join, extname, basename } from 'path';

interface CDNConfig {
  provider: 'cloudflare' | 'fastly' | 'aws' | 'custom';
  apiKey?: string;
  apiSecret?: string;
  zoneId?: string;
  baseUrl: string;
  cacheTtl: number;
  enableCompression: boolean;
  enableBrotli: boolean;
  customHeaders: Record<string, string>;
}

interface AssetOptimizationConfig {
  images: {
    quality: number;
    formats: ('webp' | 'avif' | 'jpeg' | 'png')[];
    sizes: number[];
    lazy: boolean;
  };
  scripts: {
    minify: boolean;
    bundle: boolean;
    treeshake: boolean;
  };
  styles: {
    minify: boolean;
    purge: boolean;
    critical: boolean;
  };
}

interface CacheHeaders {
  'Cache-Control': string;
  'ETag': string;
  'Last-Modified': string;
  'Expires': string;
  'Vary'?: string;
  'Content-Encoding'?: string;
  'X-Cache-Status'?: 'HIT' | 'MISS' | 'BYPASS';
}

export class CDNManager {
  private config: CDNConfig;
  private optimizationConfig: AssetOptimizationConfig;
  private assetManifest: Map<string, {
    hash: string;
    size: number;
    mtime: Date;
    optimized: boolean;
    cdnUrl?: string;
  }> = new Map();

  constructor(
    config: CDNConfig,
    optimizationConfig?: Partial<AssetOptimizationConfig>
  ) {
    this.config = {
      ...config,
      cacheTtl: config.cacheTtl ?? 31536000,
      enableCompression: config.enableCompression ?? true,
      enableBrotli: config.enableBrotli ?? true,
      customHeaders: config.customHeaders ?? {},
    };

    this.optimizationConfig = {
      images: {
        quality: 85,
        formats: ['webp', 'jpeg'],
        sizes: [320, 640, 960, 1280, 1920],
        lazy: true,
      },
      scripts: {
        minify: true,
        bundle: true,
        treeshake: true,
      },
      styles: {
        minify: true,
        purge: true,
        critical: true,
      },
      ...optimizationConfig,
    };
  }

  // Generate optimized asset URLs
  getAssetUrl(assetPath: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
    lazy?: boolean;
  }): string {
    const asset = this.assetManifest.get(assetPath);
    
    if (asset?.cdnUrl) {
      return this.buildOptimizedUrl(asset.cdnUrl, options);
    }

    // Fallback to local asset with hash for cache busting
    const hash = asset?.hash || this.generateAssetHash(assetPath);
    const ext = extname(assetPath);
    const name = basename(assetPath, ext);
    const optimizedPath = `${name}.${hash.substring(0, 8)}${ext}`;
    
    return this.buildOptimizedUrl(`${this.config.baseUrl}/${optimizedPath}`, options);
  }

  private buildOptimizedUrl(baseUrl: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  }): string {
    if (!options) return baseUrl;

    const params = new URLSearchParams();
    
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format) params.set('f', options.format);

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  // Generate responsive image URLs
  generateResponsiveImageUrls(imagePath: string, options?: {
    quality?: number;
    formats?: string[];
  }): {
    srcSet: string;
    sources: Array<{ srcSet: string; type: string; sizes?: string }>;
    fallback: string;
  } {
    const quality = options?.quality || this.optimizationConfig.images.quality;
    const formats = options?.formats || this.optimizationConfig.images.formats;
    const sizes = this.optimizationConfig.images.sizes;

    const sources: Array<{ srcSet: string; type: string; sizes?: string }> = [];
    
    // Generate sources for each format
    for (const format of formats) {
      const srcSet = sizes
        .map(size => {
          const url = this.getAssetUrl(imagePath, { width: size, quality, format });
          return `${url} ${size}w`;
        })
        .join(', ');

      sources.push({
        srcSet,
        type: `image/${format}`,
        sizes: '(max-width: 640px) 100vw, (max-width: 960px) 75vw, 50vw',
      });
    }

    // Generate srcSet for the original format
    const srcSet = sizes
      .map(size => {
        const url = this.getAssetUrl(imagePath, { width: size, quality });
        return `${url} ${size}w`;
      })
      .join(', ');

    const fallback = this.getAssetUrl(imagePath, { width: 1280, quality });

    return { srcSet, sources, fallback };
  }

  // Cache invalidation
  async invalidateCache(paths: string | string[]): Promise<boolean> {
    const pathsArray = Array.isArray(paths) ? paths : [paths];
    
    try {
      switch (this.config.provider) {
        case 'cloudflare':
          return await this.invalidateCloudflareCache(pathsArray);
        case 'fastly':
          return await this.invalidateFastlyCache(pathsArray);
        case 'aws':
          return await this.invalidateAWSCache(pathsArray);
        default:
          console.log('Cache invalidation not implemented for custom provider');
          return true;
      }
    } catch (error) {
      console.error('Cache invalidation failed:', error);
      return false;
    }
  }

  private async invalidateCloudflareCache(paths: string[]): Promise<boolean> {
    if (!this.config.apiKey || !this.config.zoneId) {
      throw new Error('Cloudflare API key and zone ID are required');
    }

    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${this.config.zoneId}/purge_cache`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: paths.map(path => `${this.config.baseUrl}${path}`),
      }),
    });

    const result = await response.json();
    return result.success;
  }

  private async invalidateFastlyCache(paths: string[]): Promise<boolean> {
    if (!this.config.apiKey) {
      throw new Error('Fastly API key is required');
    }

    const results = await Promise.all(
      paths.map(async (path) => {
        const response = await fetch(`https://api.fastly.com/purge/${this.config.baseUrl}${path}`, {
          method: 'POST',
          headers: {
            'Fastly-Token': this.config.apiKey!,
          },
        });
        return response.ok;
      })
    );

    return results.every(result => result);
  }

  private async invalidateAWSCache(paths: string[]): Promise<boolean> {
    // AWS CloudFront invalidation would go here
    // This would require AWS SDK integration
    console.log('AWS CloudFront invalidation not implemented');
    return true;
  }

  // Generate cache headers
  generateCacheHeaders(assetPath: string, options?: {
    maxAge?: number;
    immutable?: boolean;
    private?: boolean;
    noCache?: boolean;
  }): CacheHeaders {
    const asset = this.assetManifest.get(assetPath);
    const stats = asset || this.getAssetStats(assetPath);
    
    const maxAge = options?.maxAge || this.config.cacheTtl;
    const etag = `"${stats.hash}"`;
    const lastModified = stats.mtime.toUTCString();
    const expires = new Date(Date.now() + maxAge * 1000).toUTCString();

    let cacheControl = '';
    
    if (options?.noCache) {
      cacheControl = 'no-cache, no-store, must-revalidate';
    } else if (options?.private) {
      cacheControl = `private, max-age=${maxAge}`;
    } else {
      cacheControl = `public, max-age=${maxAge}`;
      if (options?.immutable) {
        cacheControl += ', immutable';
      }
    }

    const headers: CacheHeaders = {
      'Cache-Control': cacheControl,
      'ETag': etag,
      'Last-Modified': lastModified,
      'Expires': expires,
    };

    // Add compression headers
    if (this.config.enableCompression) {
      headers['Vary'] = 'Accept-Encoding';
      
      if (this.config.enableBrotli) {
        headers['Content-Encoding'] = 'br';
      } else {
        headers['Content-Encoding'] = 'gzip';
      }
    }

    // Add custom headers
    Object.assign(headers, this.config.customHeaders);

    return headers;
  }

  // Asset optimization
  async optimizeAsset(assetPath: string): Promise<{
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
    formats: string[];
  }> {
    if (!existsSync(assetPath)) {
      throw new Error(`Asset not found: ${assetPath}`);
    }

    const ext = extname(assetPath).toLowerCase();
    const originalStats = statSync(assetPath);
    const originalSize = originalStats.size;

    let optimizedSize = originalSize;
    const formats: string[] = [];

    // Image optimization
    if (['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) {
      const result = await this.optimizeImage(assetPath);
      optimizedSize = result.size;
      formats.push(...result.formats);
    }
    
    // Script optimization
    else if (['.js', '.mjs'].includes(ext)) {
      const result = await this.optimizeScript(assetPath);
      optimizedSize = result.size;
      formats.push(result.format);
    }
    
    // Style optimization
    else if (['.css'].includes(ext)) {
      const result = await this.optimizeStyle(assetPath);
      optimizedSize = result.size;
      formats.push(result.format);
    }

    const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;

    // Update asset manifest
    this.assetManifest.set(assetPath, {
      hash: this.generateAssetHash(assetPath),
      size: optimizedSize,
      mtime: originalStats.mtime,
      optimized: true,
      cdnUrl: this.getAssetUrl(assetPath),
    });

    return {
      originalSize,
      optimizedSize,
      compressionRatio: Math.round(compressionRatio * 100) / 100,
      formats,
    };
  }

  private async optimizeImage(imagePath: string): Promise<{ size: number; formats: string[] }> {
    // This would integrate with image optimization libraries like sharp
    // For now, return mock data
    const stats = statSync(imagePath);
    return {
      size: Math.round(stats.size * 0.7), // Assume 30% compression
      formats: this.optimizationConfig.images.formats,
    };
  }

  private async optimizeScript(scriptPath: string): Promise<{ size: number; format: string }> {
    // This would integrate with bundlers like esbuild or webpack
    const stats = statSync(scriptPath);
    return {
      size: Math.round(stats.size * 0.6), // Assume 40% compression
      format: 'js',
    };
  }

  private async optimizeStyle(stylePath: string): Promise<{ size: number; format: string }> {
    // This would integrate with CSS optimization tools
    const stats = statSync(stylePath);
    return {
      size: Math.round(stats.size * 0.5), // Assume 50% compression
      format: 'css',
    };
  }

  // Preload critical assets
  generatePreloadLinks(criticalAssets: string[]): string[] {
    const preloadLinks: string[] = [];

    for (const assetPath of criticalAssets) {
      const url = this.getAssetUrl(assetPath);
      const ext = extname(assetPath).toLowerCase();
      
      let as = 'fetch';
      let type = '';
      
      if (['.css'].includes(ext)) {
        as = 'style';
      } else if (['.js', '.mjs'].includes(ext)) {
        as = 'script';
      } else if (['.woff2', '.woff'].includes(ext)) {
        as = 'font';
        type = `type="font/${ext.substring(1)}"`;
      } else if (['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) {
        as = 'image';
      }

      const crossorigin = as === 'font' ? 'crossorigin' : '';
      preloadLinks.push(`<link rel="preload" href="${url}" as="${as}" ${type} ${crossorigin}>`);
    }

    return preloadLinks;
  }

  // Utility methods
  private generateAssetHash(assetPath: string): string {
    try {
      const content = readFileSync(assetPath);
      return createHash('sha256').update(content).digest('hex');
    } catch (error) {
      // Fallback to path-based hash
      return createHash('sha256').update(assetPath).digest('hex');
    }
  }

  private getAssetStats(assetPath: string) {
    if (existsSync(assetPath)) {
      const stats = statSync(assetPath);
      return {
        hash: this.generateAssetHash(assetPath),
        size: stats.size,
        mtime: stats.mtime,
        optimized: false,
      };
    }
    
    return {
      hash: this.generateAssetHash(assetPath),
      size: 0,
      mtime: new Date(),
      optimized: false,
    };
  }

  // Asset manifest management
  loadAssetManifest(manifestPath: string): void {
    try {
      if (existsSync(manifestPath)) {
        const manifestData = JSON.parse(readFileSync(manifestPath, 'utf-8'));
        this.assetManifest = new Map(Object.entries(manifestData));
        console.log(`Loaded asset manifest with ${this.assetManifest.size} entries`);
      }
    } catch (error) {
      console.error('Failed to load asset manifest:', error);
    }
  }

  saveAssetManifest(manifestPath: string): void {
    try {
      const manifestData = Object.fromEntries(this.assetManifest.entries());
      writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2));
      console.log(`Saved asset manifest with ${this.assetManifest.size} entries`);
    } catch (error) {
      console.error('Failed to save asset manifest:', error);
    }
  }

  getAssetManifest(): Map<string, any> {
    return new Map(this.assetManifest);
  }

  // Health check
  async healthCheck(): Promise<{
    healthy: boolean;
    cdnReachable: boolean;
    assetsOptimized: number;
    totalAssets: number;
  }> {
    let cdnReachable = false;
    
    try {
      const response = await fetch(this.config.baseUrl, { method: 'HEAD' });
      cdnReachable = response.ok;
    } catch (error) {
      console.error('CDN health check failed:', error);
    }

    const assetsOptimized = Array.from(this.assetManifest.values())
      .filter(asset => asset.optimized).length;

    return {
      healthy: cdnReachable,
      cdnReachable,
      assetsOptimized,
      totalAssets: this.assetManifest.size,
    };
  }
}

// Global CDN manager instance
let globalCDNManager: CDNManager | undefined;

export function getCDNManager(config?: Partial<CDNConfig>, optimizationConfig?: Partial<AssetOptimizationConfig>): CDNManager {
  if (!globalCDNManager && config) {
    globalCDNManager = new CDNManager(config as CDNConfig, optimizationConfig);
  }
  return globalCDNManager!;
}

// Helper functions for Next.js integration
export function createCDNImageLoader(cdnManager: CDNManager) {
  return ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
    return cdnManager.getAssetUrl(src, { width, quality });
  };
}

export function createCDNHeaders() {
  return function(req: any, res: any, next: any) {
    const cdnManager = getCDNManager();
    
    if (cdnManager && req.url) {
      const headers = cdnManager.generateCacheHeaders(req.url);
      
      // Set cache headers
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }
    
    next();
  };
}