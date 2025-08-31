import { AdminUser } from './admin-auth';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
}

export type AuditAction = 
  | 'admin.login'
  | 'admin.logout'
  | 'orchestration.job.create'
  | 'orchestration.job.start'
  | 'orchestration.job.pause'
  | 'orchestration.job.cancel'
  | 'orchestration.job.view'
  | 'ai_system.process'
  | 'ai_system.model_change'
  | 'monitoring.view_dashboard'
  | 'monitoring.view_metrics'
  | 'monitoring.configure_alerts'
  | 'performance.apply_recommendation'
  | 'performance.view_stats'
  | 'feature_flags.update'
  | 'feature_flags.toggle'
  | 'user_management.view'
  | 'user_management.role_change'
  | 'system.settings_change';

// In-memory storage for demo purposes - in production, use a database
const auditLogs: AuditLogEntry[] = [];

/**
 * Create a new audit log entry
 */
export function logAdminAction(
  admin: AdminUser,
  action: AuditAction,
  resource: string,
  options: {
    resourceId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
    error?: string;
  } = {}
): AuditLogEntry {
  const logEntry: AuditLogEntry = {
    id: generateLogId(),
    timestamp: new Date(),
    userId: admin.userId,
    userEmail: admin.email,
    userRole: admin.role,
    action,
    resource,
    resourceId: options.resourceId,
    details: options.details,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
    success: options.success !== false, // Default to true unless explicitly false
    error: options.error
  };
  
  // Store the log entry
  auditLogs.push(logEntry);
  
  // Log to console for development
  console.log(`[AUDIT] ${admin.email} (${admin.role}) performed ${action} on ${resource}`, {
    success: logEntry.success,
    resourceId: options.resourceId,
    error: options.error
  });
  
  // In production, you would also:
  // - Store in database
  // - Send to external logging service
  // - Trigger alerts for critical actions
  
  return logEntry;
}

/**
 * Log admin authentication events
 */
export function logAdminAuth(
  admin: AdminUser,
  action: 'admin.login' | 'admin.logout',
  ipAddress?: string,
  userAgent?: string
): AuditLogEntry {
  return logAdminAction(admin, action, 'authentication', {
    ipAddress,
    userAgent,
    details: {
      timestamp: new Date().toISOString(),
      permissions: admin.permissions
    }
  });
}

/**
 * Log orchestration operations
 */
export function logOrchestrationAction(
  admin: AdminUser,
  action: 'orchestration.job.create' | 'orchestration.job.start' | 'orchestration.job.pause' | 'orchestration.job.cancel' | 'orchestration.job.view',
  jobId: string,
  details?: Record<string, any>
): AuditLogEntry {
  return logAdminAction(admin, action, 'orchestration_job', {
    resourceId: jobId,
    details
  });
}

/**
 * Log AI system operations
 */
export function logAISystemAction(
  admin: AdminUser,
  action: 'ai_system.process' | 'ai_system.model_change',
  details: Record<string, any>
): AuditLogEntry {
  return logAdminAction(admin, action, 'ai_system', {
    details
  });
}

/**
 * Log feature flag changes
 */
export function logFeatureFlagAction(
  admin: AdminUser,
  action: 'feature_flags.update' | 'feature_flags.toggle',
  flagKey: string,
  details: Record<string, any>
): AuditLogEntry {
  return logAdminAction(admin, action, 'feature_flag', {
    resourceId: flagKey,
    details
  });
}

/**
 * Log monitoring access
 */
export function logMonitoringAction(
  admin: AdminUser,
  action: 'monitoring.view_dashboard' | 'monitoring.view_metrics' | 'monitoring.configure_alerts',
  details?: Record<string, any>
): AuditLogEntry {
  return logAdminAction(admin, action, 'monitoring', {
    details
  });
}

/**
 * Log performance optimization actions
 */
export function logPerformanceAction(
  admin: AdminUser,
  action: 'performance.apply_recommendation' | 'performance.view_stats',
  details: Record<string, any>
): AuditLogEntry {
  return logAdminAction(admin, action, 'performance', {
    details
  });
}

/**
 * Get audit logs with filtering options
 */
export function getAuditLogs(options: {
  userId?: string;
  action?: AuditAction;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
  limit?: number;
} = {}): AuditLogEntry[] {
  let filtered = [...auditLogs];
  
  if (options.userId) {
    filtered = filtered.filter(log => log.userId === options.userId);
  }
  
  if (options.action) {
    filtered = filtered.filter(log => log.action === options.action);
  }
  
  if (options.resource) {
    filtered = filtered.filter(log => log.resource === options.resource);
  }
  
  if (options.startDate) {
    filtered = filtered.filter(log => log.timestamp >= options.startDate!);
  }
  
  if (options.endDate) {
    filtered = filtered.filter(log => log.timestamp <= options.endDate!);
  }
  
  if (options.success !== undefined) {
    filtered = filtered.filter(log => log.success === options.success);
  }
  
  // Sort by timestamp descending (newest first)
  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  if (options.limit) {
    filtered = filtered.slice(0, options.limit);
  }
  
  return filtered;
}

/**
 * Get audit statistics
 */
export function getAuditStats(timeWindow: number = 24): {
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  uniqueUsers: number;
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{ userEmail: string; count: number }>;
} {
  const cutoffTime = new Date(Date.now() - timeWindow * 60 * 60 * 1000);
  const recentLogs = auditLogs.filter(log => log.timestamp >= cutoffTime);
  
  const actionCounts = recentLogs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const userCounts = recentLogs.reduce((acc, log) => {
    acc[log.userEmail] = (acc[log.userEmail] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalActions: recentLogs.length,
    successfulActions: recentLogs.filter(log => log.success).length,
    failedActions: recentLogs.filter(log => !log.success).length,
    uniqueUsers: Object.keys(userCounts).length,
    topActions: Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action, count })),
    topUsers: Object.entries(userCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([userEmail, count]) => ({ userEmail, count }))
  };
}

/**
 * Generate unique log ID
 */
function generateLogId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Export audit logs (for compliance/backup)
 */
export function exportAuditLogs(format: 'json' | 'csv' = 'json'): string {
  if (format === 'csv') {
    const headers = ['timestamp', 'userId', 'userEmail', 'userRole', 'action', 'resource', 'resourceId', 'success', 'error'];
    const rows = auditLogs.map(log => [
      log.timestamp.toISOString(),
      log.userId,
      log.userEmail,
      log.userRole,
      log.action,
      log.resource,
      log.resourceId || '',
      log.success.toString(),
      log.error || ''
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
  
  return JSON.stringify(auditLogs, null, 2);
}

/**
 * Clear audit logs (admin only, with logging)
 */
export function clearAuditLogs(admin: AdminUser, retainDays: number = 0): number {
  const originalCount = auditLogs.length;
  
  if (retainDays > 0) {
    const cutoffTime = new Date(Date.now() - retainDays * 24 * 60 * 60 * 1000);
    const retained = auditLogs.filter(log => log.timestamp >= cutoffTime);
    auditLogs.length = 0;
    auditLogs.push(...retained);
  } else {
    auditLogs.length = 0;
  }
  
  const removedCount = originalCount - auditLogs.length;
  
  // Log the clearing action
  logAdminAction(admin, 'system.settings_change', 'audit_logs', {
    details: {
      action: 'clear_logs',
      removedCount,
      retainDays
    }
  });
  
  return removedCount;
}