import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { schema } from './schema';
import { getMigrationManager } from './migrations';
import { getBackupManager } from './backup';
import path from 'path';

// Re-export enhanced database functions
export { getMigrationManager };
export { getBackupManager };

// Direct database connection for Drizzle use
function createConnection(): Database.Database {
  const dbPath = process.env.NODE_ENV === 'production' 
    ? path.join(process.cwd(), 'data', 'zapdev.db')
    : ':memory:';
    
  const db = new Database(dbPath, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
  });
  
  // Optimize SQLite settings
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = 10000');
  db.pragma('foreign_keys = ON');
  
  return db;
}

let dbInstance: Database.Database | null = null;

export function getDatabase() {
  if (!dbInstance) {
    dbInstance = createConnection();
  }
  return dbInstance;
}

export function getDrizzle() {
  const db = getDatabase();
  return drizzle(db, { schema });
}

// Simple database operation wrapper
export async function withDatabase<T>(
  operation: (db: Database.Database) => T | Promise<T>
): Promise<T> {
  const db = getDatabase();
  return await operation(db);
}

// Simple Drizzle operation wrapper
export async function withDrizzle<T>(
  operation: (drizzle: ReturnType<typeof drizzle>) => T | Promise<T>
): Promise<T> {
  const drizzleDb = getDrizzle();
  return await operation(drizzleDb);
}

