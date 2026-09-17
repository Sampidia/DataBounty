'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from './types';
import { auth, db } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | 'guest';
  isAuthenticated: boolean;
  isAdminAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authModalRole: UserRole;
  login: (email: string, pass: string, role?: UserRole) => Promise<void>;
  signup: (email: string, pass: string, role: UserRole, name: string) => Promise<void>;
  logout: () => Promise<void>;
  openAuthModal: (defaultRole?: UserRole) => void;
  closeAuthModal: () => void;
  updateUser: (updatedUser: Partial<UserProfile>) => Promise<void>;
  setAdminAuthenticated: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<UserRole>('tester');
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

    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const profileData = userSnap.data() as UserProfile;
            setUser(profileData);
            localStorage.setItem('databounty_auth_user', JSON.stringify(profileData));
          }
        } catch (err) {
          console.warn('[AuthContext] Firestore user fetch error:', err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string, targetRole: UserRole = 'tester') => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const userDocRef = doc(db, 'users', cred.user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const profile = userSnap.data() as UserProfile;
        if (targetRole && targetRole !== 'admin' && profile.role !== targetRole) {
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

  const signup = async (email: string, pass: string, userRole: UserRole, name: string) => {
    // Admin signup via public form is strictly forbidden
    const safeRole: UserRole = userRole === 'admin' ? 'tester' : userRole;

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const newProfile: UserProfile = {
        id: cred.user.uid,
        name: name || email.split('@')[0],
        email: email,
        phone: '+2348000000000',
        gender: 'Female',
        country: 'Nigeria',
        state: 'Lagos',
        deviceBrand: 'Mobile',
        deviceModel: 'Smartphone',
        osVersion: 'Android 14',
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
    } catch (err: any) {
      // Local fallback creation with 0 balance
      const newProfile: UserProfile = {
        id: `usr_${Date.now()}`,
        name: name || email.split('@')[0],
        email: email,
        phone: '+2348000000000',
        gender: 'Female',
        country: 'Nigeria',
        state: 'Lagos',
        deviceBrand: 'Mobile',
        deviceModel: 'Smartphone',
        osVersion: 'Android 14',
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

  const setAdminAuthenticated = (val: boolean) => {
    setIsAdminAuthenticated(val);
    if (val) {
      localStorage.setItem('databounty_admin_session', 'true');
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
        login,
        signup,
        logout,
        openAuthModal,
        closeAuthModal,
        updateUser,
        setAdminAuthenticated,
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
