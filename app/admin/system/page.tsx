import { requireAdminAccess } from '@/lib/admin-auth';
import AISystemDemo from '@/components/AISystemDemo';

export default async function AdminSystemPage() {
  // Require admin access - will redirect to sign-in or home if not authorized
  const adminUser = await requireAdminAccess();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                AI System Monitoring
              </h1>
              <p className="text-sm text-gray-600">
                Admin access • {adminUser.email} • Role: {adminUser.role}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Admin Access
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                AI Monitoring
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Critical Security Warning
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  This interface exposes internal AI system details including model selection, 
                  confidence scores, execution plans, and performance metrics. This data should 
                  NEVER be accessible to end users as it reveals system internals and AI decision-making processes.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Internal AI System Diagnostics
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Monitor AI model performance, confidence levels, and system health metrics. 
              This data is used internally for system optimization and debugging.
            </p>
            
            <AISystemDemo className="border-t border-gray-200 pt-6" />
          </div>
        </div>
      </div>
    </div>
  );
}