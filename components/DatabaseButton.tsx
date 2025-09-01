'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  createSampleDatabase, 
  exportDatabasePackage
} from '@/lib/database-utils';
import { motion, AnimatePresence } from 'framer-motion';

interface DatabaseButtonProps {
  onDatabaseGenerated?: (files: Array<{ path: string; content: string; type: string }>) => void;
}

export default function DatabaseButton({ onDatabaseGenerated }: DatabaseButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleGenerateDatabase = async () => {
    setIsGenerating(true);
    setShowModal(false);
    
    try {
      // Create sample database schema
      const schema = createSampleDatabase();
      
      // Generate all database files
      const dbPackage = exportDatabasePackage(schema);
      
      // Create file structure for the database
      const files = [
        {
          path: 'src/database/schema.ts',
          content: dbPackage.drizzleSchema,
          type: 'typescript'
        },
        {
          path: 'src/database/migrations/001_initial.sql',
          content: dbPackage.migrationSQL,
          type: 'sql'
        },
        {
          path: 'src/database/seed.sql',
          content: dbPackage.sampleDataSQL,
          type: 'sql'
        },
        {
          path: 'drizzle.config.ts',
          content: dbPackage.drizzleConfig,
          type: 'typescript'
        },
        {
          path: 'src/database/index.ts',
          content: `import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// Create SQLite database instance
const sqlite = new Database('database.db');

// Create Drizzle instance with schema
export const db = drizzle(sqlite, { schema });

// Export schema for use in components
export { schema };

// Database utilities
export async function initDatabase() {
  // Run migrations here if needed
  console.log('Database initialized');
}

// Example queries
export async function getUsers() {
  return db.select().from(schema.users);
}

export async function getUserPosts(userId: number) {
  return db.select()
    .from(schema.posts)
    .where(eq(schema.posts.user_id, userId));
}

export async function getPostComments(postId: number) {
  return db.select()
    .from(schema.comments)
    .where(eq(schema.comments.post_id, postId));
}`,
          type: 'typescript'
        },
        {
          path: 'src/components/UserList.tsx',
          content: `'use client';

import { useState, useEffect } from 'react';
import { db, schema } from '../database';

export default function UserList() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const result = await db.select().from(schema.users);
        setUsers(result);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  if (loading) {
    return <div className="p-4">Loading users...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Users</h2>
      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="p-3 border rounded-lg">
            <h3 className="font-semibold">{user.name}</h3>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-500">
              Created: {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}`,
          type: 'tsx'
        },
        {
          path: 'package.json',
          content: dbPackage.packageJson,
          type: 'json'
        },
        {
          path: 'README.md',
          content: `# ${schema.name} Database

This database was generated with Drizzle ORM and SQLite.

## Quick Start

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Generate migrations:
   \`\`\`bash
   npm run db:generate
   \`\`\`

3. Run migrations:
   \`\`\`bash
   npm run db:migrate
   \`\`\`

4. (Optional) Open Drizzle Studio:
   \`\`\`bash
   npm run db:studio
   \`\`\`

## Database Schema

### Tables

#### users
- \`id\` - Primary key (auto-increment)
- \`name\` - User's full name
- \`email\` - User's email (unique)
- \`created_at\` - Account creation timestamp
- \`updated_at\` - Last update timestamp

#### posts
- \`id\` - Primary key (auto-increment)
- \`title\` - Post title
- \`content\` - Post content
- \`user_id\` - Foreign key to users table
- \`published\` - Publication status (0/1)
- \`created_at\` - Post creation timestamp

#### comments
- \`id\` - Primary key (auto-increment)
- \`content\` - Comment content
- \`user_id\` - Foreign key to users table
- \`post_id\` - Foreign key to posts table
- \`created_at\` - Comment creation timestamp

## Usage

Import the database instance and schema:

\`\`\`typescript
import { db, schema } from './src/database';

// Query users
const users = await db.select().from(schema.users);

// Query with relations
const userPosts = await db.select()
  .from(schema.posts)
  .where(eq(schema.posts.user_id, userId));
\`\`\`

## Sample Data

Run the seed.sql file to populate your database with sample data:

\`\`\`bash
sqlite3 database.db < src/database/seed.sql
\`\`\`
`,
          type: 'markdown'
        }
      ];

      // Simulate generation delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Trigger the callback with generated files
      onDatabaseGenerated?.(files);
      
    } catch (error) {
      console.error('Error generating database:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowModal(true)}
        disabled={isGenerating}
        className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
            Generating...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4M4 7h16" />
            </svg>
            Database
          </>
        )}
      </Button>

      {/* Database Generation Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4M4 7h16" />
                  </svg>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Generate Database Schema
                </h3>
                
                <p className="text-gray-600 mb-6">
                  Generate a complete SQLite database with Drizzle ORM including schema, migrations, and sample data.
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h4 className="font-medium text-gray-900 mb-2">Includes:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Drizzle ORM schema definition</li>
                    <li>• SQLite migration files</li>
                    <li>• Sample data and seed scripts</li>
                    <li>• TypeScript database client</li>
                    <li>• React components for data display</li>
                    <li>• Complete package.json setup</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerateDatabase}
                    disabled={isGenerating}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Generate Database
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}