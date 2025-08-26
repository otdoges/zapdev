import React, { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  quality?: number;
  loading?: 'lazy' | 'eager';
  placeholder?: string;
  sizes?: string;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  width,
  height,
  quality = 85,
  loading = 'lazy',
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiI+TG9hZGluZy4uLjwvdGV4dD4KPHN2Zz4=',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate optimized image formats
  const generateSrcSet = useCallback((originalSrc: string) => {
    const baseSrc = originalSrc.split('?')[0];
    const webpSrc = `${baseSrc}?format=webp&quality=${quality}`;
    const avifSrc = `${baseSrc}?format=avif&quality=${quality}`;
    
    // Generate different sizes
    const sizes = [480, 768, 1024, 1200];
    const srcSet = sizes.map(size => {
      return `${webpSrc}&w=${size} ${size}w`;
    }).join(', ');
    
    return { webpSrc, avifSrc, srcSet };
  }, [quality]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
    setIsLoading(false);
  }, []);

  const { webpSrcSet, avifSrcSet } = generateSrcSet(src);

  if (error) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-gray-100 text-gray-400 text-sm",
          className
        )}
        style={{ width, height }}
      >
        Failed to load image
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      )}
      
      <picture>
        {/* AVIF format for modern browsers */}
        <source
          srcSet={src.includes('lovable-uploads') ? src : srcSet.replace('webp', 'avif')}
          type="image/avif"
          sizes={sizes}
        />
        
        {/* WebP format */}
        <source
          srcSet={src.includes('lovable-uploads') ? src : srcSet}
          type="image/webp"
          sizes={sizes}
        />
        
        {/* Fallback to original format */}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : loading}
          decoding={priority ? 'sync' : 'async'}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
            className
          )}
          style={{
            aspectRatio: width && height ? `${width} / ${height}` : undefined,
          }}
        />
      </picture>
    </div>
  );
};

export default OptimizedImage;