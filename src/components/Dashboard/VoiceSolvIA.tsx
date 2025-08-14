import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Square } from 'lucide-react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { useAuth } from '../../contexts/AuthContext';
import { supabaseAnonKey } from '../../lib/supabase';

interface VoiceMessage {
  id: string;
  text: string;
  audioUrl?: string;
  isUser: boolean;
  timestamp: Date;
  isVoiceInput: boolean;
  isVoiceOutput: boolean;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'thinking' | 'speaking' | 'error';

interface VoiceSolvIAProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VoiceSolvIA({ isOpen, onClose }: VoiceSolvIAProps) {
  const { user, empresaId } = useAuth();
  const [error, setError] = useState<String>('');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.9);
  const [transcript, setTranscript] = useState('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Obtener datos del sistema para contexto empresarial usando empresaId del AuthContext  
  const { data: ventas = [] } = useSupabaseData<any>('ventas', '*', empresaId ? { empresa_id: empresaId } : undefined);
  const { data: productos = [] } = useSupabaseData<any>('productos', '*', empresaId ? { empresa_id: empresaId } : undefined);
  const { data: mermas = [] } = useSupabaseData<any>('mermas', '*', empresaId ? { empresa_id: empresaId } : undefined);
  const { data: asistencias = [] } = useSupabaseData<any>('asistencias', '*', empresaId ? { empresa_id: empresaId } : undefined);
  const { data: movimientos = [] } = useSupabaseData<any>('movimientos_caja', '*', empresaId ? { empresa_id: empresaId } : undefined);
  const { data: sucursales = [] } = useSupabaseData<any>('sucursales', '*', empresaId ? { empresa_id: empresaId } : undefined);

  useEffect(() => {
    if (isOpen) {
      initializeVoiceRecognition();
      addWelcomeMessage();
    }
    return () => {
      cleanup();
    };
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeVoiceRecognition = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = "es-CL";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setVoiceState("listening");
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript.trim();
        setTranscript(transcript);

        if (result.isFinal) {
          handleVoiceInput(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);

        let errorMessage = "";
        switch (event.error) {
          case "no-speech":
            errorMessage = "No se detectó voz. Intenta hablar más fuerte o más cerca del micrófono.";
            break;
          case "audio-capture":
            errorMessage = "No se detectó un micrófono. Revisa tu configuración de audio.";
            break;
          case "not-allowed":
            errorMessage = "Permiso para usar el micrófono denegado.";
            break;
          case "aborted":
            errorMessage = "La captura de voz fue interrumpida.";
            break;
          case "network":
            errorMessage = "Error de conexión de red.";
            break;
          default:
            errorMessage = "Ocurrió un error desconocido.";
        }

        setError(errorMessage)
        setVoiceState("error");
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);

        if (voiceState === "listening") {
          setVoiceState("idle");
        }
      };
    } else {
      console.error("El reconocimiento de voz no está soportado en este navegador.");
      alert("Tu navegador no soporta reconocimiento de voz.");
    }
  };

  const addWelcomeMessage = () => {
    const welcomeMessage: VoiceMessage = {
      id: `msg_${Date.now()}`,
      text: `¡Hola! Soy SolvIA Voice, tu asistente de voz para gestión empresarial. Puedes preguntarme sobre tus ventas de hoy, estado del inventario, mermas, reportes financieros y más. ¿En qué puedo ayudarte?`,
      isUser: false,
      timestamp: new Date(),
      isVoiceInput: false,
      isVoiceOutput: true
    };

    setMessages([welcomeMessage]);
    if (!isMuted) {
      speakText(welcomeMessage.text);
    }
  };

