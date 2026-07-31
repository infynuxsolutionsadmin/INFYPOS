'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { decodeJwt } from '../utils/jwt';
import { DecodedJwt, UserProfile } from '../types/auth';
import { authService } from '../services/auth';

interface AuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  decoded: DecodedJwt | null;
  profile: UserProfile | null;
  userRole: string; // 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'GUEST'
  isAuthenticated: boolean;
  loginState: (access: string, refresh: string) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  accessToken: null,
  refreshToken: null,
  decoded: null,
  profile: null,
  userRole: 'GUEST',
  isAuthenticated: false,
  loginState: () => {},
  logout: () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  });
  const [refreshToken, setRefreshToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken');
    }
    return null;
  });
  const [decoded, setDecoded] = useState<DecodedJwt | null>(() => {
    if (typeof window !== 'undefined') {
      const access = localStorage.getItem('accessToken');
      if (access) {
        return decodeJwt(access);
      }
    }
    return null;
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const loadStateFromStorage = () => {
    if (typeof window !== 'undefined') {
      const access = localStorage.getItem('accessToken');
      const refresh = localStorage.getItem('refreshToken');
      setAccessToken(access);
      setRefreshToken(refresh);
      if (access) {
        const claims = decodeJwt(access);
        setDecoded(claims);
      } else {
        setDecoded(null);
      }
    }
  };

  const fetchProfile = async () => {
    const access = localStorage.getItem('accessToken');
    if (!access) return;
    try {
      const res = await authService.getProfile();
      setProfile(res.data);
    } catch {
      // Profile load fallback silently handled by interceptor
    }
  };

  useEffect(() => {
    // Sync state and load user details
    loadStateFromStorage();
    fetchProfile();
  }, []);

  const loginState = (access: string, refresh: string) => {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    loadStateFromStorage();
    fetchProfile();
  };

  const logout = async () => {
    const refresh = localStorage.getItem('refreshToken');
    if (refresh) {
      try {
        await authService.logout(refresh);
      } catch {
        // Ignore revocation error on client side logout
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAccessToken(null);
    setRefreshToken(null);
    setDecoded(null);
    setProfile(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const userRole = (
    profile?.role?.name ||
    decoded?.roleName ||
    (decoded?.roleId === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN')
  ).toUpperCase();

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        refreshToken,
        decoded,
        profile,
        userRole,
        isAuthenticated: !!accessToken,
        loginState,
        logout,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
