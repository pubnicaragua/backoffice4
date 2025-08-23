// src/pages/EstablecerPassword.tsx  
import React, { useState, useEffect } from 'react';  
import { useSearchParams, useNavigate } from 'react-router-dom';  
import { supabase } from '../lib/supabase';  
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';  
  
// ✅ Definir interface para los datos de invitación  
interface InvitationData {  
  id: string;  
  token: string;  
  email: string;  
  nombres: string;  
  apellidos: string;  
  rut: string;  
  telefono?: string;  
  fecha_nacimiento?: string;  
  empresa_id: string;  
  sucursal_id: string;  
  rol: string;  
  expires_at: string;  
  created_at: string;  
}  
  
export function EstablecerPassword() {  
  const [searchParams] = useSearchParams();  
  const navigate = useNavigate();  
  const token = searchParams.get('token');  
    
  const [password, setPassword] = useState('');  
  const [confirmPassword, setConfirmPassword] = useState('');  
  const [showPassword, setShowPassword] = useState(false);  
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);  
  const [loading, setLoading] = useState(false);  
  const [error, setError] = useState('');  
  const [success, setSuccess] = useState('');  
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);  
  const [validatingToken, setValidatingToken] = useState(true);  
  
  useEffect(() => {  
    if (token) {  
      validateToken();  
    } else {  
      setError('Token de invitación no válido');  
      setValidatingToken(false);  
    }  
  }, [token]);  
  
  const validateToken = async () => {  
    try {  
      setValidatingToken(true);  
      console.log('🔍 Validando token:', token);  
        
      const { data, error } = await supabase  
        .from('invitaciones_pendientes')  
        .select('*')  
        .eq('token', token)  
        .gt('expires_at', new Date().toISOString())  
        .single();  
  
      if (error || !data) {  
        console.error('❌ Token inválido o expirado:', error);  
        setError('La invitación ha expirado o no es válida. Contacta al administrador para obtener una nueva invitación.');  
        setValidatingToken(false);  
        return;  
      }  
  
      console.log('✅ Token válido, datos de invitación:', data);  
      setInvitationData(data as InvitationData);  
      setValidatingToken(false);  
    } catch (err) {  
      console.error('❌ Error validando token:', err);  
      setError('Error validando la invitación. Intenta nuevamente.');  
      setValidatingToken(false);  
    }  
  };  
  
  const validatePassword = (pwd: string) => {  
    if (pwd.length < 6) return 'La contraseña debe tener al menos 6 caracteres';  
    if (!/[A-Z]/.test(pwd)) return 'La contraseña debe contener al menos una mayúscula';  
    if (!/[0-9]/.test(pwd)) return 'La contraseña debe contener al menos un número';  
    return null;  
  };  
  
  const handleSubmit = async (e: React.FormEvent) => {  
    e.preventDefault();  
      
    // ✅ Guard clause para asegurar que invitationData existe  
    if (!invitationData) {  
      setError('No se encontraron datos de invitación válidos');  
      return;  
    }  
      
    // Validaciones  
    const passwordError = validatePassword(password);  
    if (passwordError) {  
      setError(passwordError);  
      return;  
    }  
  
    if (password !== confirmPassword) {  
      setError('Las contraseñas no coinciden');  
      return;  
    }  
  
    setLoading(true);  
    setError('');  
    setSuccess('');  
  
    try {  
      console.log('🔄 Iniciando creación de cuenta para:', invitationData.email);  
  
      // 1. Crear usuario en Supabase Auth  
      const { data: authData, error: authError } = await supabase.auth.signUp({  
        email: invitationData.email,  
        password: password,  
        options: {  
          data: {  
            nombres: invitationData.nombres,  
            apellidos: invitationData.apellidos,  
            rut: invitationData.rut,  
            empresa_id: invitationData.empresa_id,  
            sucursal_id: invitationData.sucursal_id,  
            rol: invitationData.rol  
          }  
        }  
      });  
  
      if (authError) {  
        console.error('❌ Error creando usuario en Auth:', authError);  
        throw authError;  
      }  
  
      const userId = authData.user?.id;  
      if (!userId) {  
        throw new Error('No se pudo obtener el ID del usuario');  
      }  
  
      console.log('✅ Usuario creado en Supabase Auth:', userId);  
  
      // 2. ✅ CRÍTICO: Crear registro en tabla usuarios  
      const { error: usuarioError } = await supabase  
        .from('usuarios')  
        .insert({  
          id: userId,  
          auth_user_id: userId,  
          nombres: invitationData.nombres,  
          apellidos: invitationData.apellidos,  
          rut: invitationData.rut,  
          email: invitationData.email,  
          telefono: invitationData.telefono || '',  
          fecha_nacimiento: invitationData.fecha_nacimiento || null,  
          rol: invitationData.rol,  
          activo: true  
        });  
  
      if (usuarioError) {  
        console.error('❌ Error creando registro en usuarios:', usuarioError);  
        // Limpiar usuario de Auth si falla  
        try {  
          await supabase.auth.admin.deleteUser(userId);  
        } catch (cleanupError) {  
          console.error('❌ Error limpiando usuario de Auth:', cleanupError);  
        }  
        throw usuarioError;  
      }  
  
      console.log('✅ Usuario insertado en tabla usuarios');  
  
      // 3. ✅ CRÍTICO: Crear relación usuario-empresa  
      const { error: empresaError } = await supabase  
        .from('usuario_empresa')  
        .insert({  
          usuario_id: userId,  
          empresa_id: invitationData.empresa_id,  
          sucursal_id: invitationData.sucursal_id,  
          rol: invitationData.rol,  
          activo: true  
        });  
  
      if (empresaError) {  
        console.error('❌ Error creando relación usuario-empresa:', empresaError);  
        // Limpiar registros anteriores si falla  
        try {  
          await supabase.from('usuarios').delete().eq('id', userId);  
          await supabase.auth.admin.deleteUser(userId);  
        } catch (cleanupError) {  
          console.error('❌ Error limpiando registros:', cleanupError);  
        }  
        throw empresaError;  
      }  
  
      console.log('✅ Relación usuario-empresa creada');  
  
      // 4. Eliminar invitación usada  
      const { error: deleteError } = await supabase  
        .from('invitaciones_pendientes')  
        .delete()  
        .eq('token', token);  
  
      if (deleteError) {  
        console.warn('⚠️ Error eliminando invitación:', deleteError);  
        // No fallar por esto, el usuario ya está creado  
      }  
  
      console.log('✅ Invitación eliminada');  
  
      // 5. Mostrar mensaje de éxito y redirigir  
      setSuccess('¡Cuenta creada exitosamente! Serás redirigido al login en unos segundos...');  
        
      setTimeout(() => {  
        navigate('/login?message=account-created');  
      }, 3000);  
        
    } catch (err: any) {  
      console.error('❌ Error en proceso completo:', err);  
      setError(err.message || 'Error creando la cuenta. Intenta nuevamente.');  
    } finally {  
      setLoading(false);  
    }  
  };  
  
  // Loading state durante validación de token  
  if (validatingToken) {  
    return (  
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">  
        <div className="text-center">  
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>  
          <p className="text-gray-600">Validando invitación...</p>  
        </div>  
      </div>  
    );  
  }  
  
  // Error state - token inválido o expirado  
  if (error && !invitationData) {  
    return (  
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">  
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">  
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">  
            <AlertCircle className="w-8 h-8 text-red-600" />  
          </div>  
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invitación no válida</h2>  
          <p className="text-gray-600 mb-6">{error}</p>  
          <button  
            onClick={() => navigate('/login')}  
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium"  
          >  
            Ir al Login  
          </button>  
        </div>  
      </div>  
    );  
  }  
  
  // ✅ Solo renderizar el formulario si invitationData existe  
  if (!invitationData) {  
    return null;  
  }  
  
  return (  
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">  
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">  
        {/* Header */}  
        <div className="text-center mb-8">  
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">  
            <CheckCircle className="w-8 h-8 text-white" />  
          </div>  
          <h2 className="text-2xl font-bold text-gray-900 mb-2">  
            Establece tu contraseña  
          </h2>  
          <p className="text-gray-600">  
            Hola <span className="font-semibold">{invitationData.nombres}</span>,   
            completa tu registro para acceder al sistema  
          </p>  
        </div>  
  
        {/* Error Message */}  
        {error && (  
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start space-x-3">  
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />  
            <p className="text-sm text-red-700">{error}</p>  
          </div>  
        )}  
  
        {/* Success Message */}  
        {success && (  
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-start space-x-3">  
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />  
            <p className="text-sm text-green-700">{success}</p>  
          </div>  
        )}  
  
        {/* Form */}  
        {!success && (  
          <form onSubmit={handleSubmit} className="space-y-6">  
            {/* Nueva contraseña */}  
            <div>  
              <label className="block text-sm font-medium text-gray-700 mb-2">  
                Nueva contraseña  
              </label>  
              <div className="relative">  
                <input  
                  type={showPassword ? "text" : "password"}  
                  value={password}  
                  onChange={(e) => setPassword(e.target.value)}  
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"  
                  placeholder="Mínimo 6 caracteres, 1 mayúscula, 1 número"  
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
              <div className="mt-2 text-xs text-gray-500">  
                <ul className="space-y-1">  
                  <li className={password.length >= 6 ? 'text-green-600' : 'text-gray-400'}>  
                    ✓ Al menos 6 caracteres  
                  </li>  
                  <li className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}>  
                    ✓ Una letra mayúscula  
                  </li>  
                  <li className={/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'}>  
                    ✓ Un número  
                  </li>  
                </ul>  
              </div>  
            </div>  
  
            {/* Confirmar contraseña */}  
            <div>  
              <label className="block text-sm font-medium text-gray-700 mb-2">  
                Confirmar contraseña  
              </label>  
              <div className="relative">  
                <input  
                  type={showConfirmPassword ? "text" : "password"}  
                  value={confirmPassword}  
                  onChange={(e) => setConfirmPassword(e.target.value)}  
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"  
                  placeholder="Repite tu contraseña"  
                  required  
                />  
                <button  
                  type="button"  
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}  
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"  
                >  
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}  
                </button>  
              </div>  
              {confirmPassword && password !== confirmPassword && (  
                <p className="mt-1 text-xs text-red-600">Las contraseñas no coinciden</p>  
              )}  
            </div>  
  
            {/* Información del usuario */}  
            <div className="bg-gray-50 rounded-lg p-4">  
              <h4 className="text-sm font-medium text-gray-700 mb-2">Información de tu cuenta:</h4>  
              <div className="space-y-1 text-sm text-gray-600">  
                <p><span className="font-medium">Email:</span> {invitationData.email}</p>  
                <p><span className="font-medium">RUT:</span> {invitationData.rut}</p>  
                <p><span className="font-medium">Rol:</span> {invitationData.rol}</p>  
              </div>  
            </div>  
  
            {/* Submit button */}  
            <button  
              type="submit"  
              disabled={loading || !password || !confirmPassword || password !== confirmPassword}  
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"  
            >  
              {loading ? (  
                <div className="flex items-center justify-center space-x-2">  
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>  
                  <span>Creando cuenta...</span>  
                </div>  
              ) : (  
                'Crear mi cuenta'  
              )}  
            </button>  
          </form>  
        )}  
  
        {/* Footer */}  
        <div className="mt-8 text-center">  
          <p className="text-xs text-gray-500">  
            ¿Tienes problemas? Contacta al administrador del sistema  
          </p>  
        </div>  
      </div>  
    </div>  
  );  
}