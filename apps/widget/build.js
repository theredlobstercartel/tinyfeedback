/**
 * Build script for TinyFeedback Widget
 * ST-07: Widget - Temas e Customização
 */

const esbuild = require('esbuild')
const fs = require('fs')
const path = require('path')

const isWatch = process.argv.includes('--watch')

async function build() {
  try {
    // Ensure dist directory exists
    const distDir = path.join(__dirname, 'dist')
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true })
    }

    const buildOptions = {
      entryPoints: ['src/index.ts'],
      bundle: true,
      minify: true,
      sourcemap: true,
      target: 'es2020',
      format: 'iife',
      globalName: 'TinyFeedback',
      outfile: 'dist/widget.min.js',
      banner: {
        js: `/*! TinyFeedback Widget v1.0.0 | MIT License */`,
      },
    }

    if (isWatch) {
      const ctx = await esbuild.context(buildOptions)
      await ctx.watch()
      console.log('👀 Watching for changes...')
    } else {
      await esbuild.build(buildOptions)
      
      // Also build ESM version
      await esbuild.build({
        ...buildOptions,
        format: 'esm',
        outfile: 'dist/widget.esm.js',
        globalName: undefined,
      })

      // Get file size
      const stats = fs.statSync(path.join(distDir, 'widget.min.js'))
      const sizeKB = (stats.size / 1024).toFixed(2)

      console.log(`✅ Build complete!`)
      console.log(`📦 widget.min.js: ${sizeKB} KB`)
      console.log(`📦 widget.esm.js: ${(fs.statSync(path.join(distDir, 'widget.esm.js')).size / 1024).toFixed(2)} KB`)
    }
  } catch (error) {
    console.error('❌ Build failed:', error)
    process.exit(1)
  }
}

build()
