import { WorkOS } from '@workos-inc/node';

// WorkOS client for server-side operations
export const workos = new WorkOS(import.meta.env.VITE_WORKOS_API_KEY);

// WorkOS configuration
export const workosConfig = {
  clientId: import.meta.env.VITE_WORKOS_CLIENT_ID,
  domain: import.meta.env.VITE_WORKOS_DOMAIN,
  redirectUri: `${window.location.origin}/auth/callback`,
};

// Generate authorization URL for sign-in
export const getAuthorizationUrl = () => {
  const authorizationUrl = workos.sso.getAuthorizationUrl({
    clientId: workosConfig.clientId,
    redirectUri: workosConfig.redirectUri,
    domainHint: workosConfig.domain,
  });
  
  return authorizationUrl;
};

// Exchange code for tokens (this would typically be done on the server)
export const exchangeCodeForTokens = async (code: string) => {
  try {
    const profile = await workos.sso.getProfile({
      code,
      clientId: workosConfig.clientId,
    });
    
    return profile;
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw error;
  }
};

// Sign out helper
export const signOut = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userProfile');
  window.location.href = '/';
}; 