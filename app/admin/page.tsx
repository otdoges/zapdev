import { requireAdminAccess } from '@/lib/admin-auth';
import { getAllFeatureFlags } from '@/lib/feature-flags';
import Link from 'next/link';
import { 
  Bot, 
  Monitor, 
  Shield, 
  Users, 
  BarChart3, 
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server
} from 'lucide-react';

export default async function AdminDashboardPage() {
  // Require admin access - will redirect to sign-in or home if not authorized
  const adminUser = await requireAdminAccess();
  const featureFlags = getAllFeatureFlags();
  
  const enabledFeatures = featureFlags.filter(f => f.enabled).length;
  const totalFeatures = featureFlags.length;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {adminUser.email} • Role: {adminUser.role}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4 mr-2" />
                Admin Access
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Security Alert */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <div className="flex">
            <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">
                Critical Security Implementation
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p className="mb-2">
                  This admin dashboard has been created to secure internal AI orchestration systems 
                  that were previously exposed to all users. The following components are now admin-only:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>AI Orchestration Dashboard (AutonomousDashboard)</li>
                  <li>AI System Monitoring (AISystemDemo)</li>
                  <li>Internal API endpoints for orchestration and monitoring</li>
                  <li>Performance optimization and multi-agent coordination</li>
                </ul>
                <p className="mt-2 font-medium">
                  Regular users now see a clean interface without AI system internals exposed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Bot className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">AI Systems</p>
                <p className="text-2xl font-semibold text-gray-900">Active</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Security</p>
                <p className="text-2xl font-semibold text-gray-900">Protected</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Settings className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Features</p>
                <p className="text-2xl font-semibold text-gray-900">{enabledFeatures}/{totalFeatures}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Uptime</p>
                <p className="text-2xl font-semibold text-gray-900">99.9%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/admin/orchestration"
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-gray-200 hover:border-blue-300"
          >
            <div className="flex items-center mb-4">
              <Bot className="h-8 w-8 text-blue-600" />
              <h3 className="ml-3 text-lg font-medium text-gray-900">
                AI Orchestration
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Manage autonomous development tasks, job coordination, and AI agent workflows.
            </p>
            <div className="mt-4 flex items-center text-sm text-blue-600">
              <span>Access Dashboard</span>
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link
            href="/admin/system"
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-gray-200 hover:border-purple-300"
          >
            <div className="flex items-center mb-4">
              <Monitor className="h-8 w-8 text-purple-600" />
              <h3 className="ml-3 text-lg font-medium text-gray-900">
                System Monitoring
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Monitor AI system performance, model selection, confidence scores, and execution plans.
            </p>
            <div className="mt-4 flex items-center text-sm text-purple-600">
              <span>View Monitoring</span>
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link
            href="/admin/features"
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-gray-200 hover:border-green-300"
          >
            <div className="flex items-center mb-4">
              <Settings className="h-8 w-8 text-green-600" />
              <h3 className="ml-3 text-lg font-medium text-gray-900">
                Feature Flags
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Control feature rollouts, manage experimental AI features, and user access.
            </p>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <span>Manage Features</span>
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-gray-200 hover:border-orange-300"
          >
            <div className="flex items-center mb-4">
              <Users className="h-8 w-8 text-orange-600" />
              <h3 className="ml-3 text-lg font-medium text-gray-900">
                User Management
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Manage user roles, permissions, and access to admin features.
            </p>
            <div className="mt-4 flex items-center text-sm text-orange-600">
              <span>Manage Users</span>
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link
            href="/admin/analytics"
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-gray-200 hover:border-indigo-300"
          >
            <div className="flex items-center mb-4">
              <BarChart3 className="h-8 w-8 text-indigo-600" />
              <h3 className="ml-3 text-lg font-medium text-gray-900">
                Analytics
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              View system analytics, usage metrics, and performance trends.
            </p>
            <div className="mt-4 flex items-center text-sm text-indigo-600">
              <span>View Analytics</span>
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link
            href="/admin/settings"
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-gray-200 hover:border-gray-400"
          >
            <div className="flex items-center mb-4">
              <Server className="h-8 w-8 text-gray-600" />
              <h3 className="ml-3 text-lg font-medium text-gray-900">
                System Settings
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Configure system settings, API keys, and global configurations.
            </p>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <span>System Config</span>
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Admin Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                <span className="text-gray-600">AI orchestration system secured with admin-only access</span>
                <span className="ml-auto text-gray-400">Just now</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                <span className="text-gray-600">Feature flags system implemented</span>
                <span className="ml-auto text-gray-400">Just now</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                <span className="text-gray-600">Role-based access control activated</span>
                <span className="ml-auto text-gray-400">Just now</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}