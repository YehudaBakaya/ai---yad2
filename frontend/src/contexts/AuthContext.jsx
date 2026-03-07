import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { getUserProfile } from '../services/firestoreService';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

// Sync Firebase user to MongoDB — returns MongoDB user (includes saved avatar)
const syncToMongo = async (firebaseUser, phone = null) => {
  if (!firebaseUser) return null;
  try {
    const { data } = await authAPI.firebaseSync({
      uid:    firebaseUser.uid,
      name:   firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'משתמש',
      email:  firebaseUser.email,
      avatar: firebaseUser.photoURL || null,
      phone:  phone || null,
    });
    return data.user || null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Set user immediately from Firebase — don't wait for Firestore/MongoDB
        setUser({
          id:     firebaseUser.uid,
          name:   firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'משתמש',
          email:  firebaseUser.email,
          phone:  null,
          avatar: firebaseUser.photoURL || null,
        });

        // Background: load phone/isAdmin from Firestore + avatar from MongoDB
        Promise.all([
          getUserProfile(firebaseUser.uid).catch(() => null),
          syncToMongo(firebaseUser),
        ]).then(([profile, mongoUser]) => {
          const updates = {};
          if (profile?.phone)    updates.phone   = profile.phone;
          if (profile?.isAdmin)  updates.isAdmin = true;
          // MongoDB avatar takes priority (user may have uploaded a custom base64 avatar)
          if (mongoUser?.avatar) updates.avatar  = mongoUser.avatar;
          if (Object.keys(updates).length) {
            setUser(prev => prev ? { ...prev, ...updates } : prev);
          }
        });
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
    const [profile, mongoUser] = await Promise.all([
      getUserProfile(u.uid).catch(() => null),
      syncToMongo(u),
    ]);
    const userData = {
      id:      u.uid,
      name:    u.displayName || u.email?.split('@')[0] || 'משתמש',
      email:   u.email,
      phone:   profile?.phone   || null,
      avatar:  mongoUser?.avatar || u.photoURL || null,
      isAdmin: profile?.isAdmin || false,
    };
    setUser(userData);
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
