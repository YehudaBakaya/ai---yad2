import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { getUserProfile } from '../services/firestoreService';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

// Sync Firebase user to MongoDB in the background
const syncToMongo = (firebaseUser, phone = null) => {
  if (!firebaseUser) return;
  authAPI.firebaseSync({
    uid:    firebaseUser.uid,
    name:   firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'משתמש',
    email:  firebaseUser.email,
    avatar: firebaseUser.photoURL || null,
    phone:  phone || null,
  }).catch(() => {});
};

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Set user immediately — don't wait for Firestore profile
        setUser({
          id:     firebaseUser.uid,
          name:   firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'משתמש',
          email:  firebaseUser.email,
          phone:  null,
          avatar: firebaseUser.photoURL || null,
        });
        // Fetch phone + sync to MongoDB in background (non-blocking)
        getUserProfile(firebaseUser.uid)
          .then((profile) => {
            if (profile?.phone) {
              setUser(prev => prev ? { ...prev, phone: profile.phone } : prev);
            }
            syncToMongo(firebaseUser, profile?.phone || null);
          })
          .catch(() => { syncToMongo(firebaseUser); });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Called directly after sign-in/register with the Firebase user object
  const syncUser = useCallback(async (firebaseUser) => {
    const u = firebaseUser || auth.currentUser;
    if (!u) return;
    const profile = await getUserProfile(u.uid).catch(() => null);
    const userData = {
      id:     u.uid,
      name:   u.displayName || u.email?.split('@')[0] || 'משתמש',
      email:  u.email,
      phone:  profile?.phone || null,
      avatar: u.photoURL || null,
    };
    setUser(userData);
    syncToMongo(u, userData.phone);
  }, []);

  // Optimistic partial update — no async calls needed
  const updateUser = useCallback((partial) => {
    setUser(prev => prev ? { ...prev, ...partial } : prev);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout, syncUser, updateUser, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
