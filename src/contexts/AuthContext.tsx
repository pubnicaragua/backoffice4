import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  empresaId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refetchUserProfile: () => Promise<void>; // Agregar función para refrescar
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email);
      } else {
        setUser(null);
        setEmpresaId(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string, userEmail?: string) => {
    console.log("🔄 fetchUserProfile iniciado para:", userId);

    try {
      setLoading(true);

      console.log("📊 Buscando usuario en tabla usuarios...");
      const { data: userData, error: userError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("auth_user_id", userId)
        .single();

      console.log("👤 Resultado usuario:", { userData, userError });

      let finalUser = userData;

      if (userError || !userData) {
        console.log("⚠️ Usuario no encontrado, creando usuario básico...");
        // Crear usuario básico como fallback
        finalUser = {
          id: userId,
          auth_user_id: userId,
          email: userEmail || "usuario@ejemplo.com",
          nombres: "Usuario",
          apellidos: "",
          rut: "",
          telefono: "",
          direccion: "",
          activo: true,
          created_at: new Date().toISOString(),
        };
      }

      setUser(finalUser);

      // Solo buscar empresa si tenemos un usuario válido
      if (finalUser?.id) {
        console.log("🏢 Buscando empresa del usuario...");
        const { data: usuarioEmpresa, error: empresaError } = await supabase
          .from("usuario_empresa")
          .select("empresa_id")
          .eq("usuario_id", finalUser.id)
          .eq("activo", true)
          .single();

        console.log("🏢 Resultado empresa:", { usuarioEmpresa, empresaError });
        setEmpresaId(usuarioEmpresa?.empresa_id || null);
      } else {
        setEmpresaId(null);
      }

      console.log("✅ fetchUserProfile completado exitosamente");
    } catch (error) {
      console.error("❌ Error crítico en fetchUserProfile:", error);

      // Crear usuario fallback en caso de error crítico
      const fallbackUser = {
        id: userId,
        auth_user_id: userId,
        email: userEmail || "usuario@ejemplo.com",
        nombres: "Usuario",
        apellidos: "",
        rut: "",
        telefono: "",
        direccion: "",
        activo: true,
        created_at: new Date().toISOString(),
      };

      setUser(fallbackUser);
      setEmpresaId(null);
    } finally {
      setLoading(false);
    }
  };

  const refetchUserProfile = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchUserProfile(session.user.id, session.user.email);
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
      setEmpresaId(null);
    } catch (error) {
      throw error;
    }
  };

  const value = React.useMemo(
    () => ({
      user,
      empresaId,
      loading,
      signIn,
      signOut,
      refetchUserProfile,
    }),
    [user, empresaId, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
