import { NextResponse } from 'next/server';
import { initializeDatabase, seedDatabase } from '@/lib/database/connection';

export async function POST() {
  try {
    // Initialize database schema
    await initializeDatabase();
    
    // Seed with sample data
    await seedDatabase();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully with sample data' 
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to initialize database' 
      },
      { status: 500 }
    );
  }
}
