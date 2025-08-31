// Types only - avoid server imports in client code
export type UserRole = 'user' | 'admin' | 'developer';

export interface AdminUser {
  userId: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

// Client-side version of getUserRole function
function getUserRole(userId: string, email?: string): UserRole {
  // Admin user IDs - this should be moved to environment variables in production
  const ADMIN_USER_IDS = process.env.NEXT_PUBLIC_ADMIN_USER_IDS?.split(',') || [];
  const DEVELOPER_USER_IDS = process.env.NEXT_PUBLIC_DEVELOPER_USER_IDS?.split(',') || [];
  
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

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  userRoles: string[];
  userIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type FeatureFlagKey = 
  | 'ai_orchestration_dashboard'
  | 'ai_system_monitoring' 
  | 'advanced_ai_models'
  | 'multi_agent_coordination'
  | 'performance_optimization'
  | 'autonomous_development'
  | 'ai_code_review'
  | 'design_team_integration'
  | 'github_automation'
  | 'realtime_monitoring'
  | 'system_diagnostics';

// Default feature flags configuration
const DEFAULT_FEATURE_FLAGS: Record<FeatureFlagKey, Omit<FeatureFlag, 'createdAt' | 'updatedAt'>> = {
  ai_orchestration_dashboard: {
    key: 'ai_orchestration_dashboard',
    name: 'AI Orchestration Dashboard',
    description: 'Access to internal AI orchestration system management',
    enabled: false,
    rolloutPercentage: 0,
    userRoles: ['admin', 'developer'],
    userIds: []
  },
  ai_system_monitoring: {
    key: 'ai_system_monitoring',
    name: 'AI System Monitoring',
    description: 'Real-time monitoring of AI system performance and health',
    enabled: false,
    rolloutPercentage: 0,
    userRoles: ['admin', 'developer'],
    userIds: []
  },
  advanced_ai_models: {
    key: 'advanced_ai_models',
    name: 'Advanced AI Models',
    description: 'Access to experimental and advanced AI models',
    enabled: false,
    rolloutPercentage: 0,
    userRoles: ['admin', 'developer'],
    userIds: []
  },
  multi_agent_coordination: {
    key: 'multi_agent_coordination',
    name: 'Multi-Agent Coordination',
    description: 'Multi-agent AI coordination and orchestration features',
    enabled: false,
    rolloutPercentage: 0,
    userRoles: ['admin', 'developer'],
    userIds: []
  },
  performance_optimization: {
    key: 'performance_optimization',
    name: 'Performance Optimization',
    description: 'AI-powered performance optimization tools',
    enabled: false,
    rolloutPercentage: 10,
    userRoles: ['admin', 'developer'],
    userIds: []
  },
  autonomous_development: {
    key: 'autonomous_development',
    name: 'Autonomous Development',
    description: 'Fully autonomous development capabilities',
    enabled: false,
    rolloutPercentage: 0,
    userRoles: ['developer'],
    userIds: []
  },
  ai_code_review: {
    key: 'ai_code_review',
    name: 'AI Code Review',
    description: 'Automated AI code review and suggestions',
    enabled: true,
    rolloutPercentage: 50,
    userRoles: ['admin', 'developer', 'user'],
    userIds: []
  },
  design_team_integration: {
    key: 'design_team_integration',
    name: 'Design Team Integration',
    description: 'Integration with design team collaboration features',
    enabled: true,
    rolloutPercentage: 30,
    userRoles: ['admin', 'developer', 'user'],
    userIds: []
  },
  github_automation: {
    key: 'github_automation',
    name: 'GitHub Automation',
    description: 'Automated GitHub workflow and PR management',
    enabled: true,
    rolloutPercentage: 75,
    userRoles: ['admin', 'developer', 'user'],
    userIds: []
  },
  realtime_monitoring: {
    key: 'realtime_monitoring',
    name: 'Real-time Monitoring',
    description: 'Real-time system and application monitoring',
    enabled: false,
    rolloutPercentage: 0,
    userRoles: ['admin', 'developer'],
    userIds: []
  },
  system_diagnostics: {
    key: 'system_diagnostics',
    name: 'System Diagnostics',
    description: 'Advanced system diagnostics and debugging tools',
    enabled: false,
    rolloutPercentage: 0,
    userRoles: ['admin', 'developer'],
    userIds: []
  }
};

/**
 * Get all feature flags (admin only)
 */
export function getAllFeatureFlags(): FeatureFlag[] {
  const now = new Date();
  return Object.values(DEFAULT_FEATURE_FLAGS).map(flag => ({
    ...flag,
    createdAt: now,
    updatedAt: now
  }));
}

/**
 * Check if a feature is enabled for a specific user
 */
export function isFeatureEnabled(
  featureKey: FeatureFlagKey, 
  userId: string,
  userEmail?: string
): boolean {
  const flag = DEFAULT_FEATURE_FLAGS[featureKey];
  
  if (!flag) {
    console.warn(`Unknown feature flag: ${featureKey}`);
    return false;
  }
  
  // Feature is globally disabled
  if (!flag.enabled) {
    return false;
  }
  
  // Check if user is explicitly enabled
  if (flag.userIds.includes(userId)) {
    return true;
  }
  
  // Check user role
  const userRole = getUserRole(userId, userEmail);
  if (!flag.userRoles.includes(userRole)) {
    return false;
  }
  
  // Check rollout percentage
  if (flag.rolloutPercentage === 100) {
    return true;
  }
  
  if (flag.rolloutPercentage === 0) {
    return false;
  }
  
  // Use deterministic hash of userId to ensure consistent rollout
  const hash = hashString(userId);
  const userPercentile = hash % 100;
  return userPercentile < flag.rolloutPercentage;
}

/**
 * Get enabled features for a user
 */
export function getEnabledFeatures(
  userId: string, 
  userEmail?: string
): FeatureFlagKey[] {
  return Object.keys(DEFAULT_FEATURE_FLAGS)
    .filter(key => isFeatureEnabled(key as FeatureFlagKey, userId, userEmail)) as FeatureFlagKey[];
}

/**
 * Check multiple features at once
 */
export function checkFeatures(
  features: FeatureFlagKey[],
  userId: string,
  userEmail?: string
): Record<FeatureFlagKey, boolean> {
  const result: Partial<Record<FeatureFlagKey, boolean>> = {};
  
  for (const feature of features) {
    result[feature] = isFeatureEnabled(feature, userId, userEmail);
  }
  
  return result as Record<FeatureFlagKey, boolean>;
}

/**
 * Get feature flag by key
 */
export function getFeatureFlag(featureKey: FeatureFlagKey): FeatureFlag | null {
  const flag = DEFAULT_FEATURE_FLAGS[featureKey];
  if (!flag) return null;
  
  const now = new Date();
  return {
    ...flag,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Update feature flag (admin only) - in production this would update a database
 */
export function updateFeatureFlag(
  featureKey: FeatureFlagKey,
  updates: Partial<Pick<FeatureFlag, 'enabled' | 'rolloutPercentage' | 'userRoles' | 'userIds'>>
): FeatureFlag | null {
  const flag = DEFAULT_FEATURE_FLAGS[featureKey];
  if (!flag) return null;
  
  // In production, this would update the database
  Object.assign(flag, updates, { updatedAt: new Date() });
  
  return {
    ...flag,
    createdAt: new Date(), // This would come from DB
    updatedAt: new Date()
  };
}

/**
 * Simple hash function for consistent rollout
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Feature flag context for React components
 */
export interface FeatureFlagContext {
  features: Record<FeatureFlagKey, boolean>;
  isFeatureEnabled: (key: FeatureFlagKey) => boolean;
  hasAnyFeature: (keys: FeatureFlagKey[]) => boolean;
  hasAllFeatures: (keys: FeatureFlagKey[]) => boolean;
}

/**
 * Create feature flag context for a user
 */
export function createFeatureFlagContext(
  userId: string, 
  userEmail?: string
): FeatureFlagContext {
  const features = checkFeatures(
    Object.keys(DEFAULT_FEATURE_FLAGS) as FeatureFlagKey[],
    userId,
    userEmail
  );
  
  return {
    features,
    isFeatureEnabled: (key) => features[key] || false,
    hasAnyFeature: (keys) => keys.some(key => features[key]),
    hasAllFeatures: (keys) => keys.every(key => features[key])
  };
}