// Enhanced database initialization with migrations and indexing
export async function initializeDatabase() {
  try {
    console.log('🚀 Initializing database...');
    
    // Initialize migration system first
    const migrationManager = getMigrationManager();
    await migrationManager.initializeMigrationTable();
    
    // Check if we need to run migrations
    const migrationStatus = await migrationManager.status();
    
    if (migrationStatus.pending.length > 0) {
      console.log(`📋 Found ${migrationStatus.pending.length} pending migrations`);
      const result = await migrationManager.migrate();
      console.log(`✅ Executed ${result.executed.length} migrations`);
    } else {
      console.log('📋 No pending migrations');
    }
    
    // Create tables and indexes using enhanced connection management
    await withDatabase(async (db) => {
      // Create tables with optimized schema
      const tables = [
        {
          name: 'users',
          sql: `CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            avatar TEXT,
            role TEXT DEFAULT 'user',
            is_active INTEGER DEFAULT 1,
            created_at INTEGER,
            updated_at INTEGER
          )`
        },
        {
          name: 'posts',
          sql: `CREATE TABLE IF NOT EXISTS posts (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT,
            author_id TEXT,
            status TEXT DEFAULT 'draft',
            tags TEXT,
            view_count INTEGER DEFAULT 0,
            like_count INTEGER DEFAULT 0,
            created_at INTEGER,
            updated_at INTEGER,
            FOREIGN KEY (author_id) REFERENCES users(id)
          )`
        },
        {
          name: 'comments',
          sql: `CREATE TABLE IF NOT EXISTS comments (
            id TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            post_id TEXT,
            author_id TEXT,
            parent_id TEXT,
            is_approved INTEGER DEFAULT 0,
            created_at INTEGER,
            updated_at INTEGER,
            FOREIGN KEY (post_id) REFERENCES posts(id),
            FOREIGN KEY (author_id) REFERENCES users(id)
          )`
        },
        {
          name: 'products',
          sql: `CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            currency TEXT DEFAULT 'USD',
            sku TEXT UNIQUE,
            stock INTEGER DEFAULT 0,
            category TEXT,
            images TEXT,
            is_active INTEGER DEFAULT 1,
            created_at INTEGER,
            updated_at INTEGER
          )`
        },
        {
          name: 'orders',
          sql: `CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            status TEXT DEFAULT 'pending',
            total_amount REAL NOT NULL,
            currency TEXT DEFAULT 'USD',
            shipping_address TEXT,
            billing_address TEXT,
            payment_method TEXT,
            payment_status TEXT DEFAULT 'pending',
            notes TEXT,
            created_at INTEGER,
            updated_at INTEGER,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )`
        },
        {
          name: 'order_items',
          sql: `CREATE TABLE IF NOT EXISTS order_items (
            id TEXT PRIMARY KEY,
            order_id TEXT,
            product_id TEXT,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            total_price REAL NOT NULL,
            created_at INTEGER,
            FOREIGN KEY (order_id) REFERENCES orders(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
          )`
        },
        {
          name: 'analytics_events',
          sql: `CREATE TABLE IF NOT EXISTS analytics_events (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            event_name TEXT NOT NULL,
            event_data TEXT,
            session_id TEXT,
            user_agent TEXT,
            ip_address TEXT,
            referrer TEXT,
            created_at INTEGER,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )`
        }
      ];
      
      // Create all tables
      for (const table of tables) {
        db.exec(table.sql);
        console.log(`✅ Table '${table.name}' created/verified`);
      }
      
      // Create performance indexes
      await createPerformanceIndexes(db);
    });
    
    console.log('🎉 Database initialization completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Create indexes for better query performance
async function createPerformanceIndexes(db: Database.Database) {
  const indexes = [
    // Users indexes
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
    'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)',
    
    // Posts indexes
    'CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id)',
    'CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status)',
    'CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_posts_status_created_at ON posts(status, created_at)',
    
    // Comments indexes
    'CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)',
    'CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id)',
    'CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id)',
    'CREATE INDEX IF NOT EXISTS idx_comments_is_approved ON comments(is_approved)',
    
    // Products indexes
    'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)',
    'CREATE INDEX IF NOT EXISTS idx_products_price ON products(price)',
    'CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active)',
    'CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category, is_active)',
    
    // Orders indexes
    'CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
    'CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status)',
    
    // Order items indexes
    'CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)',
    'CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id)',
    
    // Analytics indexes
    'CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON analytics_events(event_name)',
    'CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics_events(session_id)',
    'CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_analytics_event_created ON analytics_events(event_name, created_at)',
  ];
  
  for (const indexSql of indexes) {
    try {
      db.exec(indexSql);
    } catch (error) {
      console.warn(`Warning: Could not create index: ${indexSql}`, error);
    }
  }
  
  console.log(`✅ Created ${indexes.length} performance indexes`);
}

// Enhanced database seeding with better error handling
export async function seedDatabase() {
  return withDrizzle(async (drizzle) => {
    try {
      console.log('🌱 Seeding database with sample data...');
      
      // Insert sample users
      const users = await drizzle.insert(schema.users).values([
        {
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'admin',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=32&h=32&fit=crop&crop=face',
        },
        {
          name: 'Bob Johnson',
          email: 'bob@example.com',
          role: 'moderator',
        }
      ]).onConflictDoNothing().returning();
      
      console.log(`✅ Inserted ${users.length} sample users`);

      // Insert sample products
      const products = await drizzle.insert(schema.products).values([
        {
          name: 'MacBook Pro 14"',
          description: 'Apple MacBook Pro with M3 chip',
          price: 1999.99,
          sku: 'MBP-14-M3',
          stock: 10,
          category: 'Electronics',
          images: JSON.stringify(['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400']),
        },
        {
          name: 'iPhone 15 Pro',
          description: 'Latest iPhone with titanium design',
          price: 999.99,
          sku: 'IP15-PRO',
          stock: 25,
          category: 'Electronics',
          images: JSON.stringify(['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400']),
        },
        {
          name: 'Development Tools Bundle',
          description: 'Essential tools for modern development',
          price: 299.99,
          sku: 'DEV-TOOLS-2024',
          stock: 50,
          category: 'Software',
          images: JSON.stringify(['https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400']),
        }
      ]).onConflictDoNothing().returning();
      
      console.log(`✅ Inserted ${products.length} sample products`);
      
      console.log('🎉 Database seeding completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Error seeding database:', error);
      throw error;
    }
  });
}

// Database health check
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  details: {
    connection: boolean;
    integrity: boolean;
    performance: {
      queryTime: number;
      poolStats: any;
    };
  };
}> {
  try {
    const startTime = performance.now();
    
    // Test basic connectivity and integrity
    const results = await withDatabase(async (db) => {
      // Test basic query
      const testResult = db.prepare('SELECT 1 as test').get();
      
      // Run integrity check
      const integrityResult = db.pragma('integrity_check');
      
      return {
        connection: testResult?.test === 1,
        integrity: integrityResult[0]?.integrity_check === 'ok'
      };
    });
    
    const queryTime = performance.now() - startTime;
    
    return {
      healthy: results.connection && results.integrity,
      details: {
        ...results,
        performance: {
          queryTime,
          poolStats: null
        }
      }
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      healthy: false,
      details: {
        connection: false,
        integrity: false,
        performance: {
          queryTime: -1,
          poolStats: null
        }
      }
    };
  }
}

// Database statistics and monitoring
export async function getDatabaseStats(): Promise<{
  tables: { name: string; rowCount: number; size: string }[];
  indexes: { name: string; table: string }[];
  performance: {
    slowQueries: any[];
    poolStats: any;
    cacheHitRatio?: number;
  };
}> {
  return withDatabase(async (db) => {
    // Get table information
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    const tableStats = [];
    
    for (const table of tables) {
      if (table.name.startsWith('sqlite_')) continue;
      
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as { count: number };
      const size = db.prepare(`SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()`).get() as { size: number };
      
      tableStats.push({
        name: table.name,
        rowCount: count.count,
        size: `${(size.size / 1024 / 1024).toFixed(2)} MB`
      });
    }
    
    // Get index information
    const indexes = db.prepare(`
      SELECT name, tbl_name as 'table' 
      FROM sqlite_master 
      WHERE type='index' AND name NOT LIKE 'sqlite_%'
    `).all() as { name: string; table: string }[];
    
    return {
      tables: tableStats,
      indexes,
      performance: {
        slowQueries: [],
        poolStats: null
      }
    };
  });
}