import { useEffect } from 'react';

// Critical CSS for above-the-fold content to reduce render delay
const criticalCSS = `
  .hero-section {
    font-display: swap;
  }
  
  /* Preload critical fonts */
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url('/fonts/inter-v12-latin-regular.woff2') format('woff2');
  }
  
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 600;
    font-display: swap;
    src: url('/fonts/inter-v12-latin-600.woff2') format('woff2');
  }
  
  /* Critical layout styles */
  .critical-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  .critical-nav {
    position: sticky;
    top: 0;
    z-index: 50;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    background-color: rgba(255, 255, 255, 0.8);
  }
  
  /* Optimize animations for better performance */
  .optimized-transition {
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
  }
  
  .optimized-transition:hover {
    transform: translateY(-2px);
  }
  
  /* Reduce layout shift */
  .skeleton-loader {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }
  
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  /* Improve text rendering */
  body {
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  /* Reduce paint complexity */
  .gpu-accelerated {
    transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000px;
  }
  
  /* Optimize images */
  img {
    content-visibility: auto;
    contain-intrinsic-size: 200px 200px;
  }
`;

export const CriticalCSS: React.FC = () => {
  useEffect(() => {
    // Inject critical CSS
    const style = document.createElement('style');
    style.textContent = criticalCSS;
    style.id = 'critical-css';
    document.head.insertBefore(style, document.head.firstChild);

    // Preload critical resources
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.href = '/fonts/inter-v12-latin-regular.woff2';
    preloadLink.as = 'font';
    preloadLink.type = 'font/woff2';
    preloadLink.crossOrigin = 'anonymous';
    document.head.appendChild(preloadLink);

    // Cleanup on unmount
    return () => {
      const existingStyle = document.getElementById('critical-css');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return null;
};

export default CriticalCSS;