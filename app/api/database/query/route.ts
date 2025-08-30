import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }
    
    const db = getDatabase();
    const trimmedQuery = query.trim();
    
    // Security: Only allow safe operations
    const forbiddenPatterns = [
      /ATTACH\s+DATABASE/i,
      /DETACH\s+DATABASE/i,
      /PRAGMA\s+(?!table_info|foreign_keys)/i,
      /\.backup/i,
      /\.restore/i,
      /\.dump/i,
      /\.read/i,
      /\.output/i,
      /\.shell/i,
      /\.system/i,
    ];
    
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(trimmedQuery)) {
        return NextResponse.json(
          { error: 'Query contains forbidden operations' },
          { status: 403 }
        );
      }
    }
    
    // Determine if this is a SELECT query or a modification query
    const isSelect = /^\s*SELECT/i.test(trimmedQuery);
    const isShow = /^\s*PRAGMA\s+table_info/i.test(trimmedQuery);
    
    try {
      if (isSelect || isShow) {
        // Handle SELECT queries
        const stmt = db.prepare(trimmedQuery);
        const rows = stmt.all();
        
        // Get column names from the first row or statement info
        let columns: string[] = [];
        if (rows.length > 0 && rows[0] && typeof rows[0] === 'object') {
          columns = Object.keys(rows[0] as Record<string, unknown>);
        } else {
          // Try to get column info from the prepared statement
          try {
            const info = stmt.columns();
            columns = info.map(col => col.name);
          } catch {
            columns = [];
          }
        }
        
        return NextResponse.json({
          columns,
          rows,
          success: true
        });
      } else {
        // Handle INSERT, UPDATE, DELETE, CREATE, etc.
        const stmt = db.prepare(trimmedQuery);
        const result = stmt.run();
        
        return NextResponse.json({
          columns: [],
          rows: [],
          rowsAffected: result.changes,
          lastInsertRowid: result.lastInsertRowid,
          success: true
        });
      }
    } catch (sqlError) {
      return NextResponse.json(
        { 
          error: sqlError instanceof Error ? sqlError.message : 'SQL execution failed',
          columns: [],
          rows: []
        },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Query execution failed',
        columns: [],
        rows: []
      },
      { status: 500 }
    );
  }
}
