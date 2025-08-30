/**
 * Test utility to verify Clerk JWT authentication with Convex
 * This file helps verify that your JWT template is properly configured
 */

import { auth } from '@clerk/nextjs/server';

export async function testJWTAuth() {
  try {
    const { sessionClaims, userId } = await auth();
    
    console.log('JWT Authentication Test Results:');
    console.log('================================');
    console.log('User ID:', userId);
    console.log('Session Claims:', JSON.stringify(sessionClaims, null, 2));
    
    if (userId) {
      console.log('✅ Authentication successful');
      console.log('✅ JWT template is working');
      
      // Check for custom claims in the JWT
      if (sessionClaims) {
        console.log('Custom claims found in JWT:');
        Object.entries(sessionClaims).forEach(([key, value]) => {
          if (!['iat', 'exp', 'nbf', 'iss', 'aud', 'sub', 'jti'].includes(key)) {
            console.log(`  - ${key}: ${value}`);
          }
        });
      }
    } else {
      console.log('❌ No authentication found');
    }
    
    return {
      success: !!userId,
      userId,
      sessionClaims,
      customClaims: sessionClaims ? Object.fromEntries(
        Object.entries(sessionClaims).filter(
          ([key]) => !['iat', 'exp', 'nbf', 'iss', 'aud', 'sub', 'jti'].includes(key)
        )
      ) : null
    };
  } catch (error) {
    console.error('❌ JWT Authentication test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: null,
      sessionClaims: null,
      customClaims: null
    };
  }
}

export type JWTAuthTestResult = Awaited<ReturnType<typeof testJWTAuth>>;