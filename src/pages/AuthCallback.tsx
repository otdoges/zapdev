import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useWorkOSAuth } from "@/hooks/useWorkOSAuth";
import { exchangeCodeForTokens } from "@/lib/workos";

const AuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUserProfile, setAuthToken } = useWorkOSAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      
      if (error) {
        console.error('OAuth error:', error);
        navigate('/?error=auth_failed');
        return;
      }
      
      if (code) {
        try {
          const profile = await exchangeCodeForTokens(code);
          
          // Set user profile and token
          setUserProfile({
            id: profile.id,
            email: profile.email,
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            profilePictureUrl: profile.picture || undefined,
          });
          
          // In a real implementation, you'd get a JWT token from WorkOS
          // For now, we'll use a placeholder
          setAuthToken('placeholder-jwt-token');
          
          navigate('/chat');
        } catch (error) {
          console.error('OAuth callback error:', error);
          navigate('/?error=auth_failed');
        }
      } else {
        // No code parameter, redirect home
        navigate('/');
      }
    };

    handleCallback();
  }, [searchParams, setUserProfile, setAuthToken, navigate]);

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

  return null;
};

export default AuthCallback; 