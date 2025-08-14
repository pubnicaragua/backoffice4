import React, { useState, useRef, useEffect } from 'react';  
import { X, Send, MessageCircle } from 'lucide-react';  
import { useSupabaseData } from '../../hooks/useSupabaseData';  
import { useAuth } from '../../contexts/AuthContext';  
  
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
  const { empresaId } = useAuth();  
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
  
  // Obtener datos del sistema para contexto con filtro por empresa  
  const { data: ventas = [] } = useSupabaseData<any>('ventas', '*', empresaId ? { empresa_id: empresaId } : undefined);  
  const { data: productos = [] } = useSupabaseData<any>('productos', '*', empresaId ? { empresa_id: empresaId } : undefined);  
  const { data: usuarios = [] } = useSupabaseData<any>('usuarios', '*', empresaId ? { empresa_id: empresaId } : undefined);  
  const { data: asistencias = [] } = useSupabaseData<any>('asistencias', '*', empresaId ? { empresa_id: empresaId } : undefined);  
  const { data: mermas = [] } = useSupabaseData<any>('mermas', '*', empresaId ? { empresa_id: empresaId } : undefined);  
  const { data: promociones = [] } = useSupabaseData<any>('promociones', '*', empresaId ? { empresa_id: empresaId } : undefined);  
  const { data: movimientos = [] } = useSupabaseData<any>('movimientos_caja', '*', empresaId ? { empresa_id: empresaId } : undefined);  
  const { data: posTerminals = [] } = useSupabaseData<any>('pos_terminals', '*', empresaId ? { empresa_id: empresaId } : undefined);  
  const { data: posTransactions = [] } = useSupabaseData<any>('pos_transactions', '*', empresaId ? { empresa_id: empresaId } : undefined);  
  const { data: cafFiles = [] } = useSupabaseData<any>('caf_files', '*', empresaId ? { empresa_id: empresaId } : undefined);  
  const { data: foliosElectronicos = [] } = useSupabaseData<any>('folios_electronicos', '*', empresaId ? { empresa_id: empresaId } : undefined);  
  
  const scrollToBottom = () => {  
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });  
  };  
  
  useEffect(() => {  
    scrollToBottom();  
  }, [messages]);  
  
  const getSystemContext = () => {  
    // Calcular métricas en tiempo real  
    const today = new Date().toDateString();  
      
    const totalVentas = ventas.reduce((sum, venta) => sum + (parseFloat(venta.total) || 0), 0);  
    const ventasHoy = ventas.filter(v => new Date(v.fecha).toDateString() === today);  
    const totalVentasHoy = ventasHoy.reduce((sum, venta) => sum + (parseFloat(venta.total) || 0), 0);  
      
    const totalProductos = productos.length;  
    const stockBajo = productos.filter(p => p.stock < (p.stock_minimo || 5));  
      
    const totalUsuarios = usuarios.length;  
    const asistenciasHoy = asistencias.filter(a =>   
      new Date(a.fecha).toDateString() === today  
    );  
      
    const totalMermas = mermas.length;  
    const mermasHoy = mermas.filter(m => new Date(m.fecha).toDateString() === today);  
      
    const promocionesActivas = promociones.filter(p => p.activo).length;  
    const movimientosHoy = movimientos.filter(m =>   
      new Date(m.fecha).toDateString() === today  
    ).length;  
    const terminalesOnline = posTerminals.filter(t => t.status === 'online').length;  
    const transaccionesHoy = posTransactions.filter(t =>   
      new Date(t.created_at).toDateString() === today  
    ).length;  
    const foliosDisponibles = foliosElectronicos.filter(f => !f.usado).length;  
  
    return {  
      sistema: 'Solvendo Back Office',  
      version: '2.0',  
      fecha: new Date().toLocaleDateString('es-CL'),  
      hora: new Date().toLocaleTimeString('es-CL'),  
      empresa_id: empresaId,  
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
          total: totalVentasHoy,  
          cantidad: ventasHoy.length,  
          promedio: ventasHoy.length > 0 ? totalVentasHoy / ventasHoy.length : 0  
        },  
        inventario: {  
          productos: totalProductos,  
          mermas: totalMermas,  
          stock_bajo: stockBajo.length  
        },  
        colaboradores: {  
          total: totalUsuarios,  
          asistenciasHoy: asistenciasHoy.length  
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
      inventario: {  
        total_productos: totalProductos,  
        stock_bajo: stockBajo.length,  
        productos_criticos: stockBajo.slice(0, 5).map(p => ({  
          nombre: p.nombre,  
          stock: p.stock,  
          minimo: p.stock_minimo || 5  
        }))  
      },  
      mermas: {  
        hoy: mermasHoy.length,  
        total: totalMermas  
      },  
      asistencias: {  
        hoy: asistenciasHoy.length,  
        presentes: asistenciasHoy.filter(a => a.estado === 'presente').length,  
        ausentes: asistenciasHoy.filter(a => a.estado === 'ausente').length  
      },  
      productos: productos.slice(0, 5).map(p => ({  
        nombre: p.nombre,  
        precio: p.precio,  
        stock: p.stock  
      })),  
      ultimasVentas: ventasHoy.slice(-3).map(v => ({  
        folio: v.folio,  
        total: v.total,  
        fecha: v.fecha  
      }))  
    };  
  };  
  
  // Función de respuesta local como fallback  
  const getLocalResponse = (message: string, context: any) => {  
    const msg = message.toLowerCase();  
      
    if (msg.includes('ventas')) {  
      const totalVentas = context?.metricas?.ventas?.total || 0;  
      const cantidadVentas = context?.metricas?.ventas?.cantidad || 0;  
      const promedio = context?.metricas?.ventas?.promedio || 0;  
        
      let response = `Perfecto, te cuento sobre las ventas de hoy. `;  
        
      if (totalVentas > 0) {  
        response += `Llevas $${totalVentas.toLocaleString('es-CL')} en total con ${cantidadVentas} transacciones realizadas. `;  
          
        if (promedio > 0) {  
          response += `El ticket promedio está en $${Math.round(promedio).toLocaleString('es-CL')}. `;  
        }  
          
        if (totalVentas > 500000) {  
          response += "¡Excelente día de ventas! Vas muy bien.";  
        } else if (totalVentas > 200000) {  
          response += "Van bien las ventas hoy, buen ritmo.";  
        } else if (totalVentas > 50000) {  
          response += "Las ventas van moderadas, pero hay potencial para más.";  
        } else {  
          response += "Las ventas van despacio hoy, pero aún hay tiempo para mejorar.";  
        }  
      } else {  
        response += "Aún no tienes ventas registradas hoy. ¡Es hora de empezar a vender!";  
      }  
        
      return response;  
    }  
      
    if (msg.includes('inventario') || msg.includes('productos') || msg.includes('stock')) {  
      const totalProductos = context?.inventario?.total_productos || 0;  
      const stockBajo = context?.inventario?.stock_bajo || 0;  
      const productosCriticos = context?.inventario?.productos_criticos || [];  
        
      let response = `Te cuento sobre tu inventario. `;  
      response += `Tienes ${totalProductos} productos registrados en total. `;  
        
      if (stockBajo > 0) {  
        response += `¡Atención! Hay ${stockBajo} productos con stock bajo que necesitan reposición. `;  
          
        if (productosCriticos.length > 0) {  
          response += `Los más críticos son: ${productosCriticos.map(p => `${p.nombre} (${p.stock} unidades, mínimo ${p.minimo})`).join(', ')}. `;  
          response += "Te recomiendo hacer pedidos pronto para evitar quedarte sin stock.";  
        }  
      } else {  
        response += "¡Perfecto! Todos tus productos tienen stock suficiente.";  
      }  
        
      return response;  
    }  
      
    if (msg.includes('empleados') || msg.includes('colaboradores') || msg.includes('asistencia')) {  
      const totalEmpleados = context?.metricas?.colaboradores?.total || 0;  
      const asistenciasHoy = context?.asistencias?.hoy || 0;  
      const presentes = context?.asistencias?.presentes || 0;  
      const ausentes = context?.asistencias?.ausentes || 0;  
        
      let response = `Te cuento sobre tu equipo de trabajo. `;  
      response += `Tienes ${totalEmpleados} colaboradores registrados. `;  
        
      if (asistenciasHoy > 0) {  
        response += `Hoy hay ${presentes} personas presentes`;  
        if (ausentes > 0) {  
          response += ` y ${ausentes} ausentes`;  
        }  
        response += `. `;  
          
        const porcentajeAsistencia = totalEmpleados > 0 ? Math.round((presentes / totalEmpleados) * 100) : 0;  
        if (porcentajeAsistencia >= 90) {  
          response += "¡Excelente asistencia del equipo!";  
        } else if (porcentajeAsistencia >= 70) {  
          response += "Buena asistencia general.";  
        } else {  
          response += "La asistencia podría mejorar.";  
        }  
      } else {  
        response += "Aún no hay registros de asistencia para hoy.";  
      }  
        
      return response;  
    }  
      
    if (msg.includes('mermas') || msg.includes('pérdidas')) {  
      const mermasHoy = context?.mermas?.hoy || 0;  
      const totalMermas = context?.mermas?.total || 0;  
        
      let response = `Te informo sobre las mermas. `;  
        
      if (mermasHoy > 0) {  
        response += `Hoy tienes ${mermasHoy} mermas reportadas. `;  
      } else {  
        response += "¡Perfecto! No hay mermas reportadas hoy. ";  
      }  
        
      if (totalMermas > 0) {  
        response += `En total tienes ${totalMermas} mermas registradas. `;  
        response += "Te recomiendo revisar las causas principales para reducir las pérdidas.";  
      }  
        
      return response;  
    }  
      
    // Respuesta por defecto  
    return `Entiendo que quieres información sobre tu negocio. Puedo ayudarte con datos específicos sobre:  
• 📊 **Ventas** - ¿cómo van las ventas de hoy?  
• 📦 **Inventario** - ¿hay productos con stock bajo?  
• 👥 **Empleados** - ¿cómo está la asistencia?  
• 📉 **Mermas** - ¿qué pérdidas tengo?  
• 💳 **POS** y terminales de pago  
• 📄 **Facturación** electrónica  
• 💰 **Movimientos de caja**  
  
¿Sobre qué te gustaría que te informe específicamente?`;  
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
    const currentInput = inputText;  
    setInputText('');  
    setIsTyping(true);  
  
    try {      // Llamar a la Edge Function con contexto completo  
      const context = getSystemContext();  
        
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;  
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;  
        
      if (!supabaseUrl || !supabaseKey) {  
        throw new Error('Configuración de Supabase no encontrada');  
      }  
        
      // Intentar usar la función Edge primero  
      try {  
        const response = await fetch(`${supabaseUrl}/functions/v1/solvia-chat`, {  
          method: 'POST',  
          headers: {  
            'Authorization': `Bearer ${supabaseKey}`,  
            'Content-Type': 'application/json',  
          },  
          body: JSON.stringify({  
            message: currentInput,  
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
      } catch (edgeFunctionError) {  
        console.warn('Edge Function failed, using local fallback:', edgeFunctionError);  
          
        // Usar respuesta local como fallback  
        const localResponse = getLocalResponse(currentInput, context);  
          
        const aiMessage: Message = {  
          id: (Date.now() + 1).toString(),  
          text: localResponse,  
          isUser: false,  
          timestamp: new Date()  
        };  
          
        setMessages(prev => [...prev, aiMessage]);  
      }  
        
    } catch (error) {  
      console.error('Error calling SolvIA:', error);  
        
      // Fallback final con respuesta local  
      const context = getSystemContext();  
      const localResponse = getLocalResponse(currentInput, context);  
        
      const errorMessage: Message = {  
        id: (Date.now() + 1).toString(),  
        text: localResponse || 'Lo siento, hay un problema de conexión. Por favor intenta de nuevo.',  
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