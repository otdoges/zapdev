"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { 
  Sparkles, 
  FileSearch,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Clock
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useUser();
  const userId = user?.id || "";
  
  const subscription = useQuery(api.billing.getUserSubscription, 
    user ? { userId } : "skip"
  );
  
  const stats = useQuery(api.backgroundAgents.getTaskStats,
    user ? { userId } : "skip"
  );
  
  const isPro = subscription?.planType === "pro" || subscription?.planType === "enterprise";
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName || user?.username || "there"}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's an overview of your AI development workspace
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <FileSearch className="w-5 h-5 text-orange-500" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats?.total || 0}</span>
            </div>
            <p className="text-sm text-gray-600">Total Tasks</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats?.completed || 0}</span>
            </div>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {(stats?.pending || 0) + (stats?.running || 0)}
              </span>
            </div>
            <p className="text-sm text-gray-600">Active</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats?.todayTasks || 0}</span>
            </div>
            <p className="text-sm text-gray-600">Today's Tasks</p>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Background Agents Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Background AI Agents</h3>
                  <p className="text-sm text-gray-600">Autonomous AI working on your code</p>
                </div>
              </div>
              {!isPro && (
                <span className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs px-2 py-0.5 rounded-full">
                  PRO
                </span>
              )}
            </div>
            
            <p className="text-gray-600 mb-4">
              Let AI agents work on your repositories 24/7. They can review code, fix bugs, 
              optimize performance, and more - all automatically.
            </p>
            
            {isPro ? (
              <Link
                href="/dashboard/background-agents"
                className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
              >
                Manage Agents
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                Upgrade to Pro
                <Sparkles className="w-4 h-4" />
              </Link>
            )}
          </div>
          
          {/* More features can be added here */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <FileSearch className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Coming Soon</h3>
                <p className="text-sm text-gray-600">More features on the way</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-4">
              We're working on exciting new features to enhance your AI development experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
