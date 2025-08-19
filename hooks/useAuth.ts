import { useState, useEffect } from 'react';

// Placeholder auth hook - replace with your actual authentication implementation
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token
    const storedToken = localStorage.getItem('lexchronos-token');
    if (storedToken) {
      setToken(storedToken);
      // Decode token to get user info (simplified)
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        setUser({
          id: payload.userId,
          name: payload.name || 'User',
          email: payload.email,
          role: payload.role || 'client'
        });
      } catch (e) {
        console.error('Failed to decode token:', e);
        localStorage.removeItem('lexchronos-token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string) => {
    // Implement your login logic here
    // For demo purposes, create a mock token
    const mockToken = btoa(JSON.stringify({
      userId: 'demo-user-id',
      name: 'Demo User',
      email: email,
      role: 'lawyer',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 // 24 hours
    }));
    
    localStorage.setItem('lexchronos-token', mockToken);
    setToken(mockToken);
    setUser({
      id: 'demo-user-id',
      name: 'Demo User',
      email: email,
      role: 'lawyer'
    });
  };

  const logout = () => {
    localStorage.removeItem('lexchronos-token');
    setToken(null);
    setUser(null);
  };

  return {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated: !!token
  };
};