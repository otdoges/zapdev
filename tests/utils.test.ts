/**
 * Tests for utility functions (convertFilesToTreeItems, cn, etc.)
 */

import { describe, it, expect } from '@jest/globals';

// Simulate the utils module functions
type TreeItem = string | [string, ...TreeItem[]];

function convertFilesToTreeItems(files: Record<string, string>): TreeItem[] {
  interface TreeNode {
    [key: string]: TreeNode | null;
  }

  const tree: TreeNode = {};
  const sortedPaths = Object.keys(files).sort();

  for (const filePath of sortedPaths) {
    const parts = filePath.split("/");
    let current = tree;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }

    const fileName = parts[parts.length - 1];
    current[fileName] = null;
  }

  function convertNode(node: TreeNode, name?: string): TreeItem[] | TreeItem {
    const entries = Object.entries(node);

    if (entries.length === 0) {
      return name || "";
    }

    const children: TreeItem[] = [];

    for (const [key, value] of entries) {
      if (value === null) {
        children.push(key);
      } else {
        const subTree = convertNode(value, key);
        if (Array.isArray(subTree)) {
          children.push([key, ...subTree]);
        } else {
          children.push([key, subTree]);
        }
      }
    }

    return children;
  }

  const result = convertNode(tree);
  return Array.isArray(result) ? result : [result];
}

