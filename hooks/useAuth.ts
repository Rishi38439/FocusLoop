'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
}

type AuthContextValue = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function readResponse(response: Response): Promise<{ user?: AuthUser; error?: string }> {
  try {
    return await response.json() as { user?: AuthUser; error?: string };
  } catch {
    return { error: 'The server returned an invalid response.' };
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
          cache: 'no-store', 
          credentials: 'same-origin',
          headers: { 'Cache-Control': 'no-cache' },
        });
        const result = await readResponse(response);
        if (response.ok && result.user) {
          setUser(result.user);
        } else {
          setUser(null);
        }
    } catch {
      setError('Unable to verify your session.');
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      await refreshSession();
      setIsLoading(false);
    })();
  }, [refreshSession]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST', 
        credentials: 'same-origin' 
      });
    } finally {
      setUser(null);
      setError(null);
    }
  }, []);

  return React.createElement(AuthContext.Provider, {
      value: {
      isAuthenticated: Boolean(user), 
      user, 
      isLoading, 
      error, 
        refreshSession,
      logout, 
      clearError: () => setError(null) 
    },
  }, children);
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

