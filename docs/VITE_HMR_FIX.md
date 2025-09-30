# Vite HMR Fix Documentation

## Problem

The Vite Hot Module Replacement (HMR) was not detecting file changes after AI-generated code was applied to the sandbox. This required users to manually refresh the page to see changes, defeating the purpose of HMR.

### Root Causes

1. **Missing File Watch Polling**: Remote sandboxes (Vercel, E2B) require polling mode for file watching, but the Vite configuration was missing `watch: { usePolling: true }` for Vercel provider.

2. **No Filesystem Sync**: After writing files, the Vercel provider wasn't triggering filesystem sync or touching files to notify the file watcher.

3. **Manual Refresh Workaround**: The frontend was using forced iframe refreshes as a workaround, adding a 2-second delay.

## Solution

### 1. Enhanced Vercel Provider Vite Configuration

**File**: `lib/sandbox/providers/vercel-provider.ts`

Added polling configuration to Vite server settings:

```javascript
watch: {
  usePolling: true,
  interval: 100
}
```

This ensures Vite actively polls for file changes in the remote sandbox environment, which is critical because native file system events don't work reliably in containerized/remote environments.

### 2. File Change Triggers in Vercel Provider

**File**: `lib/sandbox/providers/vercel-provider.ts`

Added filesystem sync and touch commands after writing files:

```typescript
// Force file system sync and trigger HMR
await this.sandbox.runCommand({
  cmd: 'sh',
  args: ['-c', `sync && touch "${fullPath}"`],
  cwd: '/vercel/sandbox'
});

// Small delay to let HMR pick up the change
await new Promise(resolve => setTimeout(resolve, 300));
```

**Why this works**:
- `sync`: Forces all pending filesystem writes to disk
- `touch`: Updates the file's modification timestamp, ensuring the file watcher detects the change
- `300ms delay`: Gives Vite's file watcher time to detect and process the change

### 3. Consistent E2B Provider Timing

**File**: `lib/sandbox/providers/e2b-provider.ts`

Reduced the HMR delay from 500ms to 300ms to match Vercel provider:

```typescript
// Small delay to let HMR pick up the change
await new Promise(resolve => setTimeout(resolve, 300));
```

E2B provider already had:
- Filesystem sync via Python subprocess
- File touch via Python subprocess
- Polling configuration in Vite config (`usePolling: true, interval: 100`)

### 4. Configuration Documentation

**File**: `config/app.config.ts`

Added HMR sync delay configuration:

```typescript
codeApplication: {
  // HMR file sync delay (milliseconds) - time to wait after writing files for HMR to detect changes
  hmrSyncDelay: 300,
  // ... other settings
}
```

## Technical Details

### Why Polling is Required

In remote/containerized environments:
- Native filesystem events (inotify on Linux) may not propagate correctly
- File system abstraction layers can delay event notifications
- Network latency affects file change detection

Polling solves this by:
- Actively checking file modification times at regular intervals
- Not relying on filesystem event notifications
- Providing consistent behavior across different environments

### Optimal Polling Interval

- **100ms**: Fast enough for responsive HMR (users see changes within 100-200ms)
- **Not too aggressive**: Doesn't overload the sandbox with constant file system checks
- **Industry standard**: Used by many development tools in containerized environments

### HMR Sync Delay

- **300ms**: Balances responsiveness with reliability
- Allows time for:
  - Filesystem sync to complete
  - File watcher to detect the change
  - Vite to process the update
  - Browser WebSocket to receive the HMR message

## Benefits

1. **Instant Updates**: Code changes appear in the preview within ~300-400ms
2. **Better UX**: No manual page refreshes required
3. **Preserved State**: React component state is preserved during HMR updates
4. **Faster Development**: Developers can see changes immediately
5. **Reduced Resource Usage**: No full page reloads, just module replacements

## Related Web Search Findings

Based on research, common Vite HMR issues include:

1. **File watching limitations** (solved by polling)
2. **Circular dependencies** (not applicable to our case)
3. **Case sensitivity in imports** (preventable through code review)
4. **Caching issues** (solved by proper HMR configuration)
5. **WSL2 compatibility** (solved by polling)

## Testing

To verify the fix works:

1. Create a sandbox
2. Generate code with AI
3. Observe that changes appear in the preview without manual refresh
4. Check console logs for "Triggered HMR for: [filename]" messages
5. Verify HMR WebSocket connection in browser DevTools

## Performance Impact

- **Minimal**: 300ms delay per file write
- **Acceptable trade-off**: Reliability over speed
- **Batch operations**: Multiple file writes happen in parallel
- **No user-facing delay**: Users see progress indicators during code application

## Future Improvements

Potential optimizations:

1. **Adaptive delay**: Reduce delay if sandbox responds quickly
2. **Batch touch commands**: Touch multiple files in a single command
3. **HMR health check**: Verify HMR is working before relying on it
4. **Fallback mechanism**: Auto-refresh if HMR fails after N seconds

## References

- [Vite HMR Documentation](https://vitejs.dev/guide/api-hmr.html)
- [Vite Server Options](https://vitejs.dev/config/server-options.html)
- Web search results on Vite HMR troubleshooting
- E2B and Vercel Sandbox documentation
