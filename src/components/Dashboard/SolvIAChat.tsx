import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface SolvIAChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SolvIAChat({ isOpen, onClose }: SolvIAChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '¡Hola! Soy SolvIA, tu asistente inteligente especializado en gestión empresarial. Estoy aquí para ayudarte con análisis de datos, reportes y optimización de procesos. ¿En qué puedo asistirte hoy?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Obtener datos del sistema para contexto
  const { data: ventas } = useSupabaseData<any>('ventas', '*');
  const { data: productos } = useSupabaseData<any>('productos', '*');
  const { data: usuarios } = useSupabaseData<any>('usuarios', '*');
  const { data: asistencias } = useSupabaseData<any>('asistencias', '*');
  const { data: mermas } = useSupabaseData<any>('mermas', '*');
  const { data: promociones } = useSupabaseData<any>('promociones', '*');
  const { data: movimientos } = useSupabaseData<any>('movimientos_caja', '*');
  const { data: posTerminals } = useSupabaseData<any>('pos_terminals', '*');
  const { data: posTransactions } = useSupabaseData<any>('pos_transactions', '*');
  const { data: cafFiles } = useSupabaseData<any>('caf_files', '*');
  const { data: foliosElectronicos } = useSupabaseData<any>('folios_electronicos', '*');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getSystemContext = () => {
    // Calcular métricas en tiempo real
    const totalVentas = ventas.reduce((sum, venta) => sum + (parseFloat(venta.total) || 0), 0);
    const totalProductos = productos.length;
    const totalUsuarios = usuarios.length;
    const asistenciasHoy = asistencias.filter(a => 
      new Date(a.fecha).toDateString() === new Date().toDateString()
    ).length;
    const totalMermas = mermas.length;
    const promocionesActivas = promociones.filter(p => p.activo).length;
    const movimientosHoy = movimientos.filter(m => 
      new Date(m.fecha).toDateString() === new Date().toDateString()
    ).length;
    const terminalesOnline = posTerminals.filter(t => t.status === 'online').length;
    const transaccionesHoy = posTransactions.filter(t => 
      new Date(t.created_at).toDateString() === new Date().toDateString()
    ).length;
    const foliosDisponibles = foliosElectronicos.filter(f => !f.usado).length;

    return {
      sistema: 'Solvendo Back Office',
      version: '2.0',
      fecha: new Date().toLocaleDateString('es-CL'),
      hora: new Date().toLocaleTimeString('es-CL'),
      empresa: 'ANROLTEC SPA',
      rut: '78168951-3',
      novedades: [
        'Sistema completo de gestión empresarial',
        'Inventario en tiempo real',
        'Gestión de ventas y reportes',
        'Control de colaboradores',
        'Integración POS disponible'
      ],
      metricas: {
        ventas: {
          total: totalVentas,
          cantidad: ventas.length,
          promedio: ventas.length > 0 ? totalVentas / ventas.length : 0
        },
        inventario: {
          productos: totalProductos,
          mermas: totalMermas
        },
        colaboradores: {
          total: totalUsuarios,
          asistenciasHoy: asistenciasHoy
        },
        promociones: {
          activas: promocionesActivas,
          total: promociones.length
        },
        pos: {
          terminales: posTerminals.length,
          online: terminalesOnline,
          transaccionesHoy: transaccionesHoy
        },
        sii: {
          cafFiles: cafFiles.length,
          foliosDisponibles: foliosDisponibles
        },
        caja: {
          movimientosHoy: movimientosHoy
        }
      },
      productos: productos.slice(0, 5).map(p => ({
        nombre: p.nombre,
        precio: p.precio,
        stock: p.stock
      })),
      ultimasVentas: ventas.slice(-3).map(v => ({
        folio: v.folio,
        total: v.total,
        fecha: v.fecha
      }))
    };
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Llamar a la Edge Function con contexto completo
      const context = getSystemContext();
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Configuración de Supabase no encontrada');
      }
      
      const response = await fetch(`${supabaseUrl}/functions/v1/solvia-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputText,
          context: context
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || 'Lo siento, no pude procesar tu consulta.',
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error calling SolvIA:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Lo siento, hay un problema de conexión. Por favor intenta de nuevo.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block w-full max-w-md p-0 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-blue-600 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold">SolvIA</h3>
                <p className="text-xs text-blue-100">Asistente IA con contexto completo</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-blue-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.isUser ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString('es-CL', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pregúntame sobre ventas, inventario, empleados..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isTyping}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isTyping}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}