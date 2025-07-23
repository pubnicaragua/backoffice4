import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Try to sign up the test user, but ignore if already exists
      try {
        await supabase.auth.signUp({
          email: 'test@example.com',
          password: 'password123',
        });
      } catch (signUpError) {
        // Ignore "user already exists" error, continue to sign in
        if (!signUpError.message?.includes('already registered') && 
            !signUpError.message?.includes('already exists')) {
          throw signUpError;
        }
      }
      
      // Now try to sign in
      await signIn('test@example.com', 'password123');
    } catch (err: any) {
      setError('Error en login rápido: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestCredentials = () => {
    setEmail('test@example.com');
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-8">
            <img 
              src="/logo_negro.svg" 
              alt="Solvendo" 
              className="h-12"
            />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Inicia sesión</h2>
        </div>

        {error && (
          <div className={`mb-4 p-3 rounded-md ${
            error.includes('✅') 
              ? 'bg-green-50 border border-green-200 text-green-600' 
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Correo
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ingresa tu correo"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ingresa tu contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {/* Development helpers */}
        <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
          <div className="text-center text-sm text-gray-500 mb-3">
            🛠️ Herramientas de desarrollo
          </div>
          
          <button
            type="button"
            onClick={handleQuickLogin}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            🚀 Login rápido (crear + ingresar)
          </button>
          
          <button
            type="button"
            onClick={handleTestCredentials}
            className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
          >
            🔧 Usar credenciales de prueba
          </button>
        </div>
      </div>
    </div>
  );
}