import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';

export async function GET() {
  try {
    const db = getDatabase();
    
    // Get all tables
    const tablesResult = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all();
    
    const tables = [];
    
    for (const tableRow of tablesResult) {
      const tableName = (tableRow as any).name;
      
      // Get column information
      const columnsResult = db.prepare(`PRAGMA table_info(${tableName})`).all();
      const columns = columnsResult.map((col: any) => ({
        name: col.name,
        type: col.type,
        nullable: !col.notnull,
        primaryKey: !!col.pk,
        defaultValue: col.dflt_value
      }));
      
      // Get row count
      const countResult = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
      const rowCount = (countResult as any)?.count || 0;
      
      tables.push({
        name: tableName,
        columns,
        rowCount
      });
    }
    
    return NextResponse.json({ tables });
  } catch (error) {
    console.error('Database tables error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to get tables',
        tables: []
      },
      { status: 500 }
    );
  }
}
