'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  quickLogin: (role: Role) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('markethub_token');
    if (savedToken) {
      setToken(savedToken);
      api.auth.me()
        .then((userData: any) => {
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('markethub_token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res: any = await api.auth.login({ email, password });
      localStorage.setItem('markethub_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res: any = await api.auth.register(data);
      localStorage.setItem('markethub_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('markethub_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userData: any = await api.auth.me();
      setUser(userData);
    } catch {
      logout();
    }
  };

  const quickLogin = async (role: Role) => {
    const credentialsMap: Record<Role, string> = {
      ADMIN: 'admin@markethub.com',
      VENDOR: 'vendor@markethub.com',
      CUSTOMER: 'customer@markethub.com',
      DELIVERY_PARTNER: 'delivery@markethub.com',
    };
    return login(credentialsMap[role], 'Password@123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        quickLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
