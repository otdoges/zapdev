import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';

// Database schema types and utilities for user databases
export interface DatabaseSchema {
  tables: DatabaseTable[];
  name: string;
  version?: string;
}

export interface DatabaseTable {
  name: string;
  columns: DatabaseColumn[];
  primaryKey?: string[];
  foreignKeys?: DatabaseForeignKey[];
  indexes?: DatabaseIndex[];
}

export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  autoIncrement?: boolean;
}

export interface DatabaseForeignKey {
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
}

export interface DatabaseIndex {
  name: string;
  columns: string[];
  unique: boolean;
}

// Generate Drizzle schema from database introspection
export function generateDrizzleSchema(schema: DatabaseSchema): string {
  const imports = `import { sqliteTable, text, integer, real, blob, primaryKey, foreignKey, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

`;

  const tableDefinitions = schema.tables.map(table => {
    const columns = table.columns.map(col => {
      let columnDef = '';
      
      // Map SQLite types to Drizzle column types
      switch (col.type.toLowerCase()) {
        case 'text':
        case 'varchar':
        case 'char':
          columnDef = `text('${col.name}')`;
          break;
        case 'integer':
        case 'int':
          columnDef = `integer('${col.name}')`;
          break;
        case 'real':
        case 'float':
        case 'double':
          columnDef = `real('${col.name}')`;
          break;
        case 'blob':
          columnDef = `blob('${col.name}')`;
          break;
        default:
          columnDef = `text('${col.name}')`;
      }

      // Add modifiers
      if (!col.nullable) {
        columnDef += '.notNull()';
      }
      if (col.defaultValue !== undefined) {
        columnDef += `.default(${JSON.stringify(col.defaultValue)})`;
      }
      if (col.autoIncrement) {
        columnDef += '.primaryKey({ autoIncrement: true })';
      }

      return `  ${col.name}: ${columnDef},`;
    }).join('\n');

    let tableOptions = '';
    if (table.primaryKey && table.primaryKey.length > 0 && !table.columns.some(col => col.autoIncrement)) {
      tableOptions += `\n  (table) => ({\n    pk: primaryKey({ columns: [${table.primaryKey.map(pk => `table.${pk}`).join(', ')}] })\n  })`;
    }

    return `export const ${table.name} = sqliteTable('${table.name}', {\n${columns}\n}${tableOptions});`;
  }).join('\n\n');

  return imports + tableDefinitions;
}

// Create a sample database with example data
export function createSampleDatabase(): DatabaseSchema {
  return {
    name: 'sample_app_db',
    version: '1.0.0',
    tables: [
      {
        name: 'users',
        columns: [
          { name: 'id', type: 'integer', nullable: false, autoIncrement: true },
          { name: 'name', type: 'text', nullable: false },
          { name: 'email', type: 'text', nullable: false },
          { name: 'created_at', type: 'text', nullable: false, defaultValue: new Date().toISOString() },
          { name: 'updated_at', type: 'text', nullable: true }
        ],
        primaryKey: ['id'],
        indexes: [
          { name: 'idx_users_email', columns: ['email'], unique: true }
        ]
      },
      {
        name: 'posts',
        columns: [
          { name: 'id', type: 'integer', nullable: false, autoIncrement: true },
          { name: 'title', type: 'text', nullable: false },
          { name: 'content', type: 'text', nullable: true },
          { name: 'user_id', type: 'integer', nullable: false },
          { name: 'published', type: 'integer', nullable: false, defaultValue: 0 },
          { name: 'created_at', type: 'text', nullable: false, defaultValue: new Date().toISOString() }
        ],
        primaryKey: ['id'],
        foreignKeys: [
          { columnName: 'user_id', referencedTable: 'users', referencedColumn: 'id' }
        ],
        indexes: [
          { name: 'idx_posts_user_id', columns: ['user_id'], unique: false }
        ]
      },
      {
        name: 'comments',
        columns: [
          { name: 'id', type: 'integer', nullable: false, autoIncrement: true },
          { name: 'content', type: 'text', nullable: false },
          { name: 'user_id', type: 'integer', nullable: false },
          { name: 'post_id', type: 'integer', nullable: false },
          { name: 'created_at', type: 'text', nullable: false, defaultValue: new Date().toISOString() }
        ],
        primaryKey: ['id'],
        foreignKeys: [
          { columnName: 'user_id', referencedTable: 'users', referencedColumn: 'id' },
          { columnName: 'post_id', referencedTable: 'posts', referencedColumn: 'id' }
        ]
      }
    ]
  };
}

