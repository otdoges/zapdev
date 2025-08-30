import { NextResponse } from 'next/server';
import { testJWTAuth } from '@/lib/test-jwt-auth';

export async function GET() {
  try {
    const result = await testJWTAuth();
    
    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? 'JWT authentication is working correctly' 
        : 'JWT authentication failed',
      data: {
        userId: result.userId,
        hasCustomClaims: result.customClaims ? Object.keys(result.customClaims).length > 0 : false,
        customClaims: result.customClaims,
        allSessionClaims: result.sessionClaims
      },
      error: result.error || null
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to test JWT authentication',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}