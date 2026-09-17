'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from './types';
import { INITIAL_USER, INITIAL_CREATOR } from './store';

export const ADMIN_USER: UserProfile = {
  id: 'usr_admin_001',
  name: 'DataBounty Master Admin',
  email: 'support@databounty.sampidia.com',
  phone: '+2348000000000',
  gender: 'Male',
  country: 'Nigeria',
  state: 'FCT Abuja',
  deviceBrand: 'Server',
  deviceModel: 'Admin Node',
  osVersion: 'Linux',
  bankName: 'Central Bank of Nigeria',
  accountNumber: '0000000000',
  accountName: 'DATABOUNTY PLATFORM ADMIN',
  walletBalance: 1250000,
  escrowBalance: 0,
  role: 'admin'
};

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | 'guest';
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authModalRole: UserRole;
  login: (role: UserRole, email?: string, name?: string) => void;
  logout: () => void;
  openAuthModal: (defaultRole?: UserRole) => void;
  closeAuthModal: () => void;
  updateUser: (updatedUser: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<UserRole>('tester');

  // Load auth state from localStorage on mount if available
  useEffect(() => {
    const savedUser = localStorage.getItem('databounty_auth_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        setUser(null);
      }
    }
  }, []);

  const login = (selectedRole: UserRole, email?: string, name?: string) => {
    let loggedUser: UserProfile;
    if (selectedRole === 'admin') {
      loggedUser = { ...ADMIN_USER, email: email || ADMIN_USER.email };
    } else if (selectedRole === 'creator') {
      loggedUser = {
        ...INITIAL_CREATOR,
        email: email || INITIAL_CREATOR.email,
        name: name || INITIAL_CREATOR.name,
      };
    } else {
      loggedUser = {
        ...INITIAL_USER,
        email: email || INITIAL_USER.email,
        name: name || INITIAL_USER.name,
      };
    }
    setUser(loggedUser);
    localStorage.setItem('databounty_auth_user', JSON.stringify(loggedUser));
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('databounty_auth_user');
  };

  const openAuthModal = (defaultRole: UserRole = 'tester') => {
    setAuthModalRole(defaultRole);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const updateUser = (updatedProps: Partial<UserProfile>) => {
    if (!user) return;
    const newProfile = { ...user, ...updatedProps };
    setUser(newProfile);
    localStorage.setItem('databounty_auth_user', JSON.stringify(newProfile));
  };

  const currentRole: UserRole | 'guest' = user ? user.role : 'guest';

  return (
    <AuthContext.Provider
      value={{
        user,
        role: currentRole,
        isAuthenticated: !!user,
        isAuthModalOpen,
        authModalRole,
        login,
        logout,
        openAuthModal,
        closeAuthModal,
        updateUser,
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
