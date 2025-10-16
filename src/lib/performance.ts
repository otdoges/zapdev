import crypto from 'crypto';

export const imageLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
  if (src.startsWith('http')) {
    return src;
  }
  return `${src}?w=${width}&q=${quality || 75}`;
};

export const preloadCriticalAssets = () => {
  if (typeof window === 'undefined') return;

  const preloadLink = (href: string, as: string, type?: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    document.head.appendChild(link);
  };

  preloadLink('/logo.svg', 'image', 'image/svg+xml');
};

export const reportWebVitals = (metric: {
  name: string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  id: string;
  navigationType: string;
}) => {
  if (process.env.NODE_ENV === 'production') {
    const body = JSON.stringify(metric);
    const url = '/api/vitals';

    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, body);
    } else {
      fetch(url, {
        body,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      });
    }
  }
};

export const optimizeBundle = {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      default: false,
      vendors: false,
      framework: {
        name: 'framework',
        chunks: 'all',
        test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
        priority: 40,
        enforce: true,
      },
      lib: {
        test(module: { size: () => number; identifier: () => string }) {
          return module.size() > 160000 && /node_modules[/\\]/.test(module.identifier());
        },
        name(module: { identifier: () => string }) {
          const hash = crypto.createHash('sha1');
          hash.update(module.identifier());
          return hash.digest('hex').substring(0, 8);
        },
        priority: 30,
        minChunks: 1,
        reuseExistingChunk: true,
      },
      commons: {
        name: 'commons',
        chunks: 'all',
        minChunks: 2,
        priority: 20,
      },
      shared: {
        name: false,
        priority: 10,
        minChunks: 2,
        reuseExistingChunk: true,
      },
    },
  },
};

export const lazyLoadConfig = {
  rootMargin: '50px 0px',
  threshold: 0.01,
};

export const prefetchConfig = {
  reFetchOnMount: false,
  reFetchOnWindowFocus: false,
  reFetchOnReconnect: false,
};
