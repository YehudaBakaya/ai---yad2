import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { getUserProfile } from '../services/firestoreService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid).catch(() => null);
        setUser({
          id:     firebaseUser.uid,
          name:   firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'משתמש',
          email:  firebaseUser.email,
          phone:  profile?.phone || null,
          avatar: firebaseUser.photoURL || null,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // קריאה מיידית ל-auth.currentUser (אחרי sign-in, לפני שonAuthStateChanged מספיק להתעדכן)
  const syncUser = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;
    const profile = await getUserProfile(firebaseUser.uid).catch(() => null);
    setUser({
      id:     firebaseUser.uid,
      name:   firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'משתמש',
      email:  firebaseUser.email,
      phone:  profile?.phone || null,
      avatar: firebaseUser.photoURL || null,
    });
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout, syncUser, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
