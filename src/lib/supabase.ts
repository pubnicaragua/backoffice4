import { createClient } from '@supabase/supabase-js';

// Obtener variables de entorno de Vite o del objeto window (para producción)
const getEnv = (key: string): string => {
  // En desarrollo, usa import.meta.env
  if (import.meta.env.MODE === 'development') {
    const value = import.meta.env[key];
    if (!value) {
      console.warn(`Variable de entorno ${key} no encontrada en import.meta.env`);
    }
    return value || '';
  }
  
  // En producción, usa window.env o import.meta.env
  // @ts-ignore
  if (typeof window !== 'undefined' && window.env && window.env[key]) {
    // @ts-ignore
    return window.env[key];
  }
  
  // Último recurso: intenta con import.meta.env
  const value = import.meta.env[key];
  if (!value) {
    console.error(`Variable de entorno ${key} no encontrada`);
  }
  return value || '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = 'Las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY son requeridas';
  console.error(errorMsg);
  throw new Error(errorMsg);
}

// Configuración de Supabase
const supabaseConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'implicit' as const
  },
  db: { schema: 'public' }
};

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseConfig);

// Verificar conexión en desarrollo
if (import.meta.env.MODE === 'development') {
  supabase.auth.getSession().then(({ data: { session } }) => {
    console.log('Conexión exitosa con Supabase');
    console.log('Usuario autenticado:', session?.user?.email);
  }).catch(error => {
    console.error('Error de conexión con Supabase:', error);
  });
}

export { supabase };
