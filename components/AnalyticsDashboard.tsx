'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';

interface AnalyticsDashboardProps {
  siteId?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface AnalyticsData {
  overview: {
    totalPageviews: number;
    uniqueVisitors: number;
    averageSessionTime: number;
    bounceRate: number;
  };
  pageviews: {
    timeline: { date: string; views: number }[];
    total: number;
  };
  topPages: { page: string; views: number; percentage: number }[];
  referrers: { referrer: string; visits: number; percentage: number }[];
  devices: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  browsers: { browser: string; visits: number; percentage: number }[];
  countries: { country: string; visits: number; percentage: number }[];
  realtime: {
    currentVisitors: number;
    recentPageviews: { page: string; timestamp: number }[];
  };
}

export default function AnalyticsDashboard({ siteId, isOpen, onClose }: AnalyticsDashboardProps) {
  const { isSignedIn } = useUser();
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user's deployed sites for the dropdown
  const deployments = useQuery(api.deployments.getUserDeployments, isSignedIn ? {} : 'skip');

  // Load analytics data
  useEffect(() => {
    if (siteId && isSignedIn) {
      loadAnalyticsData();
    }
  }, [siteId, timeRange, selectedPage, isSignedIn]);

  const loadAnalyticsData = async () => {
    if (!siteId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analytics/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          timeRange,
          page: selectedPage || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load analytics data');
      }

      const result = await response.json();
      setAnalyticsData(result.data);
    } catch (error: any) {
      setError(error.message || 'Failed to load analytics');
      console.error('Analytics error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'desktop':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'mobile':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z" />
          </svg>
        );
      case 'tablet':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (!isOpen || !siteId) return null;

  const selectedSite = deployments?.find(d => d.siteId === siteId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
              <p className="text-gray-400 mt-1">
                {selectedSite?.name} • {selectedSite?.url}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Time range selector */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-300 text-sm">Time Range:</span>
              {['24h', '7d', '30d', '90d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range as any)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6">
          {error ? (
            <div className="bg-red-900 border border-red-700 text-red-100 p-4 rounded-lg">
              <p className="font-medium">Error loading analytics</p>
              <p className="text-sm mt-1">{error}</p>
              <button
                onClick={loadAnalyticsData}
                className="mt-2 px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-sm"
              >
                Retry
              </button>
            </div>
          ) : isLoading ? (
            <div className="text-center text-gray-500 py-12">
              <div className="w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p>Loading analytics data...</p>
            </div>
          ) : analyticsData ? (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Page Views</p>
                      <p className="text-2xl font-bold text-white">
                        {formatNumber(analyticsData.overview.totalPageviews)}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Unique Visitors</p>
                      <p className="text-2xl font-bold text-white">
                        {formatNumber(analyticsData.overview.uniqueVisitors)}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Avg Session Time</p>
                      <p className="text-2xl font-bold text-white">
                        {Math.round(analyticsData.overview.averageSessionTime)}s
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Bounce Rate</p>
                      <p className="text-2xl font-bold text-white">
                        {Math.round(analyticsData.overview.bounceRate)}%
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time visitors */}
              {analyticsData.realtime.currentVisitors > 0 && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-white font-medium">
                      {analyticsData.realtime.currentVisitors} active visitors right now
                    </span>
                  </div>
                  {analyticsData.realtime.recentPageviews.length > 0 && (
                    <div className="text-gray-400 text-sm">
                      Recent pages: {analyticsData.realtime.recentPageviews.slice(0, 3).map(p => p.page).join(', ')}
                    </div>
                  )}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {/* Top Pages */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Top Pages</h3>
                  <div className="space-y-2">
                    {analyticsData.topPages.length > 0 ? analyticsData.topPages.map((page, index) => (
                      <div key={page.page} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{page.page}</p>
                          <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                            <div
                              className="bg-blue-600 h-1 rounded-full"
                              style={{ width: `${page.percentage}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-gray-400 ml-4">{page.views}</span>
                      </div>
                    )) : (
                      <p className="text-gray-400 text-center py-4">No page data available</p>
                    )}
                  </div>
                </div>

                {/* Top Referrers */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Top Referrers</h3>
                  <div className="space-y-2">
                    {analyticsData.referrers.length > 0 ? analyticsData.referrers.map((referrer, index) => (
                      <div key={referrer.referrer} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{referrer.referrer}</p>
                          <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                            <div
                              className="bg-green-600 h-1 rounded-full"
                              style={{ width: `${referrer.percentage}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-gray-400 ml-4">{referrer.visits}</span>
                      </div>
                    )) : (
                      <p className="text-gray-400 text-center py-4">No referrer data available</p>
                    )}
                  </div>
                </div>

                {/* Device Breakdown */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Device Types</h3>
                  <div className="space-y-3">
                    {Object.entries(analyticsData.devices).map(([device, count]) => {
                      const total = Object.values(analyticsData.devices).reduce((a, b) => a + b, 0);
                      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                      
                      return (
                        <div key={device} className="flex items-center gap-3">
                          {getDeviceIcon(device)}
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-white capitalize">{device}</span>
                              <span className="text-gray-400">{count} ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                              <div
                                className="bg-yellow-600 h-1 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Browsers */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Browsers</h3>
                  <div className="space-y-2">
                    {analyticsData.browsers.length > 0 ? analyticsData.browsers.map((browser, index) => (
                      <div key={browser.browser} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium">{browser.browser}</p>
                          <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                            <div
                              className="bg-purple-600 h-1 rounded-full"
                              style={{ width: `${browser.percentage}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-gray-400 ml-4">{browser.visits}</span>
                      </div>
                    )) : (
                      <p className="text-gray-400 text-center py-4">No browser data available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Countries */}
              {analyticsData.countries.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Top Countries</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {analyticsData.countries.map((country) => (
                      <div key={country.country} className="text-center">
                        <div className="text-2xl mb-1">🌍</div>
                        <div className="text-white font-medium">{country.country}</div>
                        <div className="text-gray-400 text-sm">{country.visits} visits</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-medium mb-2">No analytics data</h3>
              <p>Analytics will appear here once your site receives visitors.</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}