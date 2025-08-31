import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { schema } from './schema';
import path from 'path';
import { performance } from 'perf_hooks';

interface DatabasePool {
  acquire(): Database.Database;
  release(db: Database.Database): void;
  destroy(): void;
  stats(): PoolStats;
}

interface PoolStats {
  size: number;
  available: number;
  pending: number;
  borrowed: number;
}

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

class SQLitePool implements DatabasePool {
  private pool: Database.Database[] = [];
  private borrowed: Set<Database.Database> = new Set();
  private readonly maxSize: number;
  private readonly minSize: number;
  private readonly dbPath: string;
  private readonly options: Database.Options;
  private metrics: QueryMetrics[] = [];
  private readonly maxMetricsSize = 1000;

  constructor(options: {
    maxSize?: number;
    minSize?: number;
    dbPath?: string;
    dbOptions?: Database.Options;
  } = {}) {
    this.maxSize = options.maxSize || 10;
    this.minSize = options.minSize || 2;
    this.dbPath = options.dbPath || (process.env.NODE_ENV === 'production' 
      ? path.join(process.cwd(), 'data', 'zapdev.db')
      : ':memory:');
    this.options = {
      verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
      ...options.dbOptions,
    };

    // Initialize minimum connections
    for (let i = 0; i < this.minSize; i++) {
      this.pool.push(this.createConnection());
    }
  }

  private createConnection(): Database.Database {
    const db = new Database(this.dbPath, this.options);
    
    // Optimize SQLite settings for performance
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = 10000');
    db.pragma('temp_store = MEMORY');
    db.pragma('mmap_size = 268435456'); // 256MB
    db.pragma('optimize');
    
    // Set up connection-level settings
    db.exec(`
      PRAGMA busy_timeout = 30000;
      PRAGMA foreign_keys = ON;
      PRAGMA locking_mode = NORMAL;
    `);

    return db;
  }

  acquire(): Database.Database {
    // Try to get available connection from pool
    if (this.pool.length > 0) {
      const db = this.pool.pop()!;
      this.borrowed.add(db);
      return db;
    }

    // Create new connection if under max size
    if (this.borrowed.size < this.maxSize) {
      const db = this.createConnection();
      this.borrowed.add(db);
      return db;
    }

    // Pool exhausted - this should be handled with proper queuing in production
    throw new Error(`Database pool exhausted. Max connections: ${this.maxSize}`);
  }

  release(db: Database.Database): void {
    if (this.borrowed.has(db)) {
      this.borrowed.delete(db);
      
      // Return to pool if under min size, otherwise close
      if (this.pool.length < this.minSize) {
        this.pool.push(db);
      } else {
        try {
          db.close();
        } catch (error) {
          console.error('Error closing database connection:', error);
        }
      }
    }
  }

  destroy(): void {
    // Close all pooled connections
    for (const db of this.pool) {
      try {
        db.close();
      } catch (error) {
        console.error('Error closing pooled connection:', error);
      }
    }
    this.pool = [];

    // Close all borrowed connections
    for (const db of this.borrowed) {
      try {
        db.close();
      } catch (error) {
        console.error('Error closing borrowed connection:', error);
      }
    }
    this.borrowed.clear();
  }

  stats(): PoolStats {
    return {
      size: this.pool.length + this.borrowed.size,
      available: this.pool.length,
      pending: 0, // SQLite doesn't have pending connections
      borrowed: this.borrowed.size,
    };
  }

  // Add query metrics tracking
  recordQuery(query: string, duration: number, success: boolean, error?: string): void {
    const metric: QueryMetrics = {
      query: query.substring(0, 100), // Limit query length for storage
      duration,
      timestamp: new Date(),
      success,
      error,
    };

    this.metrics.push(metric);

    // Keep metrics array under max size
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.maxMetricsSize / 2);
    }
  }

  getMetrics(): QueryMetrics[] {
    return [...this.metrics];
  }

  getSlowQueries(thresholdMs: number = 100): QueryMetrics[] {
    return this.metrics.filter(m => m.duration > thresholdMs);
  }
}

// Global pool instance
let globalPool: SQLitePool | undefined;

export function getPool(): SQLitePool {
  if (!globalPool) {
    globalPool = new SQLitePool({
      maxSize: parseInt(process.env.DB_POOL_MAX_SIZE || '10'),
      minSize: parseInt(process.env.DB_POOL_MIN_SIZE || '2'),
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('Closing database pool...');
      globalPool?.destroy();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('Closing database pool...');
      globalPool?.destroy();
      process.exit(0);
    });
  }

  return globalPool;
}

// Enhanced database connection with pooling and monitoring
export function withDatabase<T>(
  operation: (db: Database.Database) => T | Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const pool = getPool();
    const db = pool.acquire();
    const startTime = performance.now();

    try {
      const result = await operation(db);
      const duration = performance.now() - startTime;
      
      pool.recordQuery('database_operation', duration, true);
      resolve(result);
    } catch (error) {
      const duration = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      pool.recordQuery('database_operation', duration, false, errorMessage);
      reject(error);
    } finally {
      pool.release(db);
    }
  });
}

// Enhanced Drizzle instance with connection pooling
export function withDrizzle<T>(
  operation: (drizzle: ReturnType<typeof drizzle>) => T | Promise<T>
): Promise<T> {
  return withDatabase(async (db) => {
    const drizzleDb = drizzle(db, { schema });
    return await operation(drizzleDb);
  });
}

export { SQLitePool, type QueryMetrics, type PoolStats };