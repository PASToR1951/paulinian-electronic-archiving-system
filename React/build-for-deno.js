/**
 * Build script for transpiling React components for use in Deno
 * 
 * This script builds specific React components and places them in the build directory
 * for use by the Deno side of the application.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const esbuild = require('esbuild');

// Configuration
const config = {
  componentsDir: './admin/pages',
  outputDir: '../build/admin/pages',
  entryPoints: [
    'author-list.tsx',
    // Add other components as needed
  ],
  nodeModulesDir: './node_modules',
  sharedDir: './shared'
};

// Ensure the output directory exists
function ensureDir(dirPath) {
  const fullPath = path.resolve(__dirname, dirPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created directory: ${fullPath}`);
  }
}

// Build a component with esbuild
async function buildComponent(componentPath, outPath) {
  try {
    await esbuild.build({
      entryPoints: [componentPath],
      bundle: true,
      outfile: outPath,
      format: 'esm',
      platform: 'browser',
      target: 'es2020',
      minify: false, // Set to true for production
      sourcemap: true,
      external: ['react', 'react-dom'],
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      plugins: [
        // Plugin to resolve imports properly
        {
          name: 'resolve-imports',
          setup(build) {
            // Handle .ts/.tsx imports
            build.onResolve({ filter: /\.(ts|tsx)$/ }, args => {
              if (args.kind === 'import-statement') {
                // Handle imports from the component directory
                if (args.path.startsWith('./') || args.path.startsWith('../')) {
                  return { path: path.resolve(args.resolveDir, args.path) };
                }
                // Handle imports from shared directory
                if (args.path.startsWith('shared/')) {
                  return { path: path.resolve(__dirname, config.sharedDir, args.path.slice(7)) };
                }
              }
              return null;
            });
          }
        }
      ]
    });
    console.log(`Successfully built: ${componentPath} -> ${outPath}`);
    return true;
  } catch (error) {
    console.error(`Failed to build ${componentPath}:`, error);
    return false;
  }
}

// Main build function
async function buildAll() {
  console.log('Starting build process...');
  
  // Ensure output directory exists
  ensureDir(config.outputDir);
  
  // Build each component
  let success = true;
  for (const component of config.entryPoints) {
    const sourcePath = path.join(config.componentsDir, component);
    const outputPath = path.join(config.outputDir, component.replace('.tsx', '.js'));
    
    const result = await buildComponent(sourcePath, outputPath);
    if (!result) {
      success = false;
    }
  }
  
  if (success) {
    console.log('✅ All components built successfully!');
  } else {
    console.error('❌ Some components failed to build. Check the logs above.');
    process.exit(1);
  }
}

// Run the build
buildAll(); 