import { requireAdminAccess } from '@/lib/admin-auth';
import { redirect } from 'next/navigation';
import AutonomousDashboard from '@/components/AutonomousDashboard';

export default async function AdminOrchestrationPage() {
  // Require admin access - will redirect to sign-in or home if not authorized
  const adminUser = await requireAdminAccess();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                AI Orchestration Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Admin access • {adminUser.email} • Role: {adminUser.role}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Admin Access
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Internal System
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Admin Only - Internal AI System
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  This dashboard provides access to internal AI orchestration systems. 
                  All actions are logged and monitored. This interface is not accessible 
                  to regular users and should remain internal-only.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <AutonomousDashboard className="shadow-lg" />
      </div>
    </div>
  );
}