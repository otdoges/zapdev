'use client';

import { AnimatedAIChat } from '@/components/animated-ai-chat';
import dynamic from 'next/dynamic';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

const WebContainerComponent = dynamic(() => import('@/components/web-container'), {
  loading: () => (
    <div className="flex flex-1 items-center justify-center bg-[#0A0A0F] text-white/40">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-lg bg-white/5">
          <Code className="h-8 w-8" />
        </div>
        <p className="text-sm">Loading WebContainer...</p>
      </div>
    </div>
  ),
  ssr: false,
});
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Code,
  Eye,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Settings,
  BarChart3,
  Brain,
} from 'lucide-react';
import { getTokenUsageStats } from '@/lib/openrouter';
import { useSupabase } from '@/components/SupabaseProvider';
import { AUTH_TIMEOUTS, hasAuthCookies } from '@/lib/auth-constants';

// Memoize static components for better performance
const BackButton = ({ onClick }: { onClick: () => void }) => (
  <motion.button
    onClick={onClick}
    className="flex items-center justify-center rounded-full bg-white/5 p-2 transition-colors will-change-transform hover:bg-white/10"
    whileTap={{ scale: 0.95 }}
    whileHover={{ scale: 1.05 }}
  >
    <ArrowLeft className="h-5 w-5 text-white" />
  </motion.button>
);

const StatsDisplay = ({ stats }: { stats: any }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-3 text-xs text-white/60"
  >
    <div className="flex items-center gap-1">
      <Brain className="h-3 w-3" />
      <span>{stats?.totalTokens?.toLocaleString() || 0} tokens</span>
    </div>
    <div className="flex items-center gap-1">
      <BarChart3 className="h-3 w-3" />
      <span>${(stats?.totalCost || 0).toFixed(4)}</span>
    </div>
  </motion.div>
);

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const chatId = params.id as string;
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [tokenStats, setTokenStats] = useState<any>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [hasMessagesSent, setHasMessagesSent] = useState(false);
  const [aiTeamProject, setAiTeamProject] = useState<any>(null);
  const [showWebContainer, setShowWebContainer] = useState(false);
  const [forceSkipAuth, setForceSkipAuth] = useState(false);
  const { user, loading } = useSupabase();
  const isAuthenticated = !!user;
  const isLoading = loading;

  // Memoized handlers
  const handleBack = useMemo(() => () => router.push('/chat'), [router]);
  const togglePreview = useMemo(() => () => setIsPreviewExpanded((prev) => !prev), []);

  // Load token usage stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await getTokenUsageStats();
        setTokenStats(stats);
      } catch (error) {
        errorLogger.error(ErrorCategory.GENERAL, 'Failed to load token stats:', error);
      }
    };

    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated]);

  // Show loading state while authentication is being determined
  if (loading && !forceSkipAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0D10]">
        <div className="flex flex-col items-center gap-4">
          <motion.div 
            className="h-8 w-8 rounded-full border-b-2 border-[#6C52A0]"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.p 
            className="text-white/60"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Verifying session...
          </motion.p>
          <motion.button
            onClick={() => {
              setForceSkipAuth(true);
              errorLogger.info(ErrorCategory.GENERAL, 'User manually bypassed auth loading');
            }}
            className="mt-4 text-sm text-[#6C52A0] hover:text-[#7C62B0] underline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3 }}
          >
            Continue anyway
          </motion.button>
        </div>
      </div>
    );
  }

  // The middleware should prevent this page from rendering if the user is not authenticated.
  // If we reach here without a user, it's an unexpected state, but we shouldn't
  // show a redirecting message as the middleware is the source of truth.
  // We can just show a generic loading/error state.
  if (!user && !forceSkipAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0D10]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
          <p className="text-white/60">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0D0D10] text-white">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 p-4">
        <div className="flex items-center gap-4">
          <BackButton onClick={handleBack} />
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold">Chat Session</h1>
            <StatsDisplay stats={tokenStats} />
          </div>
        </div>

        {/* Only show preview controls after first message */}
        {hasMessagesSent && (
          <div className="flex items-center gap-2">
            <motion.button
              onClick={togglePreview}
              className="flex items-center gap-2 rounded-lg bg-white/5 p-2 transition-colors hover:bg-white/10"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {isPreviewExpanded ? (
                <>
                  <Code className="h-4 w-4" />
                  <span className="text-sm">Show Chat</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">Show Preview</span>
                </>
              )}
            </motion.button>

            <motion.button
              onClick={togglePreview}
              className="rounded-lg bg-white/5 p-2 transition-colors hover:bg-white/10"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {isPreviewExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </motion.button>
          </div>
        )}
      </div>

      {/* Main Content */}
      {!hasMessagesSent ? (
        /* Full-width chat before first message */
        <div className="flex flex-1 overflow-hidden">
          <div className="h-full w-full">
            <AnimatedAIChat
              chatId={chatId === 'new' ? undefined : chatId}
              onFirstMessageSent={() => {
                errorLogger.info(ErrorCategory.GENERAL, 'First message sent');
                setHasMessagesSent(true);
              }}
              onCodeGenerated={(code) => {
                setGeneratedCode(code);
              }}
              onAITeamBuild={(projectData) => {
                errorLogger.info(ErrorCategory.GENERAL, 'AI Team built project:', projectData);
                setAiTeamProject(projectData);
                setShowWebContainer(true);
                setHasMessagesSent(true);
              }}
              useMultipleModels={false}
              className="h-full"
            />
          </div>
        </div>
      ) : (
        /* Split layout after first message */
        <motion.div
          className="flex flex-1 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Chat Panel */}
          <motion.div
            className={cn(
              'flex flex-col transition-all duration-300',
              isPreviewExpanded ? 'w-0 opacity-0' : 'w-1/2 opacity-100'
            )}
            initial={{ width: '100%' }}
            animate={{ width: isPreviewExpanded ? '0%' : '50%' }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <AnimatedAIChat
              chatId={chatId === 'new' ? undefined : chatId}
              onFirstMessageSent={() => {
                errorLogger.info(ErrorCategory.GENERAL, 'First message sent');
              }}
              onCodeGenerated={(code) => {
                errorLogger.info(
                  ErrorCategory.GENERAL,
                  'Code generated in chat page:',
                  code.substring(0, 100) + '...'
                );
                setGeneratedCode(code);
                setShowWebContainer(true);
              }}
              onAITeamBuild={(projectData) => {
                errorLogger.info(ErrorCategory.GENERAL, 'AI Team built project:', projectData);
                setAiTeamProject(projectData);
                setShowWebContainer(true);
                setHasMessagesSent(true);
              }}
              useMultipleModels={false}
              className="h-full"
            />
          </motion.div>

          {/* Preview Panel */}
          <motion.div
            className={cn(
              'flex flex-col border-l border-white/10 transition-all duration-300',
              isPreviewExpanded ? 'w-full opacity-100' : 'w-1/2 opacity-100'
            )}
            initial={{ width: '0%' }}
            animate={{ width: isPreviewExpanded ? '100%' : '50%' }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            {showWebContainer && (generatedCode || aiTeamProject) ? (
              <WebContainerComponent
                code={generatedCode}
                aiTeamInstructions={aiTeamProject?.instructions}
                onCodeChange={(newCode) => setGeneratedCode(newCode)}
                className="h-full"
              />
            ) : (
              <div className="flex flex-1 items-center justify-center bg-[#0A0A0F] text-white/40">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-white/5">
                    <Eye className="h-8 w-8" />
                  </div>
                  <p className="text-sm">Preview will appear here when you generate code</p>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
