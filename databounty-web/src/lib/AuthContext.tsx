'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, DeviceSpec } from './types';
import { auth, db } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | 'guest';
  isAuthenticated: boolean;
  isAdminAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authModalRole: UserRole;
  needsTesterOnboarding: boolean;
  login: (email: string, pass: string, role?: UserRole) => Promise<void>;
  signup: (
    email: string,
    pass: string,
    role: UserRole,
    name: string,
    demographics?: { gender: 'Male' | 'Female'; state: string; phone: string },
    devices?: DeviceSpec[]
  ) => Promise<void>;
  logout: () => Promise<void>;
  openAuthModal: (defaultRole?: UserRole) => void;
  closeAuthModal: () => void;
  updateUser: (updatedUser: Partial<UserProfile>) => Promise<void>;
  setAdminAuthenticated: (val: boolean) => void;
  setNeedsTesterOnboarding: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<UserRole>('tester');
  const [needsTesterOnboarding, setNeedsTesterOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load auth state from Firebase & localStorage fallback
  useEffect(() => {
    const savedUser = localStorage.getItem('databounty_auth_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        setUser(null);
      }
    }

    const savedAdmin = localStorage.getItem('databounty_admin_session');
    if (savedAdmin === 'true') {
      setIsAdminAuthenticated(true);
    }

    let unsubUserDoc: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }
      if (fbUser) {
        try {
          const idTokenResult = await fbUser.getIdTokenResult();
          if (idTokenResult.claims.admin) {
            setIsAdminAuthenticated(true);
          }
          const userDocRef = doc(db, 'users', fbUser.uid);
          unsubUserDoc = onSnapshot(
            userDocRef,
            (userSnap) => {
              if (userSnap.exists()) {
                const profileData = userSnap.data() as UserProfile;
                // If account becomes suspended while session is active, sign out
                if (profileData.status === 'suspended') {
                  firebaseSignOut(auth).catch(() => {});
                  setUser(null);
                  localStorage.removeItem('databounty_auth_user');
                  // Signal suspension state via a global localStorage flag so AuthModal can show notice
                  localStorage.setItem('databounty_suspended_notice', 'true');
                  return;
                }
                setUser(profileData);
                localStorage.setItem('databounty_auth_user', JSON.stringify(profileData));
              }
            },
            (err) => {
              console.warn('[AuthContext] Firestore user snapshot listener error:', err);
            }
          );
        } catch (err) {
          console.warn('[AuthContext] Firestore user fetch error:', err);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);

  const login = async (email: string, pass: string, targetRole: UserRole = 'tester') => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const userDocRef = doc(db, 'users', cred.user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const profile = userSnap.data() as UserProfile;

        // Suspension enforcement: block login for suspended accounts
        if (profile.status === 'suspended') {
          await firebaseSignOut(auth);
          setUser(null);
          localStorage.removeItem('databounty_auth_user');
          const err = new Error('ACCOUNT_SUSPENDED');
          err.name = 'ACCOUNT_SUSPENDED';
          throw err;
        }

        if (targetRole && targetRole !== 'admin' && profile.role !== targetRole) {
          // If switching creator → tester, flag onboarding if no devices set
          if (targetRole === 'tester' && (!profile.devices || profile.devices.length === 0)) {
            setNeedsTesterOnboarding(true);
          }
          profile.role = targetRole;
          await updateDoc(userDocRef, { role: targetRole });
        }
        setUser(profile);
        localStorage.setItem('databounty_auth_user', JSON.stringify(profile));
      } else {
        // Create user profile document if missing
        const newProfile: UserProfile = {
          id: cred.user.uid,
          name: email.split('@')[0],
          email: email,
          phone: '+2340000000000',
          gender: 'Female',
          country: 'Nigeria',
          state: 'Lagos',
          deviceBrand: 'Android Device',
          deviceModel: 'Generic Mobile',
          osVersion: 'Android 14',
          bankName: '',
          accountNumber: '',
          accountName: email.split('@')[0].toUpperCase(),
          walletBalance: 0,
          escrowBalance: 0,
          role: targetRole === 'admin' ? 'tester' : targetRole,
        };
        await setDoc(userDocRef, newProfile);
        setUser(newProfile);
        localStorage.setItem('databounty_auth_user', JSON.stringify(newProfile));
      }
      setIsAuthModalOpen(false);
    } catch (err: any) {
      if (err.name === 'ACCOUNT_SUSPENDED' || err.message === 'ACCOUNT_SUSPENDED') {
        setUser(null);
        localStorage.removeItem('databounty_auth_user');
        throw err;
      }
      // Fallback for local testing if Firebase auth is unconfigured
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        throw new Error('Invalid credentials or user account not found. Please register first.');
      } else {
        // Fallback profile creation with 0 balance
        const localUser: UserProfile = {
          id: `usr_${Date.now()}`,
          name: email.split('@')[0],
          email: email,
          phone: '+2348000000000',
          gender: 'Female',
          country: 'Nigeria',
          state: 'Lagos',
          deviceBrand: 'Samsung',
          deviceModel: 'Galaxy',
          osVersion: 'Android 14',
          bankName: '',
          accountNumber: '',
          accountName: email.split('@')[0].toUpperCase(),
          walletBalance: 0,
          escrowBalance: 0,
          role: targetRole === 'admin' ? 'tester' : targetRole,
        };
        setUser(localUser);
        localStorage.setItem('databounty_auth_user', JSON.stringify(localUser));
        setIsAuthModalOpen(false);
      }
    }
  };

  const signup = async (
    email: string,
    pass: string,
    userRole: UserRole,
    name: string,
    demographics?: { gender: 'Male' | 'Female'; state: string; phone: string },
    devices?: DeviceSpec[]
  ) => {
    // Admin signup via public form is strictly forbidden
    const safeRole: UserRole = userRole === 'admin' ? 'tester' : userRole;

    const gender = demographics?.gender ?? 'Female';
    const state = demographics?.state ?? 'Lagos';
    const phone = demographics?.phone ?? '+2348000000000';

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const newProfile: UserProfile = {
        id: cred.user.uid,
        name: name || email.split('@')[0],
        email: email,
        phone,
        gender,
        country: 'Nigeria',
        state,
        devices: devices ?? [],
        bankName: '',
        accountNumber: '',
        accountName: (name || email.split('@')[0]).toUpperCase(),
        walletBalance: 0, // MUST start at 0
        escrowBalance: 0,
        role: safeRole,
      };

      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      setUser(newProfile);
      localStorage.setItem('databounty_auth_user', JSON.stringify(newProfile));
      setIsAuthModalOpen(false);

      // Trigger welcome email notification (non-blocking)
      fetch('/api/email/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || email.split('@')[0],
          role: safeRole,
        }),
      }).catch((err) => console.warn('[Welcome Email Send Warning]', err));
    } catch (err: any) {
      // Local fallback creation with 0 balance
      const newProfile: UserProfile = {
        id: `usr_${Date.now()}`,
        name: name || email.split('@')[0],
        email: email,
        phone,
        gender,
        country: 'Nigeria',
        state,
        devices: devices ?? [],
        bankName: '',
        accountNumber: '',
        accountName: (name || email.split('@')[0]).toUpperCase(),
        walletBalance: 0, // MUST start at 0
        escrowBalance: 0,
        role: safeRole,
      };
      setUser(newProfile);
      localStorage.setItem('databounty_auth_user', JSON.stringify(newProfile));
      setIsAuthModalOpen(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {}
    setUser(null);
    setIsAdminAuthenticated(false);
    localStorage.removeItem('databounty_auth_user');
    localStorage.removeItem('databounty_admin_session');
  };

  const setAdminAuthenticated = async (val: boolean) => {
    setIsAdminAuthenticated(val);
    if (val) {
      localStorage.setItem('databounty_admin_session', 'true');
      if (auth.currentUser) {
        try {
          await auth.currentUser.getIdToken(true);
        } catch (err) {
          console.warn('[AuthContext] Token refresh failed:', err);
        }
      }
    } else {
      localStorage.removeItem('databounty_admin_session');
    }
  };

  const openAuthModal = (defaultRole: UserRole = 'tester') => {
    // Admin tab is excluded from public modal
    const safeRole = defaultRole === 'admin' ? 'tester' : defaultRole;
    setAuthModalRole(safeRole);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const updateUser = async (updatedProps: Partial<UserProfile>) => {
    if (!user) return;
    const newProfile = { ...user, ...updatedProps };
    setUser(newProfile);
    localStorage.setItem('databounty_auth_user', JSON.stringify(newProfile));

    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, updatedProps);
    } catch (err) {
      console.warn('[AuthContext] Firestore user update fallback:', err);
    }
  };

  const currentRole: UserRole | 'guest' = user ? user.role : 'guest';

  return (
    <AuthContext.Provider
      value={{
        user,
        role: currentRole,
        isAuthenticated: !!user,
        isAdminAuthenticated,
        isAuthModalOpen,
        authModalRole,
        needsTesterOnboarding,
        login,
        signup,
        logout,
        openAuthModal,
        closeAuthModal,
        updateUser,
        setAdminAuthenticated,
        setNeedsTesterOnboarding,
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
