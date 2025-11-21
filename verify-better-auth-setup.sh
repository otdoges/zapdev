#!/bin/bash

echo "🔍 Verifying Better Auth + Convex Integration"
echo "=============================================="
echo ""

# Check package installation
echo "✓ Checking @convex-dev/better-auth package..."
if grep -q "@convex-dev/better-auth" package.json; then
    echo "  ✅ Package installed"
else
    echo "  ❌ Package NOT found in package.json"
fi

# Check convex.config.ts
echo ""
echo "✓ Checking convex.config.ts..."
if grep -q "betterAuth" convex/convex.config.ts; then
    echo "  ✅ Better Auth component registered"
else
    echo "  ❌ Better Auth component NOT registered"
fi

# Check convex/auth.ts exists
echo ""
echo "✓ Checking convex/auth.ts..."
if [ -f "convex/auth.ts" ]; then
    echo "  ✅ Auth instance file exists"
    if grep -q "authComponent" convex/auth.ts && grep -q "createAuth" convex/auth.ts; then
        echo "  ✅ Exports authComponent and createAuth"
    fi
else
    echo "  ❌ convex/auth.ts NOT found"
fi

# Check HTTP routes
echo ""
echo "✓ Checking convex/http.ts..."
if grep -q "authComponent.registerRoutes" convex/http.ts; then
    echo "  ✅ Better Auth routes registered"
else
    echo "  ❌ Routes NOT registered"
fi

# Check client-side plugin
echo ""
echo "✓ Checking src/lib/auth-client.ts..."
if grep -q "convexClient" src/lib/auth-client.ts; then
    echo "  ✅ Convex client plugin configured"
else
    echo "  ❌ Convex client plugin NOT found"
fi

# Check provider
echo ""
echo "✓ Checking src/components/convex-provider.tsx..."
if grep -q "ConvexBetterAuthProvider" src/components/convex-provider.tsx; then
    echo "  ✅ Using ConvexBetterAuthProvider"
else
    echo "  ❌ NOT using ConvexBetterAuthProvider"
fi

# Check environment variables
echo ""
echo "✓ Checking environment variables in .env.local..."
if [ -f ".env.local" ]; then
    if grep -q "NEXT_PUBLIC_CONVEX_SITE_URL" .env.local; then
        echo "  ✅ NEXT_PUBLIC_CONVEX_SITE_URL configured"
    else
        echo "  ❌ NEXT_PUBLIC_CONVEX_SITE_URL missing"
    fi
    if grep -q "SITE_URL" .env.local; then
        echo "  ✅ SITE_URL configured"
    else
        echo "  ❌ SITE_URL missing"
    fi
else
    echo "  ⚠️  .env.local not found"
fi

# Check helpers
echo ""
echo "✓ Checking convex/helpers.ts..."
if grep -q "authComponent.getAuthUser" convex/helpers.ts; then
    echo "  ✅ Using authComponent.getAuthUser"
else
    echo "  ❌ NOT using authComponent.getAuthUser"
fi

# Check old route deleted
echo ""
echo "✓ Checking old routes..."
if [ -f "src/app/api/convex-auth/route.ts" ]; then
    echo "  ⚠️  Old /api/convex-auth route still exists (should be deleted)"
else
    echo "  ✅ Old /api/convex-auth route removed"
fi

# Check generated types
echo ""
echo "✓ Checking generated types..."
if grep -q "betterAuth" convex/_generated/api.d.ts 2>/dev/null; then
    echo "  ✅ Better Auth component types generated"
else
    echo "  ⚠️  Component types not found (run 'bunx convex dev')"
fi

echo ""
echo "=============================================="
echo "✅ Verification complete!"
echo ""
echo "Next steps:"
echo "1. Run 'bunx convex dev' in a separate terminal"
echo "2. Run 'bun run dev' to start the Next.js server"
echo "3. Test authentication flows"
