#!/bin/bash

# Start development servers for the Vibe project

echo "🚀 Starting Vibe Development Environment"
echo "========================================="
echo ""
echo "This script will help you start both the Next.js app and Inngest dev server."
echo ""
echo "📝 Instructions:"
echo "1. Open two terminal windows"
echo ""
echo "Terminal 1 - Next.js App:"
echo "  npm run dev"
echo ""
echo "Terminal 2 - Inngest Dev Server:"
echo "  npm run dev:inngest"
echo "  OR"
echo "  npx inngest-cli@latest dev -u http://localhost:3000/api/inngest"
echo ""
echo "========================================="
echo ""
echo "🔗 Once both servers are running:"
echo "- Next.js app: http://localhost:3000"
echo "- Inngest Dev UI: http://localhost:8288"
echo ""
echo "✅ The AI code generation should now work properly!"
echo ""
echo "Would you like to start the Inngest dev server now? (y/n)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "Starting Inngest dev server..."
    npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
else
    echo "Please run the servers manually using the instructions above."
fi
