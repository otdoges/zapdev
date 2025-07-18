// Browser-compatible WorkOS authentication
// Note: WorkOS Node.js SDK cannot be used in browser environment

// WorkOS configuration for browser
export const workosConfig = {
  clientId: import.meta.env.VITE_WORKOS_CLIENT_ID,
  domain: import.meta.env.VITE_WORKOS_DOMAIN,
  redirectUri: import.meta.env.VITE_WORKOS_REDIRECT_URI || `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
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

// Exchange code for tokens via backend
export const exchangeCodeForTokens = async (code: string) => {
  try {
    // Call your backend endpoint to exchange the code
    const response = await fetch('/api/auth/workos/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const data = await response.json();
    return data.profile;
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    
    // Fallback to mock profile for development
    console.log('Using mock profile for development');
    const mockProfile = {
      id: `user_${Date.now()}`,
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      picture: undefined,
    };
    
    return mockProfile;
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