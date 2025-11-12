# Schema Validation Error Fix: Orphaned Projects Cleanup

## Problem

You encountered this error:
```
Schema validation failed.
Document with ID "jn7034wkypcnpdyvkn0vd7r8n57tnrhf" in table "projects" does not match the schema: Value does not match validator.
Path: .userId
Value: "user_30xqHm23FRYopIgyfPPYsnMGqAq"
Validator: v.id("users")
```

This error occurs when the `projects` table contains documents with `userId` values that don't reference valid user IDs in the `users` table. This typically happens after migrating from Clerk to Better Auth, where old user IDs may not be properly linked to the new user records.

## Root Cause

During the Clerk → Better Auth migration, some projects in the database may still reference user IDs from the old authentication system. Convex's schema enforces referential integrity by default, which means:

1. **Project documents** have a `userId` field defined as `v.id("users")`
2. **Convex validates** that every referenced ID actually exists in the referenced table
3. **Orphaned documents** with invalid references fail validation

## Solution

We've created a cleanup utility that:
1. ✅ Identifies all projects with invalid `userId` references
2. ✅ Cascades deletion of all related data (messages, fragments, attachments)
3. ✅ Removes the orphaned project documents
4. ✅ Restores database integrity

## How to Run the Cleanup

### Prerequisites

1. **Start Convex Dev Server** (in a separate terminal)
   ```bash
   bun run convex:dev
   ```
   Keep this running! The cleanup script needs it.

2. **Set Environment Variables**
   After starting `convex:dev`, you'll see output like:
   ```
   ✓ Convex dev server is running!
   To open the dashboard, run:
   > npx convex dashboard --url <YOUR_URL>
   ```
   
   Copy the URL and add to your `.env`:
   ```bash
   NEXT_PUBLIC_CONVEX_URL=<YOUR_URL>
   ```

### Run the Cleanup

In a new terminal:
```bash
bun scripts/cleanup-orphaned-projects.ts
```

You'll see output like:
```
🚀 Initializing Convex client...
   URL: https://your-deployment.convex.cloud

🧹 Starting cleanup of orphaned projects...

✅ Cleaned up 1 orphaned projects and related data
   Cleaned projects: 1

📋 Removed project IDs:
   - jn7034wkypcnpdyvkn0vd7r8n57tnrhf

✅ Cleanup completed successfully!
```

## What Gets Deleted

The cleanup uses a cascade deletion approach to maintain data integrity:

```
Orphaned Project
├── Messages
│   ├── Attachments (deleted)
│   ├── Fragments (deleted)
│   └── Message itself (deleted)
├── Fragment Drafts (deleted)
└── Project itself (deleted)
```

**Important**: Only projects with invalid `userId` references are removed. All valid projects remain untouched.

## Verification

After running the cleanup, you can verify the fix:

### 1. Check Dashboard
```bash
bun run convex:dev
# Then visit: https://dashboard.convex.dev
```

Navigate to the **Data** tab and verify:
- Projects with valid `userId` references remain
- No documents remain with orphaned references

### 2. Run the App
```bash
# Terminal 1: Convex dev server
bun run convex:dev

# Terminal 2: Next.js dev server
bun run dev
```

The app should now work without schema validation errors.

### 3. Test Project Creation
1. Sign up or sign in at http://localhost:3000
2. Create a new project
3. Verify it saves correctly to the database

## Code Changes

### Files Modified
- `convex/importData.ts` - Added `cleanupOrphanedProjects` mutation and action

### New Functions

**`cleanupOrphanedProjects` (internal mutation)**
- Finds all projects with invalid `userId` references
- Cascades deletion of related data
- Returns count of cleaned projects

**`cleanupOrphanedProjectsAction` (public action)**
- HTTP-accessible wrapper for the cleanup function
- Used by the cleanup script

**`scripts/cleanup-orphaned-projects.ts` (admin script)**
- CLI tool to run the cleanup from the command line
- Provides user-friendly output

## When to Run This

Run this cleanup when you see the schema validation error. It's safe to run multiple times:

- ✅ Safe to run multiple times (idempotent)
- ✅ Only removes orphaned documents
- ✅ Won't affect valid user projects
- ✅ Can be run during development or production

## Troubleshooting

### Error: "NEXT_PUBLIC_CONVEX_URL is not set"
**Solution**: 
1. Run `bun run convex:dev` first
2. Copy the URL from the output
3. Add to `.env`: `NEXT_PUBLIC_CONVEX_URL=<URL>`

### Error: "Cannot connect to Convex"
**Solution**:
1. Make sure `bun run convex:dev` is still running
2. Verify the URL in `.env` matches the dev server output
3. Check internet connection

### Cleanup shows 0 cleaned projects but error still occurs
**Possible causes**:
1. The orphaned data was already removed
2. The validation error is from a different table (check the error message)
3. New data was inserted after you ran the cleanup

**Next steps**: Check the Convex dashboard directly to find the problem data.

## Additional Notes

### Data Safety
- ✅ Original data is not modified before deletion
- ✅ No data is moved or transformed
- ✅ Only orphaned documents are removed
- ✅ Can be re-run if needed

### Performance
- For small databases: < 1 second
- For large databases: up to a few seconds depending on orphaned count

### Future Prevention
To prevent this issue in the future:

1. **During migration**: Ensure all user references are updated to valid Convex user IDs
2. **In validation**: Test that all `userId` references exist before creating projects
3. **In imports**: Always validate foreign key references before inserting data

## Related Documentation

- [BETTER_AUTH_POLAR_SETUP.md](./BETTER_AUTH_POLAR_SETUP.md) - Setup guide for Better Auth
- [DATA_MIGRATION_GUIDE.md](./DATA_MIGRATION_GUIDE.md) - PostgreSQL to Convex migration
- [MIGRATION_CLERK_TO_BETTER_AUTH.md](../MIGRATION_CLERK_TO_BETTER_AUTH.md) - Clerk to Better Auth migration

## Questions?

If you encounter issues with the cleanup:

1. Check the error message carefully - it indicates what went wrong
2. Review the troubleshooting section above
3. Check Convex logs: `bun run convex logs`
4. Verify your Convex deployment status
