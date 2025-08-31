import Database from 'better-sqlite3';
import { withDatabase } from './connection-enhanced';
import path from 'path';
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface BackupOptions {
  backupDir?: string;
  maxBackups?: number;
  compressionLevel?: number;
}

interface BackupInfo {
  filename: string;
  path: string;
  size: number;
  createdAt: Date;
  type: 'manual' | 'scheduled' | 'wal';
}

interface RestoreOptions {
  skipValidation?: boolean;
  createCheckpoint?: boolean;
}

export class DatabaseBackupManager {
  private backupDir: string;
  private maxBackups: number;
  private compressionLevel: number;

  constructor(options: BackupOptions = {}) {
    this.backupDir = options.backupDir || path.join(process.cwd(), 'data', 'backups');
    this.maxBackups = options.maxBackups || 10;
    this.compressionLevel = options.compressionLevel || 6;

    // Ensure backup directory exists
    this.ensureBackupDirectory();
  }

  private ensureBackupDirectory(): void {
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Create a full database backup
   */
  async createBackup(type: 'manual' | 'scheduled' | 'wal' = 'manual'): Promise<BackupInfo> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${timestamp}_${type}.db`;
    const backupPath = path.join(this.backupDir, filename);

    await withDatabase(async (db) => {
      // Create checkpoint to ensure all WAL data is written
      db.pragma('wal_checkpoint(TRUNCATE)');
      
      // Create backup using SQLite's backup API
      const backup = db.backup(backupPath);
      
      // Progress tracking for large databases
      let progress = backup.step(-1);
      while (progress.remaining > 0) {
        console.log(`Backup progress: ${progress.totalPages - progress.remaining}/${progress.totalPages} pages`);
        progress = backup.step(100);
      }
      
      backup.close();
    });

    // Get file info
    const stats = statSync(backupPath);
    
    const backupInfo: BackupInfo = {
      filename,
      path: backupPath,
      size: stats.size,
      createdAt: new Date(),
      type,
    };

    // Clean up old backups
    await this.cleanupOldBackups();

    console.log(`✅ Database backup created: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    
    return backupInfo;
  }

  /**
   * Create compressed backup using gzip
   */
  async createCompressedBackup(type: 'manual' | 'scheduled' | 'wal' = 'manual'): Promise<BackupInfo> {
    const backupInfo = await this.createBackup(type);
    
    try {
      // Compress the backup file
      const compressedPath = `${backupInfo.path}.gz`;
      await execAsync(`gzip -${this.compressionLevel} "${backupInfo.path}"`);
      
      // Update backup info
      const stats = statSync(compressedPath);
      backupInfo.filename = backupInfo.filename + '.gz';
      backupInfo.path = compressedPath;
      backupInfo.size = stats.size;

      const compressionRatio = ((1 - stats.size / statSync(backupInfo.path.replace('.gz', '')).size) * 100).toFixed(1);
      console.log(`✅ Backup compressed: ${compressionRatio}% size reduction`);
      
      return backupInfo;
    } catch (error) {
      console.error('Failed to compress backup:', error);
      return backupInfo;
    }
  }

  /**
   * List all available backups
   */
  async listBackups(): Promise<BackupInfo[]> {
    const files = readdirSync(this.backupDir)
      .filter(file => file.startsWith('backup_') && (file.endsWith('.db') || file.endsWith('.db.gz')))
      .sort((a, b) => b.localeCompare(a)); // Sort by date (newest first)

    const backups: BackupInfo[] = [];

    for (const filename of files) {
      const filePath = path.join(this.backupDir, filename);
      const stats = statSync(filePath);
      
      // Parse backup info from filename
      const match = filename.match(/backup_(.+)_([^.]+)\.db(\.gz)?/);
      const type = match?.[2] as 'manual' | 'scheduled' | 'wal' || 'manual';
      
      backups.push({
        filename,
        path: filePath,
        size: stats.size,
        createdAt: stats.birthtime,
        type,
      });
    }

    return backups;
  }

  /**
   * Restore database from backup
   */
  async restoreFromBackup(backupPath: string, options: RestoreOptions = {}): Promise<void> {
    if (!existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    // Decompress if needed
    let sourceBackupPath = backupPath;
    if (backupPath.endsWith('.gz')) {
      const decompressedPath = backupPath.replace('.gz', '');
      await execAsync(`gunzip -c "${backupPath}" > "${decompressedPath}"`);
      sourceBackupPath = decompressedPath;
    }

    // Validate backup integrity
    if (!options.skipValidation) {
      await this.validateBackup(sourceBackupPath);
    }

    // Get current database path
    const currentDbPath = process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), 'data', 'zapdev.db')
      : path.join(process.cwd(), 'data', 'zapdev_restore.db');

