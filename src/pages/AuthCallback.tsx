import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useWorkOSAuth } from "@/hooks/useWorkOSAuth";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { trpc } from "@/lib/trpc";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const AuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUserProfile, setAuthToken } = useWorkOSAuth();
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUserFromWorkOS);
  const workosCallback = trpc.auth.workosCallback.useMutation();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      const state = searchParams.get('state');
      
      // Handle OAuth errors from WorkOS
      if (error) {
        console.error('OAuth error:', error, errorDescription);
        let userFriendlyError = 'Authentication failed. Please try again.';
        
        switch (error) {
          case 'access_denied':
            userFriendlyError = 'Access was denied. Please contact your administrator or try again.';
            break;
          case 'invalid_request':
            userFriendlyError = 'Invalid authentication request. This might be due to a misconfigured redirect URI.';
            break;
          case 'server_error':
            userFriendlyError = 'Server error occurred during authentication. Please try again later.';
            break;
          case 'temporarily_unavailable':
            userFriendlyError = 'Authentication service is temporarily unavailable. Please try again later.';
            break;
          default:
            if (errorDescription) {
              userFriendlyError = errorDescription;
            }
        }
        
        setError(userFriendlyError);
        setLoading(false);
        return;
      }
      
      // Validate that we have a code parameter
      if (!code) {
        setError('No authorization code received. Please try signing in again.');
        setLoading(false);
        return;
      }
      
      // Optional: Validate state parameter for CSRF protection
      // You would need to store the original state in localStorage when redirecting to WorkOS
      
      try {
        const result = await workosCallback.mutateAsync({ code });
        
        // Validate the profile response
        if (!result.profile || !result.profile.id || !result.profile.email) {
          throw new Error('Invalid profile data received from authentication service');
        }
        
        // Store the ID token for Convex authentication
        if (result.idToken) {
          localStorage.setItem('workos_id_token', result.idToken);
        }
        
        // Set user profile and token
        setUserProfile({
          id: result.profile.id,
          email: result.profile.email,
          firstName: result.profile.firstName || '',
          lastName: result.profile.lastName || '',
          profilePictureUrl: result.profile.picture || undefined,
        });
        
        // Set the auth token (for legacy compatibility)
        setAuthToken(result.accessToken || 'authenticated');
        
        // Sync user with Convex database
        try {
          await createOrUpdateUser({
            email: result.profile.email,
            fullName: result.profile.firstName && result.profile.lastName 
              ? `${result.profile.firstName} ${result.profile.lastName}` 
              : result.profile.firstName || result.profile.lastName || undefined,
            avatarUrl: result.profile.picture || undefined,
          });
        } catch (convexError) {
          console.error('Failed to sync user with Convex:', convexError);
          // Continue anyway - user is authenticated, just not synced to DB yet
        }
        
        // Redirect to chat page on success
        navigate('/chat');
      } catch (error) {
        console.error('OAuth callback error:', error);
        
        let errorMessage = 'Failed to complete authentication. Please try again.';
        
        if (error instanceof Error) {
          // Handle specific error cases
          if (error.message.includes('redirect URI')) {
            errorMessage = 'Authentication configuration error. The redirect URI may not be properly configured in WorkOS Dashboard.';
          } else if (error.message.includes('Invalid profile')) {
            errorMessage = 'Invalid user data received. Please contact support if this continues.';
          } else if (error.message.includes('Failed to exchange code')) {
            errorMessage = 'Unable to verify authentication. Please check your network connection and try again.';
          }
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, setUserProfile, setAuthToken, navigate]);

  const handleRetry = () => {
    navigate('/');
  };

  const handleContactSupport = () => {
    // You can customize this to your support email or contact form
    window.open('mailto:support@yourdomain.com?subject=Authentication Issue', '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <p className="text-white">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Authentication Error</h1>
            <p className="text-gray-300">We encountered an issue during sign-in</p>
          </div>
          
          <Alert className="bg-red-900/20 border-red-500/50">
            <AlertDescription className="text-red-200">
              {error}
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleRetry}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </Button>
            <Button 
              onClick={handleContactSupport}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Contact Support
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-400">
              If this problem persists, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback; 