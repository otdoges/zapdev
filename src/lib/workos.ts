// Browser-compatible WorkOS authentication
// Note: WorkOS Node.js SDK cannot be used in browser environment

// Environment detection
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Validate redirect URI format
const validateRedirectUri = (uri: string): boolean => {
  try {
    const url = new URL(uri);
    
    // In production, ensure HTTPS (except for 127.0.0.1)
    if (isProduction && url.protocol === 'http:' && url.hostname !== '127.0.0.1') {
      console.warn('Production redirect URI should use HTTPS');
      return false;
    }
    
    // Ensure proper path
    if (!url.pathname.endsWith('/auth/callback')) {
      console.warn('Redirect URI should end with /auth/callback');
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

// Get fallback redirect URI based on environment (only as last resort)
const getFallbackRedirectUri = (): string => {
  if (typeof window === 'undefined') {
    // Server-side rendering fallback
    return isDevelopment ? 'http://localhost:5173/auth/callback' : 'https://zapdev.link/auth/callback';
  }
  
  const origin = window.location.origin;
  return `${origin}/auth/callback`;
};

// WorkOS configuration for browser
export const workosConfig = {
  clientId: import.meta.env.VITE_WORKOS_CLIENT_ID,
  domain: import.meta.env.VITE_WORKOS_DOMAIN,
  connectionId: import.meta.env.VITE_WORKOS_CONNECTION_ID,
  redirectUri: import.meta.env.VITE_WORKOS_REDIRECT_URI || getFallbackRedirectUri(),
};

// Validate configuration on load
if (!workosConfig.clientId) {
  console.error('VITE_WORKOS_CLIENT_ID is required for WorkOS authentication');
}

if (!workosConfig.domain && !workosConfig.connectionId) {
  console.error('Either VITE_WORKOS_DOMAIN or VITE_WORKOS_CONNECTION_ID is required for WorkOS authentication');
}

if (workosConfig.domain && workosConfig.connectionId) {
  console.warn('Both VITE_WORKOS_DOMAIN and VITE_WORKOS_CONNECTION_ID are set. Connection ID will take precedence.');
}

if (!workosConfig.redirectUri) {
  console.error('VITE_WORKOS_REDIRECT_URI is required. Please set it in your environment variables.');
  console.error('Expected format: https://zapdev.link/auth/callback');
}

if (!validateRedirectUri(workosConfig.redirectUri)) {
  console.error('Invalid redirect URI configuration:', workosConfig.redirectUri);
  console.error('Make sure this URI is configured in your WorkOS dashboard exactly as shown.');
}

// Log configuration for debugging (remove in production)
if (isDevelopment) {
  console.log('WorkOS Config:', {
    clientId: workosConfig.clientId ? '✓ Set' : '✗ Missing',
    domain: workosConfig.domain || 'Not set',
    connectionId: workosConfig.connectionId || 'Not set',
    redirectUri: workosConfig.redirectUri,
    flow: workosConfig.connectionId ? 'Connection-based' : workosConfig.domain ? 'Domain-based' : 'Not configured',
  });
}

// Generate authorization URL for sign-in (browser-compatible)
export const getAuthorizationUrl = (customRedirectUri?: string) => {
  const redirectUri = customRedirectUri || workosConfig.redirectUri;
  
  if (!redirectUri) {
    throw new Error('Redirect URI is required. Please set VITE_WORKOS_REDIRECT_URI in your environment variables.');
  }
  
  // Validate the redirect URI
  if (!validateRedirectUri(redirectUri)) {
    throw new Error(`Invalid redirect URI: ${redirectUri}. Make sure it matches your WorkOS dashboard configuration.`);
  }
  
  const params = new URLSearchParams({
    client_id: workosConfig.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state: crypto.randomUUID(), // Use browser crypto API
  });

  // WorkOS SSO flow selection
  if (workosConfig.connectionId) {
    // Connection-based flow (single IdP)
    params.append('connection', workosConfig.connectionId);
  } else if (workosConfig.domain) {
    // Domain-based flow (auto-select per organization)
    params.append('domain', workosConfig.domain);
  } else {
    throw new Error('Either VITE_WORKOS_CONNECTION_ID or VITE_WORKOS_DOMAIN must be configured');
  }
  
  const authUrl = `https://api.workos.com/sso/authorize?${params.toString()}`;
  
  if (isDevelopment) {
    console.log('Generated auth URL:', authUrl);
    console.log('Using redirect URI:', redirectUri);
  }
  
  return authUrl;
};

// Direct redirect to WorkOS for authentication
export const redirectToWorkOS = (customRedirectUri?: string) => {
  try {
    const authUrl = getAuthorizationUrl(customRedirectUri);
    console.log('Redirecting to WorkOS with URI:', customRedirectUri || workosConfig.redirectUri);
    window.location.href = authUrl;
  } catch (error) {
    console.error('Failed to redirect to WorkOS:', error);
    // You might want to show a user-friendly error message here
    throw error;
  }
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
      throw new Error(`Failed to exchange code for tokens: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Store the ID token for Convex authentication
    if (data.idToken) {
      localStorage.setItem('workos_id_token', data.idToken);
    }
    
    return data.profile;
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    
    // Only use fallback in development
    if (isDevelopment) {
      console.log('Using mock profile for development');
      
      // Create a mock JWT token for development
      const mockJWT = createMockJWT();
      localStorage.setItem('workos_id_token', mockJWT);
      
      const mockProfile = {
        id: `user_${Date.now()}`,
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        picture: undefined,
      };
      
      return mockProfile;
    }
    
    // In production, throw the error
    throw error;
  }
};

// Create a mock JWT for development
const createMockJWT = (): string => {
  const header = btoa(JSON.stringify({
    alg: 'RS256',
    typ: 'JWT'
  }));
  
  const payload = btoa(JSON.stringify({
    iss: 'https://api.workos.com',
    aud: workosConfig.clientId,
    sub: `user_${Date.now()}`,
    email: 'user@example.com',
    given_name: 'John',
    family_name: 'Doe',
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    iat: Math.floor(Date.now() / 1000),
  }));
  
  // Mock signature (in real JWT this would be properly signed)
  const signature = btoa('mock-signature');
  
  return `${header}.${payload}.${signature}`;
};

// Sign out helper
export const signOut = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userProfile');
  localStorage.removeItem('workos_id_token');
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
};
