import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export type UserRole = 'user' | 'admin' | 'developer';

export interface AdminUser {
  userId: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

// Admin user IDs - this should be moved to environment variables in production
const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(',') || [];
const DEVELOPER_USER_IDS = process.env.DEVELOPER_USER_IDS?.split(',') || [];

/**
 * Check if a user has admin privileges
 */
export async function isAdmin(userId?: string): Promise<boolean> {
  if (!userId) return false;
  
  try {
    const user = await clerkClient().users.getUser(userId);
    const role = getUserRole(userId, user.emailAddresses[0]?.emailAddress);
    return role === 'admin' || role === 'developer';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Check if a user has developer privileges
 */
export async function isDeveloper(userId?: string): Promise<boolean> {
  if (!userId) return false;
  
  try {
    const user = await clerkClient().users.getUser(userId);
    const role = getUserRole(userId, user.emailAddresses[0]?.emailAddress);
    return role === 'developer';
  } catch (error) {
    console.error('Error checking developer status:', error);
    return false;
  }
}

/**
 * Get user role based on ID and email
 */
export function getUserRole(userId: string, email?: string): UserRole {
  // Check if user is in admin/developer lists
  if (ADMIN_USER_IDS.includes(userId)) return 'admin';
  if (DEVELOPER_USER_IDS.includes(userId)) return 'developer';
  
  // Check by email domain for development
  if (email && (
    email.endsWith('@zapdev.com') || 
    email.endsWith('@lovable.dev') ||
    email.endsWith('@admin.zapdev.com')
  )) {
    return email.includes('dev') ? 'developer' : 'admin';
  }
  
  return 'user';
}

/**
 * Get user permissions based on role
 */
export function getUserPermissions(role: UserRole): string[] {
  switch (role) {
    case 'developer':
      return [
        'admin.read',
        'admin.write',
        'admin.orchestration',
        'admin.monitoring',
        'admin.system',
        'admin.users',
        'admin.analytics',
        'admin.debug'
      ];
    case 'admin':
      return [
        'admin.read',
        'admin.write',
        'admin.orchestration',
        'admin.monitoring',
        'admin.system',
        'admin.users',
        'admin.analytics'
      ];
    case 'user':
    default:
      return ['user.read', 'user.write'];
  }
}

/**
 * Require admin authentication for API routes
 */
export async function requireAdmin(): Promise<AdminUser> {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized: No user session');
  }
  
  if (!await isAdmin(userId)) {
    throw new Error('Forbidden: Admin access required');
  }
  
  try {
    const user = await clerkClient().users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress;
    const role = getUserRole(userId, email);
    const permissions = getUserPermissions(role);
    
    return {
      userId,
      email: email || '',
      role,
      permissions
    };
  } catch (error) {
    throw new Error('Error fetching admin user details');
  }
}

/**
 * Require admin authentication for page components
 */
export async function requireAdminAccess(): Promise<AdminUser> {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in?redirectUrl=/admin');
  }
  
  if (!await isAdmin(userId)) {
    redirect('/');
  }
  
  try {
    const user = await clerkClient().users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress;
    const role = getUserRole(userId, email);
    const permissions = getUserPermissions(role);
    
    return {
      userId,
      email: email || '',
      role,
      permissions
    };
  } catch (error) {
    redirect('/sign-in?redirectUrl=/admin');
  }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(user: AdminUser, permission: string): boolean {
  return user.permissions.includes(permission);
}

/**
 * Admin middleware for protecting routes
 */
export function createAdminMiddleware(requiredPermission?: string) {
  return async (req: Request, context: any) => {
    try {
      const adminUser = await requireAdmin();
      
      if (requiredPermission && !hasPermission(adminUser, requiredPermission)) {
        return new Response(JSON.stringify({ 
          error: 'Insufficient permissions',
          required: requiredPermission 
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Add admin user to context
      context.adminUser = adminUser;
      return null; // Continue to handler
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      }), {
        status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
}