  const startListening = async () => {
    if (!recognitionRef.current) return;

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setTranscript('');
      setVoiceState('listening');
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setVoiceState('error');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const handleVoiceInput = async (transcript: string) => {
    if (!transcript.trim()) return;

    const userMessage: VoiceMessage = {
      id: `msg_${Date.now()}`,
      text: transcript,
      isUser: true,
      timestamp: new Date(),
      isVoiceInput: true,
      isVoiceOutput: false
    };

    setMessages(prev => [...prev, userMessage]);
    setVoiceState('thinking');

    await processVoiceQuery(transcript);
  };

  const processVoiceQuery = async (query: string) => {
    try {
      const context = getBusinessContext();

      const response = await fetch('https://ujkdekqhoeyfjvtzdtaz.supabase.co/functions/v1/smooth-responder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          message: query,
          context: context,
          empresa_id: empresaId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const aiMessage: VoiceMessage = {
        id: `msg_${Date.now()}`,
        text: data.response || 'Lo siento, no pude procesar tu consulta.',
        isUser: false,
        timestamp: new Date(),
        isVoiceInput: false,
        isVoiceOutput: true
      };

      setMessages(prev => [...prev, aiMessage]);
      setVoiceState('speaking');

      if (!isMuted) {
        speakText(aiMessage.text);
      } else {
        setVoiceState('idle');
      }

    } catch (error) {
      console.error('Error processing voice query:', error);
      const errorMessage: VoiceMessage = {
        id: `msg_${Date.now()}`,
        text: 'Lo siento, hubo un problema procesando tu consulta. Por favor intenta de nuevo.',
        isUser: false,
        timestamp: new Date(),
        isVoiceInput: false,
        isVoiceOutput: true
      };

      setMessages(prev => [...prev, errorMessage]);
      setVoiceState('idle');
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window && !isMuted) {
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-CL';
      utterance.rate = speechRate;
      utterance.pitch = 1.1;
      utterance.volume = 0.8;

      const voices = speechSynthesis.getVoices();
      const spanishVoice = voices.find(voice =>
        voice.lang.includes('es') && (voice.name.includes('Female') || voice.name.includes('Mujer'))
      ) || voices.find(voice => voice.lang.includes('es'));

      if (spanishVoice) {
        utterance.voice = spanishVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setVoiceState('speaking');
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setVoiceState('idle');
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setVoiceState('idle');
      };

      synthRef.current = utterance;
      speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      setVoiceState('idle');
    }
  };

  const getBusinessContext = () => {
    const today = new Date().toDateString();

    const ventasHoy = ventas.filter((v: any) =>
      new Date(v.fecha).toDateString() === today
    );

    const totalVentasHoy = ventasHoy.reduce((sum: number, venta: any) =>
      sum + (parseFloat(venta.total) || 0), 0
    );

    const mermasHoy = mermas.filter((m: any) =>
      new Date(m.fecha).toDateString() === today
    );

    const asistenciasHoy = asistencias.filter((a: any) =>
      new Date(a.fecha).toDateString() === today
    );

    const movimientosHoy = movimientos.filter((m: any) =>
      new Date(m.fecha).toDateString() === today
    );

    const stockBajo = productos.filter((p: any) => p.stock < p.stock_minimo);

    return {
      empresa_id: empresaId,
      fecha: new Date().toLocaleDateString('es-CL'),
      hora: new Date().toLocaleTimeString('es-CL'),
      metricas_hoy: {
        ventas: {
          total: totalVentasHoy,
          cantidad: ventasHoy.length,
          promedio: ventasHoy.length > 0 ? totalVentasHoy / ventasHoy.length : 0
        },
        mermas: {
          cantidad: mermasHoy.length,
          valor_total: mermasHoy.reduce((sum: number, m: any) => sum + (m.valor || 0), 0)
        },
        asistencias: {
          presentes: asistenciasHoy.filter((a: any) => a.estado === 'presente').length,
          ausentes: asistenciasHoy.filter((a: any) => a.estado === 'ausente').length,
          total: asistenciasHoy.length
        },
        movimientos_caja: {
          ingresos: movimientosHoy.filter((m: any) => m.tipo === 'ingreso').length,
          egresos: movimientosHoy.filter((m: any) => m.tipo === 'egreso').length
        }
      },
      inventario: {
        total_productos: productos.length,
        stock_bajo: stockBajo.length,
        productos_criticos: stockBajo.slice(0, 5).map((p: any) => ({
          nombre: p.nombre,
          stock: p.stock,
          minimo: p.stock_minimo
        }))
      },
      sucursales: sucursales.map((s: any) => ({
        nombre: s.nombre,
        activa: s.activa
      }))
    };
  };

  const cleanup = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl h-[600px] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">SolvIA Voice</h3>
                <p className="text-purple-100 text-sm">
                  Estado: {error}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-md hover:bg-white hover:bg-opacity-20 transition-colors"
                title={isMuted ? "Activar audio" : "Silenciar"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="p-2 rounded-md hover:bg-white hover:bg-opacity-20 transition-colors"
                  title="Detener reproducción"
                >
                  <Square className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-md hover:bg-white hover:bg-opacity-20 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${message.isUser
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-800 shadow-sm border'
                  }`}
              >
                <p className="text-sm">{message.text}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs ${message.isUser ? 'text-purple-100' : 'text-gray-500'
                    }`}>
                    {message.timestamp.toLocaleTimeString('es-CL', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {message.isVoiceInput && (
                    <Mic className="w-3 h-3 text-purple-400" />
                  )}
                  {message.isVoiceOutput && !message.isUser && (
                    <Volume2 className="w-3 h-3 text-green-400" />
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Transcripción en tiempo real */}
          {transcript && voiceState === 'listening' && (
            <div className="flex justify-end">
              <div className="max-w-xs px-4 py-2 rounded-lg bg-gray-200 text-gray-600 border-2 border-dashed border-purple-300">
                <p className="text-sm italic">{transcript}</p>
                <span className="text-xs text-gray-500">Escuchando...</span>
              </div>
            </div>
          )}

          {/* Indicador de estado */}
          {voiceState === 'thinking' && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-sm border">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm">SolvIA está analizando...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Voice Controls */}
        <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
          <div className="flex items-center justify-center space-x-4">
            {/* Botón principal de micrófono */}
            <button
              onMouseDown={startListening}
              onMouseUp={stopListening}
              disabled={voiceState === 'thinking' || voiceState === 'speaking'}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all transform ${voiceState === 'listening'
                ? 'bg-red-500 text-white scale-110 animate-pulse'
                : voiceState === 'idle'
                  ? 'bg-purple-600 text-white hover:bg-purple-700 hover:scale-105'
                  : 'bg-gray-400 text-white cursor-not-allowed'
                }`}
            >
              {voiceState === 'listening' ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>

            {/* Control de velocidad */}
            <div className="flex flex-col items-center space-y-1">
              <label className="text-xs text-gray-600">Velocidad</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-20"
              />
              <span className="text-xs text-gray-500">{speechRate}x</span>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="mt-3 text-center">
            <p className="text-sm text-gray-600">
              {voiceState === 'idle' && 'Mantén presionado el micrófono para hablar'}
              {voiceState === 'listening' && 'Hablando... suelta para enviar'}
              {voiceState === 'thinking' && 'Procesando tu consulta...'}
              {voiceState === 'speaking' && 'SolvIA está respondiendo...'}
              {voiceState === 'error' && error}
            </p>
          </div>

          {/* Comandos sugeridos */}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {[
              "¿Cómo van las ventas de hoy?",
              "¿Hay productos con stock bajo?",
              "Muéstrame las mermas",
              "¿Cómo está la asistencia?"
            ].map((command, index) => (
              <button
                key={index}
                onClick={() => handleVoiceInput(command)}
                className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
              >
                {command}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}  