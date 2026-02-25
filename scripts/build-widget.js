#!/usr/bin/env node

/**
 * Build script for TinyFeedback widget
 * Minifies widget.js for production
 */

const fs = require('fs');
const path = require('path');

// Simple minification (remove comments, extra whitespace)
function minifyJS(code) {
  return code
    // Remove single-line comments
    .replace(/\/\/.*$/gm, '')
    // Remove multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove extra whitespace
    .replace(/\n\s*/g, ' ')
    // Remove multiple spaces
    .replace(/\s{2,}/g, ' ')
    // Remove spaces around operators (carefully)
    .replace(/\s*([{}();,:])\s*/g, '$1')
    // Remove spaces at start/end
    .trim();
}

const publicDir = path.join(__dirname, '..', 'public');
const widgetPath = path.join(publicDir, 'widget.js');
const minifiedPath = path.join(publicDir, 'widget.min.js');

try {
  console.log('Building TinyFeedback widget...');
  
  // Read source
  const source = fs.readFileSync(widgetPath, 'utf8');
  
  // Minify
  const minified = minifyJS(source);
  
  // Add header
  const header = `/* TinyFeedback Widget v1.0.0 | https://tinyfeedback.vercel.app */\n`;
  const output = header + minified;
  
  // Write minified version
  fs.writeFileSync(minifiedPath, output);
  
  // Stats
  const originalSize = Buffer.byteLength(source, 'utf8');
  const minifiedSize = Buffer.byteLength(output, 'utf8');
  const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
  
  console.log('✅ Build successful!');
  console.log(`   Original:  ${(originalSize / 1024).toFixed(2)} KB`);
  console.log(`   Minified:  ${(minifiedSize / 1024).toFixed(2)} KB`);
  console.log(`   Savings:   ${savings}%`);
  console.log(`   Output:    ${path.relative(process.cwd(), minifiedPath)}`);
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
