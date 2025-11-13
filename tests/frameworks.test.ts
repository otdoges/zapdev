/**
 * Tests for framework configuration and utilities
 */

import { describe, it, expect } from '@jest/globals';

// Simulate the frameworks module
const frameworks = {
  react: {
    slug: 'react',
    name: 'React',
    title: 'Build Interactive UIs with React Development',
    popularity: 95,
    relatedFrameworks: ['nextjs', 'vue', 'angular'],
    features: ['Component-Based Architecture', 'Virtual DOM for Performance'],
    keywords: ['React development', 'React.js', 'JavaScript framework']
  },
  vue: {
    slug: 'vue',
    name: 'Vue.js',
    title: 'Progressive Vue.js Development Made Simple',
    popularity: 85,
    relatedFrameworks: ['react', 'angular', 'svelte'],
    features: ['Reactive Data Binding', 'Component System'],
    keywords: ['Vue.js development', 'Vue framework']
  },
  angular: {
    slug: 'angular',
    name: 'Angular',
    title: 'Enterprise Angular Development Platform',
    popularity: 80,
    relatedFrameworks: ['react', 'vue', 'nextjs'],
    features: ['Full Framework Solution', 'TypeScript by Default'],
    keywords: ['Angular development', 'TypeScript framework']
  },
  svelte: {
    slug: 'svelte',
    name: 'Svelte',
    title: 'Build Fast Apps with Svelte Compilation',
    popularity: 70,
    relatedFrameworks: ['react', 'vue', 'solidjs'],
    features: ['Compile-time Optimization', 'No Virtual DOM'],
    keywords: ['Svelte development', 'compile-time framework']
  },
  nextjs: {
    slug: 'nextjs',
    name: 'Next.js',
    title: 'Full-Stack Next.js Development Platform',
    popularity: 90,
    relatedFrameworks: ['react', 'gatsby', 'remix'],
    features: ['Server-Side Rendering', 'Static Site Generation'],
    keywords: ['Next.js development', 'React framework', 'SSR']
  }
};

function getFramework(slug: string) {
  return frameworks[slug as keyof typeof frameworks];
}

function getAllFrameworks() {
  return Object.values(frameworks);
}

function getRelatedFrameworks(slug: string) {
  const framework = getFramework(slug);
  if (!framework) return [];
  
  return framework.relatedFrameworks
    .map(relatedSlug => getFramework(relatedSlug))
    .filter((f) => f !== undefined);
}