    // Create backup of current database before restore
    if (existsSync(currentDbPath) && options.createCheckpoint) {
      const preRestoreBackup = currentDbPath + '.pre-restore';
      copyFileSync(currentDbPath, preRestoreBackup);
      console.log(`Created pre-restore backup: ${preRestoreBackup}`);
    }

    // Restore database
    await withDatabase(async (db) => {
      // Close all connections
      db.close();
      
      // Copy backup file to current database location
      copyFileSync(sourceBackupPath, currentDbPath);
      
      console.log(`✅ Database restored from backup: ${path.basename(backupPath)}`);
    });

    // Clean up decompressed file if we created it
    if (backupPath.endsWith('.gz') && existsSync(sourceBackupPath)) {
      unlinkSync(sourceBackupPath);
    }
  }

  /**
   * Validate backup file integrity
   */
  async validateBackup(backupPath: string): Promise<boolean> {
    try {
      const testDb = new Database(backupPath, { readonly: true });
      
      // Run integrity check
      const result = testDb.pragma('integrity_check');
      testDb.close();
      
      if (result[0]?.integrity_check !== 'ok') {
        throw new Error(`Backup integrity check failed: ${JSON.stringify(result)}`);
      }
      
      console.log(`✅ Backup integrity check passed: ${path.basename(backupPath)}`);
      return true;
    } catch (error) {
      console.error(`❌ Backup validation failed:`, error);
      return false;
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  private async cleanupOldBackups(): Promise<void> {
    const backups = await this.listBackups();
    
    if (backups.length <= this.maxBackups) {
      return;
    }

    const backupsToDelete = backups.slice(this.maxBackups);
    
    for (const backup of backupsToDelete) {
      try {
        unlinkSync(backup.path);
        console.log(`Deleted old backup: ${backup.filename}`);
      } catch (error) {
        console.error(`Failed to delete backup ${backup.filename}:`, error);
      }
    }
  }

  /**
   * Schedule automatic backups
   */
  startAutomaticBackup(intervalHours: number = 24): NodeJS.Timeout {
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    return setInterval(async () => {
      try {
        console.log('Starting scheduled backup...');
        await this.createCompressedBackup('scheduled');
        console.log('Scheduled backup completed successfully');
      } catch (error) {
        console.error('Scheduled backup failed:', error);
      }
    }, intervalMs);
  }

  /**
   * Export database to SQL dump
   */
  async exportToSQL(outputPath?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = outputPath || path.join(this.backupDir, `export_${timestamp}.sql`);

    await withDatabase(async (db) => {
      // Get all table schemas
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
      
      let sqlDump = `-- SQLite Database Export\n-- Generated on ${new Date().toISOString()}\n\n`;
      sqlDump += `PRAGMA foreign_keys = ON;\n\n`;

      // Export each table
      for (const table of tables) {
        if (table.name.startsWith('sqlite_') || table.name === '_migrations') {
          continue; // Skip system tables
        }

        // Get table schema
        const schema = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${table.name}'`).get() as { sql: string };
        sqlDump += `${schema.sql};\n\n`;

        // Get table data
        const rows = db.prepare(`SELECT * FROM ${table.name}`).all();
        
        if (rows.length > 0) {
          // Generate INSERT statements
          const columns = Object.keys(rows[0]);
          const columnNames = columns.join(', ');
          
          for (const row of rows) {
            const values = columns.map(col => {
              const value = (row as any)[col];
              if (value === null) return 'NULL';
              if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
              return value;
            }).join(', ');
            
            sqlDump += `INSERT INTO ${table.name} (${columnNames}) VALUES (${values});\n`;
          }
          
          sqlDump += '\n';
        }
      }
      
      // Write to file
      writeFileSync(filename, sqlDump);
    });

    console.log(`✅ Database exported to SQL: ${filename}`);
    return filename;
  }
}

// Global backup manager instance
let globalBackupManager: DatabaseBackupManager | undefined;

export function getBackupManager(options?: BackupOptions): DatabaseBackupManager {
  if (!globalBackupManager) {
    globalBackupManager = new DatabaseBackupManager(options);
  }
  return globalBackupManager;
}