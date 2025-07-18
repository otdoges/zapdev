import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Sparkles, ArrowRight, AlertCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useWorkOSAuth } from "@/hooks/useWorkOSAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { exchangeCodeForTokens } from "@/lib/workos";

const Auth = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, setUserProfile, setAuthToken } = useWorkOSAuth();

  // Handle OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      if (code) {
        setLoading(true);
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
          setError('Authentication failed. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };

    handleCallback();
  }, [searchParams, setUserProfile, setAuthToken, navigate]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !searchParams.get('code')) {
      navigate('/chat');
    }
  }, [user, navigate, searchParams]);

  const handleSignIn = async () => {
    setError('');
    setLoading(true);
    
    try {
      await signIn();
    } catch (error) {
      console.error('Sign in error:', error);
      setError('Failed to initiate sign in. Please try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <p className="text-white">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
          <CardHeader className="text-center">
            <motion.div
              className="flex items-center justify-center mb-4"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </motion.div>
            <CardTitle className="text-2xl font-bold text-white">
              Welcome to ZapDev
            </CardTitle>
            <CardDescription className="text-gray-300">
              Sign in to continue to your AI development assistant
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <Button
                onClick={handleSignIn}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 h-11 text-base font-medium"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Sign in with WorkOS</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>

              <Separator className="bg-white/20" />

              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Secure authentication powered by WorkOS
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;