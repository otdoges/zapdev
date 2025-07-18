// Browser-compatible WorkOS authentication
// Note: WorkOS Node.js SDK cannot be used in browser environment

// WorkOS configuration for browser
export const workosConfig = {
  clientId: import.meta.env.VITE_WORKOS_CLIENT_ID,
  domain: import.meta.env.VITE_WORKOS_DOMAIN,
  redirectUri: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
};

// Generate authorization URL for sign-in (browser-compatible)
export const getAuthorizationUrl = () => {
  const params = new URLSearchParams({
    client_id: workosConfig.clientId,
    redirect_uri: workosConfig.redirectUri,
    response_type: 'code',
    state: crypto.randomUUID(), // Use browser crypto API
  });

  // For SSO with domain hint
  if (workosConfig.domain) {
    params.append('domain_hint', workosConfig.domain);
  }
  
  return `https://api.workos.com/sso/authorize?${params.toString()}`;
};

// Direct redirect to WorkOS for authentication
export const redirectToWorkOS = () => {
  const authUrl = getAuthorizationUrl();
  window.location.href = authUrl;
};

// Exchange code for tokens (this should typically be done on your backend)
// For demo purposes, this is a mock implementation
export const exchangeCodeForTokens = async (code: string) => {
  try {
    // In a real implementation, you would send this code to your backend
    // which would then exchange it with WorkOS for the actual profile
    // For now, we'll return a mock profile
    
    // Mock profile data (replace with actual backend call)
    const mockProfile = {
      id: `user_${Date.now()}`,
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      picture: undefined,
    };
    
    console.log('Mock profile exchange for code:', code);
    return mockProfile;
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw error;
  }
};

// Sign out helper
export const signOut = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userProfile');
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
}; 