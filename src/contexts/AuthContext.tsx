import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setLoading(false);
          return;
        }

        if (session?.user) {
          await fetchUserProfile(session.user.id, session.user.email);
        } else {
          setLoading(false);
        }
      } catch (error) {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string, userEmail?: string) => {
    try {
      setLoading(true);
      
      // Create basic user object from auth data
      const basicUser: User = {
        id: userId,
        email: userEmail || 'usuario@ejemplo.com',
        nombres: 'Usuario',
        apellidos: '',
        rut: '',
        telefono: '',
        direccion: '',
        activo: true,
        created_at: new Date().toISOString()
      };

      setUser(basicUser);
      setLoading(false);

    } catch (error) {
      // Always create a fallback user to prevent infinite loading
      const fallbackUser: User = {
        id: userId,
        email: userEmail || 'usuario@ejemplo.com',
        nombres: 'Usuario',
        apellidos: '',
        rut: '',
        telefono: '',
        direccion: '',
        activo: true,
        created_at: new Date().toISOString()
      };
      
      setUser(fallbackUser);
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setLoading(false);
        throw error;
      }
      // Don't set loading to false here - let the auth state change handle it
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      throw error;
    }
  };

  const value = React.useMemo(() => ({
    user,
    loading,
    signIn,
    signOut
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}