// Generate migration SQL from schema
export function generateMigrationSQL(schema: DatabaseSchema): string {
  let sql = `-- Migration for ${schema.name}\n-- Generated at ${new Date().toISOString()}\n\n`;

  schema.tables.forEach(table => {
    sql += `CREATE TABLE IF NOT EXISTS ${table.name} (\n`;
    
    const columnDefs = table.columns.map(col => {
      let def = `  ${col.name} ${col.type.toUpperCase()}`;
      if (!col.nullable) def += ' NOT NULL';
      if (col.autoIncrement) def += ' PRIMARY KEY AUTOINCREMENT';
      if (col.defaultValue !== undefined) {
        def += ` DEFAULT ${typeof col.defaultValue === 'string' ? `'${col.defaultValue}'` : col.defaultValue}`;
      }
      return def;
    });

    sql += columnDefs.join(',\n');

    // Add primary key if not auto-increment
    if (table.primaryKey && table.primaryKey.length > 0 && !table.columns.some(col => col.autoIncrement)) {
      sql += `,\n  PRIMARY KEY (${table.primaryKey.join(', ')})`;
    }

    // Add foreign keys
    if (table.foreignKeys && table.foreignKeys.length > 0) {
      table.foreignKeys.forEach(fk => {
        sql += `,\n  FOREIGN KEY (${fk.columnName}) REFERENCES ${fk.referencedTable}(${fk.referencedColumn})`;
      });
    }

    sql += '\n);\n\n';

    // Add indexes
    if (table.indexes && table.indexes.length > 0) {
      table.indexes.forEach(idx => {
        sql += `CREATE ${idx.unique ? 'UNIQUE ' : ''}INDEX IF NOT EXISTS ${idx.name} ON ${table.name} (${idx.columns.join(', ')});\n`;
      });
      sql += '\n';
    }
  });

  return sql;
}

// Generate sample data insertion SQL
export function generateSampleDataSQL(schema: DatabaseSchema): string {
  let sql = `-- Sample data for ${schema.name}\n\n`;

  // Sample users
  sql += `INSERT OR IGNORE INTO users (name, email, created_at) VALUES
  ('Alice Johnson', 'alice@example.com', '${new Date().toISOString()}'),
  ('Bob Smith', 'bob@example.com', '${new Date().toISOString()}'),
  ('Charlie Brown', 'charlie@example.com', '${new Date().toISOString()}');

`;

  // Sample posts
  sql += `INSERT OR IGNORE INTO posts (title, content, user_id, published, created_at) VALUES
  ('Getting Started with React', 'React is a powerful library for building user interfaces...', 1, 1, '${new Date().toISOString()}'),
  ('Database Design Best Practices', 'When designing a database, consider normalization...', 2, 1, '${new Date().toISOString()}'),
  ('My First Blog Post', 'Welcome to my blog! This is my first post...', 3, 0, '${new Date().toISOString()}');

`;

  // Sample comments
  sql += `INSERT OR IGNORE INTO comments (content, user_id, post_id, created_at) VALUES
  ('Great article! Very helpful.', 2, 1, '${new Date().toISOString()}'),
  ('Thanks for sharing this.', 3, 1, '${new Date().toISOString()}'),
  ('I have a question about normalization...', 1, 2, '${new Date().toISOString()}');

`;

  return sql;
}

// Export complete database package
export function exportDatabasePackage(schema: DatabaseSchema): {
  drizzleSchema: string;
  migrationSQL: string;
  sampleDataSQL: string;
  packageJson: string;
  drizzleConfig: string;
} {
  const drizzleSchema = generateDrizzleSchema(schema);
  const migrationSQL = generateMigrationSQL(schema);
  const sampleDataSQL = generateSampleDataSQL(schema);
  
  const packageJson = JSON.stringify({
    name: `${schema.name.replace(/[^a-zA-Z0-9]/g, '-')}-db`,
    version: schema.version || '1.0.0',
    description: `Database schema for ${schema.name}`,
    main: 'src/schema.ts',
    scripts: {
      'db:generate': 'drizzle-kit generate',
      'db:migrate': 'drizzle-kit migrate',
      'db:studio': 'drizzle-kit studio',
      'db:push': 'drizzle-kit push'
    },
    dependencies: {
      'drizzle-orm': '^0.44.5',
      'better-sqlite3': '^12.2.0'
    },
    devDependencies: {
      'drizzle-kit': '^0.31.4',
      '@types/better-sqlite3': '^7.6.13',
      'typescript': '^5.0.0'
    }
  }, null, 2);

  const drizzleConfig = `import { Config } from 'drizzle-kit';

export default {
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './database.db'
  }
} satisfies Config;`;

  return {
    drizzleSchema,
    migrationSQL,
    sampleDataSQL,
    packageJson,
    drizzleConfig
  };
}