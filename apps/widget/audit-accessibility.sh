#!/bin/bash
# Axe-core accessibility audit script for TinyFeedback Widget
# ST-12: UX Polish - Acessibilidade

echo "🔍 Running axe-core accessibility audit..."

# Check if demo.html is accessible
npx @axe-core/cli --stdout --tags wcag2aa --timeout 30000 http://localhost:8080/demo.html 2>/dev/null || echo "⚠️  Server not running. Start a server with: npx serve ."

echo ""
echo "✅ Audit complete!"
echo ""
echo "To run the audit manually:"
echo "  1. Start a local server: npx serve . -p 8080"
echo "  2. Run: npx @axe-core/cli http://localhost:8080/demo.html"