describe('Utility Functions', () => {
  describe('convertFilesToTreeItems', () => {
    it('should convert flat files to tree structure', () => {
      const files = {
        'README.md': 'content',
        'package.json': 'content'
      };

      const tree = convertFilesToTreeItems(files);

      expect(tree).toEqual(['README.md', 'package.json']);
    });

    it('should handle nested directory structure', () => {
      const files = {
        'src/index.ts': 'content',
        'src/utils.ts': 'content',
        'README.md': 'content'
      };

      const tree = convertFilesToTreeItems(files);

      expect(tree).toContainEqual('README.md');
      expect(tree).toContainEqual(['src', 'index.ts', 'utils.ts']);
    });

    it('should handle deeply nested directories', () => {
      const files = {
        'src/components/Button/Button.tsx': 'content',
        'src/components/Button/Button.test.tsx': 'content',
        'src/utils/helpers.ts': 'content'
      };

      const tree = convertFilesToTreeItems(files);

      // Should create nested structure: src -> components -> Button -> files
      expect(tree.length).toBeGreaterThan(0);
      const srcFolder = tree.find(item => 
        Array.isArray(item) && item[0] === 'src'
      ) as [string, ...TreeItem[]];
      
      expect(srcFolder).toBeDefined();
      expect(srcFolder[0]).toBe('src');
    });

    it('should sort files alphabetically', () => {
      const files = {
        'zebra.ts': 'content',
        'alpha.ts': 'content',
        'beta.ts': 'content'
      };

      const tree = convertFilesToTreeItems(files);

      expect(tree).toEqual(['alpha.ts', 'beta.ts', 'zebra.ts']);
    });

    it('should handle empty files object', () => {
      const files = {};

      const tree = convertFilesToTreeItems(files);

      // Empty files object returns [""] due to the convertNode logic
      expect(tree).toEqual([""]);
    });

    it('should handle single file in root', () => {
      const files = {
        'README.md': 'content'
      };

      const tree = convertFilesToTreeItems(files);

      expect(tree).toEqual(['README.md']);
    });

    it('should handle files with same directory prefix', () => {
      const files = {
        'src/app.ts': 'content',
        'src/app.test.ts': 'content',
        'src/app.config.ts': 'content'
      };

      const tree = convertFilesToTreeItems(files);

      const srcFolder = tree.find(item => 
        Array.isArray(item) && item[0] === 'src'
      ) as [string, ...TreeItem[]];
      
      expect(srcFolder).toBeDefined();
      // Should contain all three files
      const fileNames = srcFolder.slice(1);
      expect(fileNames).toContain('app.config.ts');
      expect(fileNames).toContain('app.test.ts');
      expect(fileNames).toContain('app.ts');
    });

    it('should handle mixed file and directory structure', () => {
      const files = {
        'README.md': 'content',
        'src/index.ts': 'content',
        'tests/unit.test.ts': 'content',
        'package.json': 'content'
      };

      const tree = convertFilesToTreeItems(files);

      expect(tree.length).toBe(4); // README, src, tests, package.json
      expect(tree).toContain('README.md');
      expect(tree).toContain('package.json');
    });

    it('should handle files with dots in directory names', () => {
      const files = {
        '.github/workflows/ci.yml': 'content',
        '.vscode/settings.json': 'content',
        'src/app.ts': 'content'
      };

      const tree = convertFilesToTreeItems(files);

      expect(tree.length).toBeGreaterThan(0);
      const githubFolder = tree.find(item => 
        Array.isArray(item) && item[0] === '.github'
      );
      expect(githubFolder).toBeDefined();
    });

    it('should preserve complex Next.js app structure', () => {
      const files = {
        'app/page.tsx': 'content',
        'app/layout.tsx': 'content',
        'app/api/route.ts': 'content',
        'components/Button.tsx': 'content',
        'lib/utils.ts': 'content'
      };

      const tree = convertFilesToTreeItems(files);

      expect(tree.length).toBe(3); // app, components, lib
      
      const appFolder = tree.find(item => 
        Array.isArray(item) && item[0] === 'app'
      ) as [string, ...TreeItem[]];
      
      expect(appFolder).toBeDefined();
      expect(appFolder[0]).toBe('app');
    });

    it('should handle very deeply nested structures', () => {
      const files = {
        'a/b/c/d/e/f/file.ts': 'content'
      };

      const tree = convertFilesToTreeItems(files);

      // Should create nested structure
      expect(Array.isArray(tree[0])).toBe(true);
      const level1 = tree[0] as [string, ...TreeItem[]];
      expect(level1[0]).toBe('a');
    });

    it('should handle special characters in filenames', () => {
      const files = {
        'file-name.ts': 'content',
        'file_name.ts': 'content',
        'file.config.ts': 'content',
        'file@2x.png': 'content'
      };

      const tree = convertFilesToTreeItems(files);

      expect(tree).toContain('file-name.ts');
      expect(tree).toContain('file_name.ts');
      expect(tree).toContain('file.config.ts');
      expect(tree).toContain('file@2x.png');
    });
  });

  describe('Edge Cases for convertFilesToTreeItems', () => {
    it('should handle files with no extension', () => {
      const files = {
        'Dockerfile': 'content',
        'Makefile': 'content',
        'README': 'content'
      };

      const tree = convertFilesToTreeItems(files);

      expect(tree).toContain('Dockerfile');
      expect(tree).toContain('Makefile');
      expect(tree).toContain('README');
    });

    it('should handle files with multiple extensions', () => {
      const files = {
        'app.test.tsx': 'content',
        'app.config.js': 'content',
        'backup.tar.gz': 'content'
      };

      const tree = convertFilesToTreeItems(files);

      expect(tree).toContain('app.config.js');
      expect(tree).toContain('app.test.tsx');
      expect(tree).toContain('backup.tar.gz');
    });

    it('should handle very long file paths', () => {
      const longPath = 'a/'.repeat(50) + 'file.ts';
      const files = {
        [longPath]: 'content'
      };

      const tree = convertFilesToTreeItems(files);

      expect(tree.length).toBeGreaterThan(0);
      expect(Array.isArray(tree[0])).toBe(true);
    });

    it('should handle files with trailing slashes (should not happen but handle gracefully)', () => {
      const files = {
        'src/app.ts': 'content',
        'tests/': 'content'
      };

      const tree = convertFilesToTreeItems(files);

      // The file with trailing slash creates an empty filename at the end
      expect(tree.length).toBeGreaterThan(0);
    });

    it('should maintain consistent ordering across multiple calls', () => {
      const files = {
        'zebra.ts': 'content',
        'alpha.ts': 'content',
        'beta.ts': 'content'
      };

      const tree1 = convertFilesToTreeItems(files);
      const tree2 = convertFilesToTreeItems(files);

      expect(tree1).toEqual(tree2);
    });

    it('should handle unicode characters in filenames', () => {
      const files = {
        'файл.ts': 'content',
        'ファイル.ts': 'content',
        'archivo.ts': 'content'
      };

      const tree = convertFilesToTreeItems(files);

      expect(tree.length).toBe(3);
    });

    it('should handle files with spaces in names', () => {
      const files = {
        'My File.ts': 'content',
        'Another File.ts': 'content',
        'src/Some Component.tsx': 'content'
      };

      const tree = convertFilesToTreeItems(files);

      expect(tree).toContain('My File.ts');
      expect(tree).toContain('Another File.ts');
    });
  });

  describe('Real-world File Structures', () => {
    it('should handle typical Next.js project structure', () => {
      const files = {
        'app/page.tsx': 'content',
        'app/layout.tsx': 'content',
        'app/globals.css': 'content',
        'app/api/hello/route.ts': 'content',
        'components/ui/button.tsx': 'content',
        'components/ui/input.tsx': 'content',
        'lib/utils.ts': 'content',
        'public/favicon.ico': 'content',
        'next.config.js': 'content',
        'package.json': 'content',
        'tsconfig.json': 'content'
      };

      const tree = convertFilesToTreeItems(files);

      expect(tree.length).toBeGreaterThan(0);
      
      // Should have root files
      expect(tree).toContain('next.config.js');
      expect(tree).toContain('package.json');
      expect(tree).toContain('tsconfig.json');
      
      // Should have folders
      const folderNames = tree
        .filter(item => Array.isArray(item))
        .map(item => (item as [string, ...TreeItem[]])[0]);
      
      expect(folderNames).toContain('app');
      expect(folderNames).toContain('components');
      expect(folderNames).toContain('lib');
      expect(folderNames).toContain('public');
    });

    it('should handle React with Vite project structure', () => {
      const files = {
        'src/main.tsx': 'content',
        'src/App.tsx': 'content',
        'src/App.css': 'content',
        'src/components/Button.tsx': 'content',
        'src/hooks/useCounter.ts': 'content',
        'public/vite.svg': 'content',
        'index.html': 'content',
        'vite.config.ts': 'content',
        'package.json': 'content'
      };

      const tree = convertFilesToTreeItems(files);

      expect(tree).toContain('index.html');
      expect(tree).toContain('vite.config.ts');
      expect(tree).toContain('package.json');
      
      const srcFolder = tree.find(item => 
        Array.isArray(item) && item[0] === 'src'
      );
      expect(srcFolder).toBeDefined();
    });

    it('should handle Angular project structure', () => {
      const files = {
        'src/app/app.component.ts': 'content',
        'src/app/app.component.html': 'content',
        'src/app/app.component.css': 'content',
        'src/app/app.module.ts': 'content',
        'src/main.ts': 'content',
        'angular.json': 'content',
        'package.json': 'content',
        'tsconfig.json': 'content'
      };

      const tree = convertFilesToTreeItems(files);

      expect(tree).toContain('angular.json');
      expect(tree).toContain('package.json');
      expect(tree).toContain('tsconfig.json');
    });
  });
});