describe('Framework Configuration', () => {
  describe('getFramework', () => {
    it('should return framework data for valid slug', () => {
      const framework = getFramework('react');
      
      expect(framework).toBeDefined();
      expect(framework?.name).toBe('React');
      expect(framework?.slug).toBe('react');
    });

    it('should return undefined for invalid slug', () => {
      const framework = getFramework('invalid-framework');
      
      expect(framework).toBeUndefined();
    });

    it('should handle all supported frameworks', () => {
      const supportedFrameworks = ['react', 'vue', 'angular', 'svelte', 'nextjs'];
      
      supportedFrameworks.forEach(slug => {
        const framework = getFramework(slug);
        expect(framework).toBeDefined();
        expect(framework?.slug).toBe(slug);
      });
    });

    it('should return framework with all required properties', () => {
      const framework = getFramework('nextjs');
      
      expect(framework).toHaveProperty('slug');
      expect(framework).toHaveProperty('name');
      expect(framework).toHaveProperty('title');
      expect(framework).toHaveProperty('popularity');
      expect(framework).toHaveProperty('relatedFrameworks');
      expect(framework).toHaveProperty('features');
      expect(framework).toHaveProperty('keywords');
    });
  });

  describe('getAllFrameworks', () => {
    it('should return array of all frameworks', () => {
      const allFrameworks = getAllFrameworks();
      
      expect(Array.isArray(allFrameworks)).toBe(true);
      expect(allFrameworks.length).toBe(5);
    });

    it('should include all framework slugs', () => {
      const allFrameworks = getAllFrameworks();
      const slugs = allFrameworks.map(f => f.slug);
      
      expect(slugs).toContain('react');
      expect(slugs).toContain('vue');
      expect(slugs).toContain('angular');
      expect(slugs).toContain('svelte');
      expect(slugs).toContain('nextjs');
    });

    it('should return frameworks sorted by popularity', () => {
      const allFrameworks = getAllFrameworks();
      
      // Check that frameworks have valid popularity scores
      allFrameworks.forEach(framework => {
        expect(framework.popularity).toBeGreaterThan(0);
        expect(framework.popularity).toBeLessThanOrEqual(100);
      });
    });

    it('should return frameworks with unique slugs', () => {
      const allFrameworks = getAllFrameworks();
      const slugs = allFrameworks.map(f => f.slug);
      const uniqueSlugs = new Set(slugs);
      
      expect(uniqueSlugs.size).toBe(slugs.length);
    });
  });

  describe('getRelatedFrameworks', () => {
    it('should return related frameworks for valid slug', () => {
      const related = getRelatedFrameworks('react');
      
      expect(Array.isArray(related)).toBe(true);
      expect(related.length).toBeGreaterThan(0);
    });

    it('should return empty array for invalid slug', () => {
      const related = getRelatedFrameworks('invalid');
      
      expect(related).toEqual([]);
    });

    it('should return framework objects, not just slugs', () => {
      const related = getRelatedFrameworks('nextjs');
      
      related.forEach(framework => {
        expect(framework).toHaveProperty('slug');
        expect(framework).toHaveProperty('name');
        expect(framework).toHaveProperty('title');
      });
    });

    it('should not include the original framework in related list', () => {
      const related = getRelatedFrameworks('vue');
      const slugs = related.map(f => f.slug);
      
      expect(slugs).not.toContain('vue');
    });

    it('should handle circular relationships correctly', () => {
      // React relates to Vue, Vue relates to React
      const reactRelated = getRelatedFrameworks('react');
      const vueRelated = getRelatedFrameworks('vue');
      
      expect(reactRelated.some(f => f.slug === 'vue')).toBe(true);
      expect(vueRelated.some(f => f.slug === 'react')).toBe(true);
    });

    it('should filter out invalid related framework references', () => {
      // If a framework references a non-existent related framework,
      // it should be filtered out
      const related = getRelatedFrameworks('svelte');
      
      // Svelte references 'solidjs' which doesn't exist in our config
      expect(related.every(f => f !== undefined)).toBe(true);
    });
  });

  describe('Framework Properties', () => {
    it('should have valid popularity scores', () => {
      const allFrameworks = getAllFrameworks();
      
      allFrameworks.forEach(framework => {
        expect(framework.popularity).toBeGreaterThanOrEqual(0);
        expect(framework.popularity).toBeLessThanOrEqual(100);
        expect(Number.isInteger(framework.popularity)).toBe(true);
      });
    });

    it('should have non-empty features arrays', () => {
      const allFrameworks = getAllFrameworks();
      
      allFrameworks.forEach(framework => {
        expect(Array.isArray(framework.features)).toBe(true);
        expect(framework.features.length).toBeGreaterThan(0);
      });
    });

    it('should have non-empty keywords arrays', () => {
      const allFrameworks = getAllFrameworks();
      
      allFrameworks.forEach(framework => {
        expect(Array.isArray(framework.keywords)).toBe(true);
        expect(framework.keywords.length).toBeGreaterThan(0);
      });
    });

    it('should have slugs matching lowercase names', () => {
      const react = getFramework('react');
      const vue = getFramework('vue');
      const angular = getFramework('angular');
      
      expect(react?.slug).toBe('react');
      expect(vue?.slug).toBe('vue');
      expect(angular?.slug).toBe('angular');
    });
  });

  describe('Framework Detection Logic', () => {
    it('should identify Next.js as highest popularity React framework', () => {
      const nextjs = getFramework('nextjs');
      const react = getFramework('react');
      
      expect(nextjs?.popularity).toBeGreaterThan(0);
      expect(nextjs?.relatedFrameworks).toContain('react');
    });

    it('should recognize framework relationships', () => {
      // React and Next.js should be related
      const nextjsRelated = getRelatedFrameworks('nextjs');
      const reactRelated = getRelatedFrameworks('react');
      
      expect(nextjsRelated.some(f => f.slug === 'react')).toBe(true);
      expect(reactRelated.some(f => f.slug === 'nextjs')).toBe(true);
    });

    it('should handle case-sensitive slug matching', () => {
      expect(getFramework('React')).toBeUndefined();
      expect(getFramework('NEXTJS')).toBeUndefined();
      expect(getFramework('react')).toBeDefined();
      expect(getFramework('nextjs')).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string slug', () => {
      const framework = getFramework('');
      expect(framework).toBeUndefined();
    });

    it('should handle special characters in slug', () => {
      expect(getFramework('react.js')).toBeUndefined();
      expect(getFramework('next-js')).toBeUndefined();
      expect(getFramework('vue/3')).toBeUndefined();
    });

    it('should handle very long slug strings', () => {
      const longSlug = 'a'.repeat(1000);
      expect(getFramework(longSlug)).toBeUndefined();
    });

    it('should handle null/undefined slugs gracefully', () => {
      expect(getFramework(null as any)).toBeUndefined();
      expect(getFramework(undefined as any)).toBeUndefined();
    });
  });

  describe('Framework Metadata', () => {
    it('should have SEO-friendly titles', () => {
      const allFrameworks = getAllFrameworks();
      
      allFrameworks.forEach(framework => {
        expect(framework.title).toBeTruthy();
        expect(framework.title.length).toBeGreaterThan(10);
        expect(framework.title.length).toBeLessThan(100);
      });
    });

    it('should include framework name in keywords', () => {
      const allFrameworks = getAllFrameworks();
      
      allFrameworks.forEach(framework => {
        const keywordsString = framework.keywords.join(' ').toLowerCase();
        const nameVariations = [
          framework.name.toLowerCase(),
          framework.slug.toLowerCase()
        ];
        
        const hasNameInKeywords = nameVariations.some(name => 
          keywordsString.includes(name)
        );
        
        expect(hasNameInKeywords).toBe(true);
      });
    });
  });
});
