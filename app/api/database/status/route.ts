import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';

export async function GET() {
  try {
    const db = getDatabase();
    
    // Check if tables exist
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();
    
    const initialized = tables.length > 0;
    
    return NextResponse.json({ 
      initialized,
      tables: tables.map(t => (t as any).name),
      database: process.env.NODE_ENV === 'production' ? 'persistent' : 'memory'
    });
  } catch (error) {
    console.error('Database status error:', error);
    return NextResponse.json(
      { 
        initialized: false, 
        error: error instanceof Error ? error.message : 'Database status check failed' 
      },
      { status: 500 }
    );
  }
}
