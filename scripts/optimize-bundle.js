#!/usr/bin/env node

/**
 * Bundle optimization script
 * Analyzes dependencies and provides recommendations for reducing bundle size
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

// Analyze package.json dependencies
function analyzeDependencies() {
  logSection('📦 Analyzing Dependencies');

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};

  const totalDeps = Object.keys(dependencies).length;
  const totalDevDeps = Object.keys(devDependencies).length;

  log(`Total dependencies: ${totalDeps}`, 'cyan');
  log(`Total devDependencies: ${totalDevDeps}`, 'cyan');
  log(`Total packages: ${totalDeps + totalDevDeps}`, 'bright');

  // Check for large dependencies
  const largeDeps = [
    'moment', // Use date-fns instead
    'lodash', // Use lodash-es or individual imports
    'jquery', // Not needed in React
    'bootstrap', // Use Tailwind CSS
    'antd', // Already using custom components
    'material-ui', // Already using custom components
  ];

  const foundLargeDeps = Object.keys(dependencies).filter((dep) =>
    largeDeps.some((large) => dep.includes(large))
  );

  if (foundLargeDeps.length > 0) {
    log('\n⚠️  Large dependencies found:', 'yellow');
    foundLargeDeps.forEach((dep) => {
      log(`  - ${dep} (consider alternatives)`, 'yellow');
    });
  }

  return { dependencies, devDependencies };
}

// Check for duplicate packages
function checkDuplicates() {
  logSection('🔍 Checking for Duplicate Packages');

  try {
    // Use npm ls to find duplicates
    const output = execSync('npm ls --depth=10 --json', { encoding: 'utf8' });
    const tree = JSON.parse(output);

    const packages = new Map();

    function traverse(deps, parent = '') {
      Object.entries(deps || {}).forEach(([name, info]) => {
        if (!packages.has(name)) {
          packages.set(name, new Set());
        }
        packages.get(name).add(info.version);

        if (info.dependencies) {
          traverse(info.dependencies, name);
        }
      });
    }

    traverse(tree.dependencies);

    const duplicates = Array.from(packages.entries())
      .filter(([name, versions]) => versions.size > 1)
      .map(([name, versions]) => ({ name, versions: Array.from(versions) }));

    if (duplicates.length > 0) {
      log(`Found ${duplicates.length} packages with multiple versions:`, 'yellow');
      duplicates.forEach(({ name, versions }) => {
        log(`  ${name}: ${versions.join(', ')}`, 'yellow');
      });
    } else {
      log('No duplicate packages found ✅', 'green');
    }

    return duplicates;
  } catch (error) {
    log('Could not analyze duplicates (npm ls failed)', 'red');
    return [];
  }
}

// Analyze imports for tree-shaking opportunities
function analyzeImports() {
  logSection('🌳 Analyzing Import Patterns');

  const srcDir = path.join(process.cwd(), 'app');
  const componentsDir = path.join(process.cwd(), 'components');
  const libDir = path.join(process.cwd(), 'lib');

  const issues = [];

  // Check for non-tree-shakeable imports
  const checkFile = (filePath) => {
    if (!fs.existsSync(filePath)) return;

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for full package imports
      if (line.includes('import * as')) {
        issues.push({
          file: filePath,
          line: index + 1,
          type: 'namespace-import',
          message: 'Namespace imports prevent tree-shaking',
        });
      }

      // Check for specific heavy imports
      if (line.includes("from 'lodash'") && !line.includes('lodash/')) {
        issues.push({
          file: filePath,
          line: index + 1,
          type: 'lodash-full',
          message: 'Import specific lodash functions instead',
        });
      }

      if (line.includes("from 'framer-motion'") && line.includes('*')) {
        issues.push({
          file: filePath,
          line: index + 1,
          type: 'framer-motion-full',
          message: 'Import only needed components from framer-motion',
        });
      }
    });
  };

  // Recursively check all TypeScript/JavaScript files
  const checkDirectory = (dir) => {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        checkDirectory(filePath);
      } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
        checkFile(filePath);
      }
    });
  };

  [srcDir, componentsDir, libDir].forEach(checkDirectory);

  if (issues.length > 0) {
    log(`Found ${issues.length} import issues:`, 'yellow');
    issues.slice(0, 10).forEach((issue) => {
      log(`  ${issue.file}:${issue.line} - ${issue.message}`, 'yellow');
    });
    if (issues.length > 10) {
      log(`  ... and ${issues.length - 10} more`, 'yellow');
    }
  } else {
    log('Import patterns look good ✅', 'green');
  }

  return issues;
}

// Generate optimization recommendations
function generateRecommendations(deps, duplicates, importIssues) {
  logSection('💡 Optimization Recommendations');

  const recommendations = [];

  // Check for specific optimizations
  if (deps.dependencies['react-icons']) {
    recommendations.push({
      priority: 'high',
      title: 'Replace react-icons with lucide-react',
      description: "You're already using lucide-react. Remove react-icons to save ~2MB",
    });
  }

  if (deps.dependencies['moment']) {
    recommendations.push({
      priority: 'high',
      title: 'Replace moment with date-fns',
      description: 'date-fns is already installed. Remove moment to save ~300KB',
    });
  }

  if (duplicates.length > 5) {
    recommendations.push({
      priority: 'medium',
      title: 'Deduplicate dependencies',
      description: `Run 'npm dedupe' to resolve ${duplicates.length} duplicate packages`,
    });
  }

  if (importIssues.length > 0) {
    recommendations.push({
      priority: 'medium',
      title: 'Fix import patterns',
      description: `Update ${importIssues.length} imports to enable better tree-shaking`,
    });
  }

  // Check for unused dependencies
  const unusedCandidates = [
    '@types/react-window', // Check if react-window is actually used
    'cmdk', // Check if command menu is used
    'recharts', // Check if charts are used
  ];

  unusedCandidates.forEach((pkg) => {
    if (deps.dependencies[pkg] || deps.devDependencies[pkg]) {
      recommendations.push({
        priority: 'low',
        title: `Verify usage of ${pkg}`,
        description: `Check if ${pkg} is actually used in the codebase`,
      });
    }
  });

  // Output recommendations
  const highPriority = recommendations.filter((r) => r.priority === 'high');
  const mediumPriority = recommendations.filter((r) => r.priority === 'medium');
  const lowPriority = recommendations.filter((r) => r.priority === 'low');

  if (highPriority.length > 0) {
    log('\n🔴 High Priority:', 'red');
    highPriority.forEach((rec) => {
      log(`  • ${rec.title}`, 'bright');
      log(`    ${rec.description}`, 'reset');
    });
  }

  if (mediumPriority.length > 0) {
    log('\n🟡 Medium Priority:', 'yellow');
    mediumPriority.forEach((rec) => {
      log(`  • ${rec.title}`, 'bright');
      log(`    ${rec.description}`, 'reset');
    });
  }

  if (lowPriority.length > 0) {
    log('\n🟢 Low Priority:', 'green');
    lowPriority.forEach((rec) => {
      log(`  • ${rec.title}`, 'bright');
      log(`    ${rec.description}`, 'reset');
    });
  }

  return recommendations;
}

// Create optimization config
function createOptimizationConfig() {
  logSection('⚙️  Generating Optimization Config');

  const optimizationConfig = {
    // Next.js specific optimizations
    experimental: {
      optimizeCss: true,
      optimizePackageImports: [
        'lucide-react',
        'framer-motion',
        '@radix-ui/react-*',
        'date-fns',
        'zustand',
      ],
    },

    // Webpack optimization
    webpack: {
      optimization: {
        sideEffects: false,
        usedExports: true,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              priority: 40,
              enforce: true,
            },
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name(module) {
                const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
                return `npm.${packageName.replace('@', '')}`;
              },
              priority: 10,
              minChunks: 1,
              reuseExistingChunk: true,
            },
          },
        },
      },
    },
  };

  log('Suggested next.config.mjs optimizations:', 'cyan');
  console.log(JSON.stringify(optimizationConfig, null, 2));

  return optimizationConfig;
}

// Main execution
async function main() {
  log('🚀 Starting Bundle Optimization Analysis', 'bright');

  try {
    const deps = analyzeDependencies();
    const duplicates = checkDuplicates();
    const importIssues = analyzeImports();
    const recommendations = generateRecommendations(deps, duplicates, importIssues);
    const config = createOptimizationConfig();

    logSection('📊 Summary');
    log(`Total recommendations: ${recommendations.length}`, 'cyan');
    log(`Potential size reduction: ~${Math.floor(recommendations.length * 100)}KB`, 'green');

    // Generate report file
    const report = {
      timestamp: new Date().toISOString(),
      dependencies: {
        total: Object.keys(deps.dependencies).length,
        dev: Object.keys(deps.devDependencies).length,
      },
      duplicates: duplicates.length,
      importIssues: importIssues.length,
      recommendations,
      optimizationConfig: config,
    };

    fs.writeFileSync('bundle-optimization-report.json', JSON.stringify(report, null, 2));
    log('\n✅ Report saved to bundle-optimization-report.json', 'green');
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the script
main();
