/**
 * Security tests for path traversal prevention
 */

import { jest, describe, it, expect } from '@jest/globals';
import { isValidFilePath } from '../src/inngest/functions';

describe('Security Tests - Path Traversal Prevention', () => {
  describe('isValidFilePath', () => {
    it('should allow valid file paths', () => {
      const validPaths = [
        '/home/user/app.js',
        '/home/user/src/components/Button.tsx',
        './src/index.ts',
        '/home/user/package.json',
        './README.md',
        '/home/user/.env',
      ];

      validPaths.forEach(path => {
        expect(isValidFilePath(path)).toBe(true);
      });
    });

    it('should block path traversal attempts', () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '/home/user/../../../etc/passwd',
        './src/../../../etc/passwd',
        '/home/user/src/../../../root/.ssh/id_rsa',
        '/home/user/../../../../../../bin/bash',
        '..%2F..%2F..%2Fetc%2Fpasswd',
        '..\\..\\..\\..\\windows\\system32',
      ];

      maliciousPaths.forEach(path => {
        expect(isValidFilePath(path)).toBe(false);
      });
    });

    it('should block null byte injection attempts', () => {
      const nullBytePaths = [
        '/home/user/file.txt\0.exe',
        './src/app.js\0malicious',
        '/home/user/config\0.json',
        'file\0path.txt',
      ];

      nullBytePaths.forEach(path => {
        expect(isValidFilePath(path)).toBe(false);
      });
    });

    it('should block paths with control characters', () => {
      const controlCharPaths = [
        '/home/user/file\n.txt',
        './src/app\r.js',
        '/home/user/config\t.json',
        'file\r\npath.txt',
        '/home/user/file\x1b[31m.txt', // ANSI escape sequence
      ];

      controlCharPaths.forEach(path => {
        expect(isValidFilePath(path)).toBe(false);
      });
    });

    it('should block empty and extremely long paths', () => {
      expect(isValidFilePath('')).toBe(false);
      expect(isValidFilePath('   ')).toBe(false);
      
      // Create a path longer than 4096 characters
      const longPath = '/home/user/' + 'a'.repeat(5000);
      expect(isValidFilePath(longPath)).toBe(false);
    });

    it('should block non-string inputs', () => {
      const invalidInputs = [
        null,
        undefined,
        123,
        {},
        [],
        true,
        Symbol('test'),
      ];

      invalidInputs.forEach(input => {
        expect(isValidFilePath(input as any)).toBe(false);
      });
    });

    it('should handle edge cases correctly', () => {
      const edgeCases = [
        '/', // Root directory - should be blocked
        '/home', // Parent directory - should be blocked
        '/home/', // Trailing slash - should be blocked
        '.', // Current directory - should be blocked
        './', // Current directory with slash - should be blocked
        '/home/user/./file.js', // Relative path within allowed - should be allowed
        '/home/user/../file.js', // Parent reference within allowed - should be blocked
      ];

      edgeCases.forEach(path => {
        const result = isValidFilePath(path);
        console.log(`Path: ${JSON.stringify(path)} -> ${result}`);
      });
    });

    it('should allow various file extensions within allowed paths', () => {
      const validFiles = [
        '/home/user/app.js',
        '/home/user/style.css',
        '/home/user/image.png',
        '/home/user/data.json',
        '/home/user/config.xml',
        '/home/user/archive.tar.gz',
        '/home/user/script.sh',
        '/home/user/document.pdf',
        '/home/user/video.mp4',
        '/home/user.audio.mp3',
      ];

      validFiles.forEach(path => {
        expect(isValidFilePath(path)).toBe(true);
      });
    });

    it('should prevent encoded path traversal attacks', () => {
      const encodedAttacks = [
        '/home/user/%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd', // URL encoded ../../../etc/passwd
        '/home/user/%2E%2E%2F%2E%2E%2F%2E%2E%2Fetc%2Fpasswd', // URL encoded with uppercase
        '/home/user/..%252f..%252f..%252fetc%252fpasswd', // Double URL encoded
      ];

      encodedAttacks.forEach(path => {
        expect(isValidFilePath(path)).toBe(false);
      });
    });

    it('should prevent Unicode-based path traversal', () => {
      const unicodeAttacks = [
        '/home/user/‥/‥/‥/etc/passwd', // Unicode double dot
        '/home/user／home／user／..／..／..／etc／passwd', // Fullwidth characters
        '/home/user/⁄/⁄/⁄etc/passwd', // Unicode division slash
      ];

      unicodeAttacks.forEach(path => {
        expect(isValidFilePath(path)).toBe(false);
      });
    });
  });

  describe('Comprehensive Security Scenarios', () => {
    it('should handle complex attack patterns', () => {
      const complexAttacks = [
        // Mixed encoding and traversal
        '/home/user/..%2f..%2f..%2fetc%2fpasswd',
        // Path normalization bypass attempts
        '/home/user//etc//passwd',
        '/home/user/././../../../etc/passwd',
        // Symlink attacks (should be blocked at path level)
        '/home/user/link_to_etc/passwd',
        // Case variations
        '/HOME/USER/../../../ETC/PASSWD',
        // Windows-style paths on Unix
        '/home/user\\..\\..\\..\\windows\\system32',
      ];

      complexAttacks.forEach(path => {
        expect(isValidFilePath(path)).toBe(false);
      });
    });

    it('should maintain performance with large numbers of path checks', () => {
      const paths = Array.from({ length: 10000 }, (_, i) => 
        i % 2 === 0 
          ? `/home/user/file${i}.js` 
          : `../../../etc/passwd${i}`
      );

      const startTime = Date.now();
      const results = paths.map(isValidFilePath);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(results.filter(Boolean)).toHaveLength(5000); // Half should be valid
    });
  });
});