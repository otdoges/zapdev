'use client';

import { useState, useEffect } from 'react';
import { ReactScanMonitor } from '@/lib/react-scan-monitor';
import { Button } from '@/components/ui/button';
import { 
  Monitor, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap,
  TrendingUp,
  Eye,
  Settings,
  X
} from 'lucide-react';

interface ReactScanDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReactScanDashboard({ isOpen, onClose }: ReactScanDashboardProps) {
  const [monitor] = useState(() => ReactScanMonitor.getInstance());
  const [stats, setStats] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [componentSummary, setComponentSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
      const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const systemStats = monitor.getSystemStats();
      const performanceIssues = monitor.getIssues(false);
      const componentData = monitor.getComponentSummary();

      setStats(systemStats);
      setIssues(performanceIssues);
      setComponentSummary(componentData);
    } catch (error) {
      console.error('Failed to load React Scan data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveIssue = (issueId: string) => {
    monitor.resolveIssue(issueId);
    loadData(); // Refresh data
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Monitor className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">React Scan Performance Monitor</h2>
            {stats && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                stats.isEnabled ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
              }`}>
                <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
                {stats.isEnabled ? 'Active' : 'Inactive'}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!stats?.isEnabled ? (
            <div className="text-center py-12">
              <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">React Scan Not Active</h3>
              <p className="text-gray-600 mb-4">
                React Scan monitoring is only available in development mode.
              </p>
              <p className="text-sm text-gray-500">
                Run `npm run dev` to enable component performance monitoring.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* System Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-blue-900">Components</h3>
                    <Eye className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-900">{stats.totalComponents}</div>
                  <div className="text-sm text-blue-700">Monitored</div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-green-900">Renders</h3>
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-900">{stats.totalRenders}</div>
                  <div className="text-sm text-green-700">Last 5 min</div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-yellow-900">Issues</h3>
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="text-2xl font-bold text-yellow-900">{stats.totalIssues}</div>
                  <div className="text-sm text-yellow-700">Active</div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-purple-900">Avg Render</h3>
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-purple-900">{stats.avgRenderTime.toFixed(1)}ms</div>
                  <div className="text-sm text-purple-700">Response Time</div>
                </div>
              </div>

              {/* Performance Issues */}
              {issues.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h3 className="font-medium text-red-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Performance Issues ({issues.length})
                  </h3>
                  <div className="space-y-3">
                    {issues.slice(0, 5).map((issue) => (
                      <div key={issue.id} className="bg-white border border-red-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{issue.component}</h4>
                            <p className="text-sm text-gray-600">{issue.description}</p>
                            <p className="text-sm text-blue-600 mt-1">💡 {issue.suggestion}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                              {issue.severity}
                            </span>
                            <Button size="sm" onClick={() => resolveIssue(issue.id)}>
                              Resolve
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Component Performance Summary */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Component Performance (Last 5 minutes)
                </h3>
                <div className="space-y-3">
                  {componentSummary.slice(0, 10).map((comp) => (
                    <div key={comp.component} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{comp.component}</h4>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span>{comp.renderCount} renders</span>
                          <span>{comp.avgRenderTime.toFixed(1)}ms avg</span>
                          {comp.wastedRenders > 0 && (
                            <span className="text-orange-600">{comp.wastedRenders} wasted</span>
                          )}
                          {comp.issues > 0 && (
                            <span className="text-red-600">{comp.issues} issues</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Render time bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            comp.avgRenderTime > 16 ? 'bg-red-500' :
                            comp.avgRenderTime > 8 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, (comp.avgRenderTime / 50) * 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0ms</span>
                        <span>50ms</span>
                      </div>
                    </div>
                  ))}
                  
                  {componentSummary.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Monitor className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No component activity detected yet.</p>
                      <p className="text-sm mt-1">Start interacting with the app to see performance data.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-medium text-blue-900 mb-4">💡 Performance Tips</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                  <div>
                    <h4 className="font-medium mb-2">Reduce Re-renders:</h4>
                    <ul className="space-y-1 text-blue-700">
                      <li>• Use React.memo for pure components</li>
                      <li>• Implement useMemo for expensive calculations</li>
                      <li>• Use useCallback for stable function references</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Optimize Rendering:</h4>
                    <ul className="space-y-1 text-blue-700">
                      <li>• Avoid inline objects and functions in JSX</li>
                      <li>• Use keys properly in lists</li>
                      <li>• Consider lazy loading for heavy components</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {stats?.isEnabled ? 'Monitoring active' : 'Development mode required'}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadData} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
