import Database from 'better-sqlite3';
import { withDatabase } from './pool';
import { createId } from '@paralleldrive/cuid2';
import path from 'path';
import { existsSync, readdirSync, readFileSync } from 'fs';

interface Migration {
  id: string;
  name: string;
  up: string;
  down: string;
  executedAt?: Date;
}

interface MigrationRecord {
  id: string;
  name: string;
  executed_at: string;
  checksum: string;
}

export class MigrationManager {
  private migrationsPath: string;

  constructor(migrationsPath?: string) {
    this.migrationsPath = migrationsPath || path.join(process.cwd(), 'migrations');
  }

  async initializeMigrationTable(): Promise<void> {
    await withDatabase((db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS _migrations (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          executed_at TEXT NOT NULL,
          checksum TEXT NOT NULL
        )
      `);
    });
  }

  async getExecutedMigrations(): Promise<MigrationRecord[]> {
    return withDatabase((db) => {
      const stmt = db.prepare('SELECT * FROM _migrations ORDER BY executed_at ASC');
      return stmt.all() as MigrationRecord[];
    });
  }

  async getPendingMigrations(): Promise<Migration[]> {
    const allMigrations = await this.loadMigrations();
    const executedMigrations = await this.getExecutedMigrations();
    const executedNames = new Set(executedMigrations.map(m => m.name));

    return allMigrations.filter(m => !executedNames.has(m.name));
  }

  private async loadMigrations(): Promise<Migration[]> {
    if (!existsSync(this.migrationsPath)) {
      return [];
    }

    const files = readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    const migrations: Migration[] = [];

    for (const file of files) {
      const filePath = path.join(this.migrationsPath, file);
      const content = readFileSync(filePath, 'utf-8');
      
      // Parse migration file (expecting -- UP and -- DOWN sections)
      const sections = this.parseMigrationFile(content);
      
      migrations.push({
        id: createId(),
        name: file.replace('.sql', ''),
        up: sections.up,
        down: sections.down,
      });
    }

    return migrations;
  }

  private parseMigrationFile(content: string): { up: string; down: string } {
    const lines = content.split('\n');
    let currentSection = '';
    let up = '';
    let down = '';

    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      
      if (trimmed.startsWith('-- up')) {
        currentSection = 'up';
        continue;
      }
      
      if (trimmed.startsWith('-- down')) {
        currentSection = 'down';
        continue;
      }

      if (currentSection === 'up') {
        up += line + '\n';
      } else if (currentSection === 'down') {
        down += line + '\n';
      }
    }

    return { up: up.trim(), down: down.trim() };
  }

  private calculateChecksum(content: string): string {
    // Simple checksum for migration verification
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  async executeMigration(migration: Migration): Promise<void> {
    await withDatabase((db) => {
      const transaction = db.transaction(() => {
        // Execute the migration
        db.exec(migration.up);
        
        // Record the migration
        const stmt = db.prepare(`
          INSERT INTO _migrations (id, name, executed_at, checksum) 
          VALUES (?, ?, ?, ?)
        `);
        
        stmt.run(
          migration.id,
          migration.name,
          new Date().toISOString(),
          this.calculateChecksum(migration.up)
        );
      });

      transaction();
    });
  }

  async rollbackMigration(migrationName: string): Promise<void> {
    const allMigrations = await this.loadMigrations();
    const migration = allMigrations.find(m => m.name === migrationName);
    
    if (!migration) {
      throw new Error(`Migration ${migrationName} not found`);
    }

    if (!migration.down) {
      throw new Error(`Migration ${migrationName} has no rollback script`);
    }

    await withDatabase((db) => {
      const transaction = db.transaction(() => {
        // Execute rollback
        db.exec(migration.down);
        
        // Remove migration record
        const stmt = db.prepare('DELETE FROM _migrations WHERE name = ?');
        stmt.run(migrationName);
      });

      transaction();
    });
  }

  async migrate(): Promise<{ executed: string[]; skipped: string[] }> {
    await this.initializeMigrationTable();
    
    const pendingMigrations = await this.getPendingMigrations();
    const executed: string[] = [];
    const skipped: string[] = [];

    for (const migration of pendingMigrations) {
      try {
        console.log(`Executing migration: ${migration.name}`);
        await this.executeMigration(migration);
        executed.push(migration.name);
        console.log(`✅ Migration ${migration.name} executed successfully`);
      } catch (error) {
        console.error(`❌ Migration ${migration.name} failed:`, error);
        // Stop on first failure to maintain consistency
        break;
      }
    }

    return { executed, skipped };
  }

  async status(): Promise<{
    executed: MigrationRecord[];
    pending: Migration[];
    total: number;
  }> {
    await this.initializeMigrationTable();
    
    const executed = await this.getExecutedMigrations();
    const pending = await this.getPendingMigrations();
    const total = executed.length + pending.length;

    return { executed, pending, total };
  }
}

// Global migration manager instance
let globalMigrationManager: MigrationManager | undefined;

export function getMigrationManager(): MigrationManager {
  if (!globalMigrationManager) {
    globalMigrationManager = new MigrationManager();
  }
  return globalMigrationManager;
}

// Utility functions for common migration operations
export const migrationUtils = {
  // Create index
  createIndex: (tableName: string, columnName: string, unique = false) => {
    const uniqueKeyword = unique ? 'UNIQUE ' : '';
    return `CREATE ${uniqueKeyword}INDEX IF NOT EXISTS idx_${tableName}_${columnName} ON ${tableName}(${columnName});`;
  },

  // Drop index
  dropIndex: (tableName: string, columnName: string) => {
    return `DROP INDEX IF EXISTS idx_${tableName}_${columnName};`;
  },

  // Add column
  addColumn: (tableName: string, columnName: string, columnType: string, defaultValue?: string) => {
    const defaultClause = defaultValue ? ` DEFAULT ${defaultValue}` : '';
    return `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}${defaultClause};`;
  },

  // Create table with common patterns
  createTable: (tableName: string, columns: string[], options?: { timestamps?: boolean }) => {
    let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
    sql += '  ' + columns.join(',\n  ');
    
    if (options?.timestamps) {
      sql += ',\n  created_at INTEGER,';
      sql += '\n  updated_at INTEGER';
    }
    
    sql += '\n);';
    return sql;
  },
};