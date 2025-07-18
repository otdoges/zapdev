import { useState, useEffect } from 'react';
import { getAuthorizationUrl, signOut } from '@/lib/workos';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
}

export const useWorkOSAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user profile on mount
    const storedProfile = localStorage.getItem('userProfile');
    const storedToken = localStorage.getItem('authToken');
    
    if (storedProfile && storedToken) {
      try {
        const profile = JSON.parse(storedProfile);
        setUser(profile);
      } catch (error) {
        console.error('Error parsing stored profile:', error);
        localStorage.removeItem('userProfile');
        localStorage.removeItem('authToken');
      }
    }
    
    setLoading(false);
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const authUrl = getAuthorizationUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error initiating sign in:', error);
      setLoading(false);
      return { error };
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      signOut();
      setUser(null);
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const setUserProfile = (profile: User) => {
    setUser(profile);
    localStorage.setItem('userProfile', JSON.stringify(profile));
  };

  const setAuthToken = (token: string) => {
    localStorage.setItem('authToken', token);
  };

  return {
    user,
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
    setUserProfile,
    setAuthToken,
  };
}; 