import { useEffect } from 'react';
import { useConvexAuth } from 'convex/react';
import { redirectToWorkOS } from '@/lib/workos';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, isLoading } = useConvexAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      redirectToWorkOS();
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to auth
  }

  return <>{children}</>;
};

export default AuthGuard;