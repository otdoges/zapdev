// Browser polyfills for cross-browser compatibility
export function initializeBrowserPolyfills() {
  // Only run in browser environment
  if (typeof window === 'undefined') return;

  // Polyfill for requestAnimationFrame
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      return window.setTimeout(callback, 1000 / 60);
    };
  }

  // Polyfill for cancelAnimationFrame
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = (id: number): void => {
      clearTimeout(id);
    };
  }

  // CSS custom properties support for older browsers
  if (typeof window.CSS === 'undefined' || !window.CSS.supports || !window.CSS.supports('--fake-var', '0')) {
    // Add a basic CSS custom properties polyfill
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --deep-violet: #6c52a0;
        --warm-pink: #a0527c;
        --charcoal: #0d0d10;
        --off-white: #eaeaea;
      }
      
      .gradient-button-primary {
        background: #6c52a0 !important;
        background: linear-gradient(135deg, #6c52a0 0%, #a0527c 100%) !important;
      }
      
      .gradient-button-secondary {
        background: #a0527c !important;
        background: linear-gradient(135deg, #a0527c 0%, #6c52a0 100%) !important;
      }
      
      .text-gradient {
        background: linear-gradient(135deg, #6c52a0 0%, #a0527c 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        color: transparent;
      }
    `;
    document.head.appendChild(style);
  }

  // Intersection Observer polyfill for older browsers
  if (!('IntersectionObserver' in window)) {
    // Simple fallback for IntersectionObserver
    (window as any).IntersectionObserver = class {
      callback: any;
      options: any;
      observed: Set<Element>;

      constructor(callback: any, options: any = {}) {
        this.callback = callback;
        this.options = options;
        this.observed = new Set();
      }
      
      observe(target: Element) {
        this.observed.add(target);
        // Trigger callback immediately for fallback
        setTimeout(() => {
          this.callback([{
            target,
            isIntersecting: true,
            intersectionRatio: 1
          }]);
        }, 100);
      }
      
      unobserve(target: Element) {
        this.observed.delete(target);
      }
      
      disconnect() {
        this.observed.clear();
      }
    };
  }

  // ResizeObserver polyfill for older browsers
  if (!('ResizeObserver' in window)) {
    (window as any).ResizeObserver = class {
      callback: any;
      observed: Set<Element>;

      constructor(callback: any) {
        this.callback = callback;
        this.observed = new Set();
      }
      
      observe(target: Element) {
        this.observed.add(target);
        // Simple fallback - trigger on window resize
        const handler = () => {
          this.callback([{
            target,
            contentRect: target.getBoundingClientRect()
          }]);
        };
        window.addEventListener('resize', handler);
        (target as any).__resizeHandler = handler;
      }
      
      unobserve(target: Element) {
        this.observed.delete(target);
        if ((target as any).__resizeHandler) {
          window.removeEventListener('resize', (target as any).__resizeHandler);
          delete (target as any).__resizeHandler;
        }
      }
      
      disconnect() {
        this.observed.forEach(target => this.unobserve(target as Element));
      }
    };
  }

  // Add smooth scrolling polyfill for older browsers
  if (!('scrollBehavior' in document.documentElement.style)) {
    const originalScrollTo = Element.prototype.scrollTo;
    if (originalScrollTo) {
      Element.prototype.scrollTo = function(options: any) {
        if (typeof options === 'object' && options.behavior === 'smooth') {
          const startTime = Date.now();
          const startTop = this.scrollTop;
          const startLeft = this.scrollLeft;
          const targetTop = options.top || 0;
          const targetLeft = options.left || 0;
          const diffTop = targetTop - startTop;
          const diffLeft = targetLeft - startLeft;
          const duration = 300;
          
          const animateScroll = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 0.5 * (1 - Math.cos(progress * Math.PI));
            
            this.scrollTop = startTop + diffTop * easeProgress;
            this.scrollLeft = startLeft + diffLeft * easeProgress;
            
            if (progress < 1) {
              requestAnimationFrame(animateScroll);
            }
          };
          
          animateScroll();
        } else {
          originalScrollTo.call(this, options);
        }
      };
    }
  }

  console.log('Browser polyfills initialized');
}

// Initialize polyfills immediately
initializeBrowserPolyfills(); 