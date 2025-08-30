/**
 * Global type definitions for Clerk JWT custom claims
 */

// Extend Clerk's CustomJwtSessionClaims interface to include your custom claims
interface CustomJwtSessionClaims {
  // Add your custom claims here based on your JWT template
  // Example custom claims:
  fullName?: string;
  primaryEmail?: string;
  username?: string;
  imageUrl?: string;
  
  // Add any other custom claims you have in your Clerk JWT template
  // These will be available in sessionClaims throughout your app
}

// Extend the global Convex Auth interface for better typing in Convex functions
declare global {
  namespace Convex {
    interface UserIdentity {
      tokenIdentifier: string;
      subject: string;
      issuer: string;
      // Custom claims will be available here as well
      name?: string;
      email?: string;
      picture?: string;
      given_name?: string;
      family_name?: string;
      nickname?: string;
    }
  }
}

export {};