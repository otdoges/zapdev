'use client';

import { useState, useEffect } from 'react';
import { getAllFeatureFlags, FeatureFlag, FeatureFlagKey } from '@/lib/feature-flags';
import { 
  Users,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield
} from 'lucide-react';

export default function FeatureFlagsPage() {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEnabled, setFilterEnabled] = useState<'all' | 'enabled' | 'disabled'>('all');
  
  useEffect(() => {
    const checkAdminAndLoadFeatures = async () => {
      try {
        // Note: In a real implementation, this would be handled server-side
        // For now, we'll simulate the check
        const flags = getAllFeatureFlags();
        setFeatureFlags(flags);
        setAdminUser({ email: 'admin@example.com', role: 'admin' }); // Simulated
        setLoading(false);
      } catch (error) {
        console.error('Failed to load admin data:', error);
        setLoading(false);
      }
    };
    
    checkAdminAndLoadFeatures();
  }, []);
  
  const filteredFlags = featureFlags.filter(flag => {
    const matchesSearch = flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flag.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterEnabled === 'enabled') return matchesSearch && flag.enabled;
    if (filterEnabled === 'disabled') return matchesSearch && !flag.enabled;
    return matchesSearch;
  });
  
  const toggleFeature = (flagKey: FeatureFlagKey) => {
    setFeatureFlags(prev => prev.map(flag => 
      flag.key === flagKey ? { ...flag, enabled: !flag.enabled } : flag
    ));
  };
  
  const updateRolloutPercentage = (flagKey: FeatureFlagKey, percentage: number) => {
    setFeatureFlags(prev => prev.map(flag => 
      flag.key === flagKey ? { ...flag, rolloutPercentage: percentage } : flag
    ));
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin features...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Feature Flags Management
              </h1>
              <p className="text-sm text-gray-600">
                Control AI feature rollouts and experimental functionality
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4 mr-1" />
                Admin Access
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Security Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Critical AI Features Protected
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  These feature flags control access to internal AI systems that were previously 
                  exposed to all users. Most AI orchestration features are now admin-only by default 
                  to prevent security vulnerabilities.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="sr-only">Search features</label>
              <input
                id="search"
                type="text"
                placeholder="Search feature flags..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterEnabled}
              onChange={(e) => setFilterEnabled(e.target.value as 'all' | 'enabled' | 'disabled')}
            >
              <option value="all">All Features</option>
              <option value="enabled">Enabled Only</option>
              <option value="disabled">Disabled Only</option>
            </select>
          </div>
        </div>

        {/* Feature Flags List */}
        <div className="space-y-6">
          {filteredFlags.map((flag) => (
            <div key={flag.key} className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {flag.name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        flag.enabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {flag.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      {flag.userRoles.includes('admin') && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <Shield className="w-3 h-3 mr-1" />
                          Admin Only
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                      {flag.description}
                    </p>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>Roles: {flag.userRoles.join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        <span>Rollout: {flag.rolloutPercentage}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Updated: {flag.updatedAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleFeature(flag.key as FeatureFlagKey)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        flag.enabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          flag.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                
                {flag.enabled && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-gray-700">
                        Rollout Percentage:
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="10"
                        value={flag.rolloutPercentage}
                        onChange={(e) => updateRolloutPercentage(flag.key as FeatureFlagKey, parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-900 w-12">
                        {flag.rolloutPercentage}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {filteredFlags.length === 0 && (
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No feature flags found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms.' : 'No feature flags match your current filter.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}