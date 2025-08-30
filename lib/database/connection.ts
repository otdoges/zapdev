import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { schema } from './schema';
import path from 'path';

// Global database instance for serverless environments
let globalDb: Database.Database | undefined;
let globalDrizzle: ReturnType<typeof drizzle> | undefined;

export function getDatabase() {
  if (!globalDb) {
    // Use in-memory database for development, persistent for production
    const dbPath = process.env.NODE_ENV === 'production' 
      ? path.join(process.cwd(), 'data', 'zapdev.db')
      : ':memory:';
    
    globalDb = new Database(dbPath);
    
    // Enable WAL mode for better performance
    if (process.env.NODE_ENV === 'production') {
      globalDb.pragma('journal_mode = WAL');
    }
  }
  
  return globalDb;
}

export function getDrizzle() {
  if (!globalDrizzle) {
    const db = getDatabase();
    globalDrizzle = drizzle(db, { schema });
  }
  
  return globalDrizzle;
}

// Initialize database with schema
export async function initializeDatabase() {
  const db = getDatabase();
  
  // Create tables using raw SQL for now
  // In production, you'd use Drizzle migrations
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      avatar TEXT,
      role TEXT DEFAULT 'user',
      is_active INTEGER DEFAULT 1,
      created_at INTEGER,
      updated_at INTEGER
    )
  `;
  
  const createPostsTable = `
    CREATE TABLE IF NOT EXISTS posts (
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
    )
  `;
  
  const createCommentsTable = `
    CREATE TABLE IF NOT EXISTS comments (
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
    )
  `;
  
  const createProductsTable = `
    CREATE TABLE IF NOT EXISTS products (
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
    )
  `;
  
  const createOrdersTable = `
    CREATE TABLE IF NOT EXISTS orders (
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
    )
  `;
  
  const createOrderItemsTable = `
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      product_id TEXT,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      created_at INTEGER,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `;
  
  const createAnalyticsEventsTable = `
    CREATE TABLE IF NOT EXISTS analytics_events (
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
    )
  `;
  
  // Execute table creation
  db.exec(createUsersTable);
  db.exec(createPostsTable);
  db.exec(createCommentsTable);
  db.exec(createProductsTable);
  db.exec(createOrdersTable);
  db.exec(createOrderItemsTable);
  db.exec(createAnalyticsEventsTable);
  
  return true;
}

// Seed database with sample data
export async function seedDatabase() {
  const drizzle = getDrizzle();
  
  try {
    // Insert sample users
    await drizzle.insert(schema.users).values([
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
    ]).onConflictDoNothing();

    // Insert sample products
    await drizzle.insert(schema.products).values([
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
      }
    ]).onConflictDoNothing();
    
    console.log('Database seeded successfully');
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    return false;
  }
}
