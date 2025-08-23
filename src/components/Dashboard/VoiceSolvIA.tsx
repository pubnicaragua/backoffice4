import { useState, useRef, useEffect } from 'react';  
import {  
  Mic, MicOff, Volume2, VolumeX, Square, Brain, Sparkles,  
  TrendingUp, DollarSign, Package, Users, AlertTriangle,  
  BarChart3, PieChart, Calendar, Clock, Zap, Star,  
  ChevronRight, Play, Pause, RotateCcw, Settings,  
  MessageSquare, Lightbulb, Target, Award, Rocket,  
  X, Activity, Shield, CheckCircle, ArrowRight,  
  Headphones, Mic2, Radio, Waves, Signal, Send  
} from 'lucide-react';  
import { useSupabaseData } from '../../hooks/useSupabaseData';  
import { useAuth } from '../../contexts/AuthContext';  
  
interface VoiceMessage {  
  id: string;  
  text: string;  
  audioUrl?: string;  
  isUser: boolean;  
  timestamp: Date;  
  isVoiceInput: boolean;  
  isVoiceOutput: boolean;  
  category?: 'ventas' | 'inventario' | 'personal' | 'finanzas' | 'general';  
}  
  
type VoiceState = 'idle' | 'listening' | 'processing' | 'thinking' | 'speaking' | 'error';  
  
interface VoiceSolvIAProps {  
  isOpen: boolean;  
  onClose: () => void;  
}  
  
interface QuickAction {  
  id: string;  
  title: string;  
  subtitle: string;  
  icon: React.ReactNode;  
  gradient: string;  
  query: string;  
  category: string;  
  priority: 'high' | 'medium' | 'low';  
}  
  
export function VoiceSolvIA({ isOpen, onClose }: VoiceSolvIAProps) {  
  const { user, empresaId } = useAuth();  
  const [error, setError] = useState<string>('');  
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');  
  const [messages, setMessages] = useState<VoiceMessage[]>([]);  
  const [isListening, setIsListening] = useState(false);  
  const [isSpeaking, setIsSpeaking] = useState(false);  
  const [isMuted, setIsMuted] = useState(false);  
  const [speechRate, setSpeechRate] = useState(0.9);  
  const [transcript, setTranscript] = useState('');  
  const [finalTranscript, setFinalTranscript] = useState('');  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');  
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);  
  const [voiceVolume, setVoiceVolume] = useState(0);  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);  
  const [browserInfo, setBrowserInfo] = useState<string>('');  
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);  
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);  
  const messagesEndRef = useRef<HTMLDivElement>(null);  
  const audioContextRef = useRef<AudioContext | null>(null);  
  const analyserRef = useRef<AnalyserNode | null>(null);  
  
  // Datos empresariales  
  const { data: ventas = [] } = useSupabaseData<any>('ventas', '*', empresaId ? { empresa_id: empresaId } : undefined);  
  const { data: productos = [] } = useSupabaseData<any>('productos', '*', empresaId ? { empresa_id: empresaId } : undefined);  
  const { data: mermas = [] } = useSupabaseData<any>('mermas', '*', empresaId ? { empresa_id: empresaId } : undefined);  
  const { data: asistencias = [] } = useSupabaseData<any>('asistencias', '*', empresaId ? { empresa_id: empresaId } : undefined);  
  const { data: movimientos = [] } = useSupabaseData<any>('movimientos_caja', '*', empresaId ? { empresa_id: empresaId } : undefined);  
  const { data: sucursales = [] } = useSupabaseData<any>('sucursales', '*', empresaId ? { empresa_id: empresaId } : undefined);  
  const { data: usuarios = [] } = useSupabaseData<any>('usuarios', '*', empresaId ? { empresa_id: empresaId } : undefined);  
  const { data: promociones = [] } = useSupabaseData<any>('promociones', '*', empresaId ? { empresa_id: empresaId } : undefined);  
  
  // Quick Actions con colores alternados negro-blanco  
  const quickActions: QuickAction[] = [  
    {  
      id: 'ventas-hoy',  
      title: 'Ventas de Hoy',  
      subtitle: 'Resumen completo de ingresos',  
      icon: <DollarSign className="w-5 h-5" />,  
      gradient: 'from-gray-900 to-black',  
      query: 'Dame un análisis completo de las ventas de hoy en pesos chilenos, incluyendo comparación con ayer',  
      category: 'ventas',  
      priority: 'high'  
    },  
    {  
      id: 'top-productos',  
      title: 'Productos Top',  
      subtitle: 'Los más vendidos del mes',  
      icon: <Award className="w-5 h-5" />,  
      gradient: 'from-gray-100 to-white',  
      query: 'Muéstrame los productos más vendidos del mes con precios en pesos chilenos',  
      category: 'ventas',  
      priority: 'high'  
    },  
    {  
      id: 'stock-critico',  
      title: 'Stock Crítico',  
      subtitle: 'Productos que necesitan reposición',  
      icon: <AlertTriangle className="w-5 h-5" />,  
      gradient: 'from-gray-900 to-black',  
      query: 'Analiza el stock crítico y dame recomendaciones de compra urgentes',  
      category: 'inventario',  
      priority: 'high'  
    },  
    {  
      id: 'rotacion-inventario',  
      title: 'Rotación de Inventario',  
      subtitle: 'Análisis de movimiento',  
      icon: <RotateCcw className="w-5 h-5" />,  
      gradient: 'from-gray-100 to-white',  
      query: 'Calcula la rotación de inventario y productos de lento movimiento',  
      category: 'inventario',  
      priority: 'medium'  
    },  
    {  
      id: 'productividad-equipo',  
      title: 'Productividad del Equipo',  
      subtitle: 'Análisis de rendimiento',  
      icon: <Users className="w-5 h-5" />,  
      gradient: 'from-gray-900 to-black',  
      query: 'Analiza la productividad del equipo y dame sugerencias de mejora',  
      category: 'personal',  
      priority: 'medium'  
    },  
    {  
      id: 'asistencia-personal',  
      title: 'Asistencia del Personal',  
      subtitle: 'Patrones y tendencias',  
      icon: <Clock className="w-5 h-5" />,  
      gradient: 'from-gray-100 to-white',  
      query: 'Revisa los patrones de asistencia del personal y optimizaciones',  
      category: 'personal',  
      priority: 'low'  
    },  
    {  
      id: 'flujo-caja',  
      title: 'Flujo de Caja',  
      subtitle: 'Análisis financiero completo',  
      icon: <BarChart3 className="w-5 h-5" />,  
      gradient: 'from-gray-900 to-black',  
      query: 'Genera análisis del flujo de caja en pesos chilenos con proyecciones',  
      category: 'finanzas',  
      priority: 'high'  
    },  
    {  
      id: 'rentabilidad-productos',  
      title: 'Rentabilidad por Producto',  
      subtitle: 'Margen y ROI detallado',  
      icon: <PieChart className="w-5 h-5" />,  
      gradient: 'from-gray-100 to-white',  
      query: 'Calcula la rentabilidad por producto con márgenes en pesos chilenos',  
      category: 'finanzas',  
      priority: 'medium'  
    },  
    {  
      id: 'insights-generales',  
      title: 'Insights Generales',  
      subtitle: 'Análisis de datos empresariales',  
      icon: <Lightbulb className="w-5 h-5" />,  
      gradient: 'from-gray-900 to-black',  
      query: 'Dame insights generales sobre el rendimiento de mi empresa',  
      category: 'general',  
      priority: 'high'  
    }  
  ];  
  
  const filteredActions = selectedCategory === 'all'   
    ? quickActions   
    : quickActions.filter(action => action.category === selectedCategory);  
  
  const categories = [  
    { id: 'all', name: 'Todas', icon: <Sparkles className="w-4 h-4" />, color: 'text-purple-600' },  
    { id: 'ventas', name: 'Ventas', icon: <DollarSign className="w-4 h-4" />, color: 'text-emerald-600' },  
    { id: 'inventario', name: 'Inventario', icon: <Package className="w-4 h-4" />, color: 'text-blue-600' },  
    { id: 'personal', name: 'Personal', icon: <Users className="w-4 h-4" />, color: 'text-green-600' },  
    { id: 'finanzas', name: 'Finanzas', icon: <BarChart3 className="w-4 h-4" />, color: 'text-violet-600' },  
    { id: 'general', name: 'Insights', icon: <Brain className="w-4 h-4" />, color: 'text-indigo-600' }  
  ];  
  
  // Detectar navegador  
  const detectBrowser = () => {  
    const userAgent = navigator.userAgent;  
    const isOpera = !!window.opr?.addons || !!window.opera || userAgent.indexOf(' OPR/') >= 0;  
    const isChrome = userAgent.indexOf('Chrome') > -1 && !isOpera;  
    const isEdge = userAgent.indexOf('Edg') > -1;  
    const isSafari = userAgent.indexOf('Safari') > -1 && !isChrome && !isOpera;  
    const isFirefox = userAgent.indexOf('Firefox') > -1;  
  
    if (isOpera) return 'Opera';  
    if (isEdge) return 'Edge';  
    if (isChrome) return 'Chrome';  
    if (isSafari) return 'Safari';  
    if (isFirefox) return 'Firefox';  
    return 'Unknown';  
  };  
  
  const getStateIcon = (state: VoiceState) => {  
    switch (state) {  
      case 'idle': return <CheckCircle className="w-4 h-4 text-green-500" />;  
      case 'listening': return <Mic2 className="w-4 h-4 text-blue-500" />;  
      case 'thinking': return <Brain className="w-4 h-4 text-purple-500" />;  
      case 'speaking': return <Headphones className="w-4 h-4 text-indigo-500" />;  
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;  
      default: return <Activity className="w-4 h-4 text-gray-500" />;  
    }  
  };  
  
  const getStateText = (state: VoiceState) => {  
    switch (state) {  
      case 'idle': return 'Listo para ayudarte';  
      case 'listening': return 'Escuchando...';  
      case 'thinking': return 'Analizando datos...';  
      case 'speaking': return 'Respondiendo...';  
      case 'error': return 'Error';  
      default: return 'Desconocido';  
    }  
  };  
  
  // ✅ Prevenir cierre al cambiar de pestaña  
  useEffect(() => {  
    const handleVisibilityChange = () => {  
      if (document.hidden) {  
        // Pausar reconocimiento de voz al cambiar de pestaña  
        if (isListening && recognitionRef.current) {  
          recognitionRef.current.stop();  
          setIsListening(false);  
          setVoiceState('idle');  
        }  
        // Pausar síntesis de voz  
        if (isSpeaking) {  
          speechSynthesis.pause();  
        }  
      } else {  
        // Reanudar síntesis de voz al regresar  
        if (isSpeaking) {  
          speechSynthesis.resume();  
        }  
      }  
    };  
  
    document.addEventListener('visibilitychange', handleVisibilityChange);  
    return () => {  
      document.removeEventListener('visibilitychange', handleVisibilityChange);  
    };  
  }, [isListening, isSpeaking]);  
  
  useEffect(() => {  
    if (isOpen) {  
      setBrowserInfo(detectBrowser());  
      checkMicrophonePermission();  
      initializeVoiceRecognition();  
      initializeAudioVisualization();  
      addWelcomeMessage();  
    }  
    return () => cleanup();  
  }, [isOpen]);  
  
  useEffect(() => {  
    scrollToBottom();  
  }, [messages]);  
  
  const scrollToBottom = () => {  
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });  
  };  
  
  // ✅ Verificar permisos del micrófono mejorado  
  const checkMicrophonePermission = async () => {  
    try {  
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });  
      setHasPermission(result.state === 'granted');  
        
      result.onchange = () => {  
        setHasPermission(result.state === 'granted');  
      };  
    } catch (error) {  
      console.error('Error checking microphone permission:', error);  
      setHasPermission(null);  
    }  
  };  
  
  const initializeAudioVisualization = async () => {  
    try {  
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });  
      audioContextRef.current = new AudioContext();  
      analyserRef.current = audioContextRef.current.createAnalyser();  
      const source = audioContextRef.current.createMediaStreamSource(stream);  
      source.connect(analyserRef.current);  
        
      analyserRef.current.fftSize = 256;  
      const bufferLength = analyserRef.current.frequencyBinCount;  
      const dataArray = new Uint8Array(bufferLength);  
        
      const updateVolume = () => {  
        if (analyserRef.current) {  
          analyserRef.current.getByteFrequencyData(dataArray);  
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;  
          setVoiceVolume(average);  
          requestAnimationFrame(updateVolume);  
        }  
      };  
      updateVolume();  
      setHasPermission(true);  
    } catch (error) {  
      console.error('Error initializing audio visualization:', error);  
      setHasPermission(false);  
      setError('No se pudo acceder al micrófono. Verifica los permisos.');  
    }  
  };  
  
  // ✅ Reconocimiento de voz mejorado con detección de navegador  
  const initializeVoiceRecognition = () => {  
    const SpeechRecognition =   
      (window as any).SpeechRecognition ||   
      (window as any).webkitSpeechRecognition ||  
      (window as any).mozSpeechRecognition ||  
      (window as any).msSpeechRecognition;  
  
    if (!SpeechRecognition) {  
      const isOpera = !!window.opr?.addons || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;  
      if (isOpera) {  
        setError("El reconocimiento de voz no es compatible con tu versión de Opera. Por favor, actualiza a la última versión o usa Chrome/Edge.");  
      } else {  
        setError("Tu navegador no soporta reconocimiento de voz. Prueba con Chrome, Edge o Safari.");  
      }  
      return;  
    }  
  
    const recognition = new SpeechRecognition();  
    recognitionRef.current = recognition;  
      
    // Configuración mejorada para español chileno  
    recognition.lang = "es-CL";  
    recognition.continuous = true;  
    recognition.interimResults = true;  
    recognition.maxAlternatives = 1;  
      
    // Configuración específica para Opera  
    if (navigator.userAgent.indexOf('OPR/') > -1) {  
      recognition.grammars = null;  
      recognition.maxAlternatives = 1;  
    }  
      
    recognition.onstart = () => {  
      setVoiceState("listening");  
      setIsListening(true);  
      setError('');  
    };  
      
    recognition.onresult = (event: any) => {  
      let interimTranscript = '';  
      let finalTranscriptPart = '';  
        
      for (let i = event.resultIndex; i < event.results.length; i++) {  
        const transcript = event.results[i][0].transcript;  
        if (event.results[i].isFinal) {  
          finalTranscriptPart += transcript;  
        } else {  
          interimTranscript += transcript;  
        }  
      }  
        
      setTranscript(interimTranscript);  
        
      if (finalTranscriptPart) {  
        setFinalTranscript(prev => prev + finalTranscriptPart);  
      }  
    };  
      
    recognition.onerror = (event: any) => {  
      console.error("Speech recognition error:", event.error);  
      let errorMessage = 'Error de reconocimiento';  
        
      switch (event.error) {  
        case 'no-speech':  
          errorMessage = 'No se detectó voz. Intenta hablar más cerca del micrófono.';  
          break;  
        case 'audio-capture':  
          errorMessage = 'No se pudo capturar audio. Verifica tu micrófono.';  
          break;  
        case 'not-allowed':  
          errorMessage = 'Permisos de micrófono denegados. Permite el acceso al micrófono.';  
          break;  
        case 'network':  
          errorMessage = 'Error de red. Verifica tu conexión a internet.';  
          break;  
        default:  
          errorMessage = `Error: ${event.error}`;  
      }  
        
      setError(errorMessage);  
      setVoiceState("error");  
      setIsListening(false);  
    };  
      
    recognition.onend = () => {  
      setIsListening(false);  
      if (voiceState === "listening") {  
        setVoiceState("idle");  
      }  
    };  
  };  
  
  const addWelcomeMessage = () => {  
    const welcomeMessage: VoiceMessage = {  
      id: `msg_${Date.now()}`,  
      text: `Hola, soy SolvIA Voice, tu asistente de voz especializado en gestión empresarial. Tengo acceso completo a tus datos y puedo ayudarte con análisis y consultas. ¿En qué puedo ayudarte hoy?`,  
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
  
  // ✅ Función toggle mejorada con manejo de permisos  
  const toggleListening = async () => {  
    if (!recognitionRef.current) {  
      const isOpera = !!window.opr?.addons || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;  
      if (isOpera) {  
        setError("Opera requiere configuración adicional. Asegúrate de que el sitio tenga permiso para usar el micrófono.");  
      }  
      return;  
    }  
      
    if (isListening) {  
      recognitionRef.current.stop();  
      setIsListening(false);  
      setVoiceState('idle');  
    } else {  
      try {  
        // Forzar la solicitud de permisos  
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });  
        stream.getTracks().forEach(track => track.stop());  
          
        setTranscript('');  
        setFinalTranscript('');  
        setError('');  
        setVoiceState('listening');  
          
        // Pequeño retraso para asegurar que el estado se actualice  
        setTimeout(() => {  
          try {  
            recognitionRef.current?.start();  
          } catch (err) {  
            console.error('Error al iniciar reconocimiento:', err);  
            setError('No se pudo iniciar el reconocimiento. Intenta recargar la página.');  
          }  
        }, 100);  
          
      } catch (error) {  
        console.error('Error al acceder al micrófono:', error);  
        setVoiceState('error');  
        setError('No se pudo acceder al micrófono. Verifica los permisos en la configuración de tu navegador.');  
      }  
    }  
  };  
  
  const sendVoiceMessage = async () => {  
    const messageToSend = finalTranscript.trim() || transcript.trim();  
      
    if (!messageToSend) {  
      setError('No hay mensaje para enviar. Habla primero.');  
      return;  
    }  
      
    if (isListening && recognitionRef.current) {  
      recognitionRef.current.stop();  
      setIsListening(false);  
    }  
      
    await handleVoiceInput(messageToSend);  
      
    setTranscript('');  
    setFinalTranscript('');  
    setVoiceState('idle');  
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
        
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;  
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;  
        
      if (!supabaseUrl || !supabaseKey) {  
        throw new Error('Configuración de Supabase no encontrada');  
      }  
        
      const response = await fetch(`${supabaseUrl}/functions/v1/smooth-responder`, {  
        method: 'POST',  
        headers: {  
          'Authorization': `Bearer ${supabaseKey}`,  
          'Content-Type': 'application/json',  
        },  
        body: JSON.stringify({  
          message: query,  
          context: context,  
          empresa_id: empresaId  
        }),  
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
        text: 'Disculpa, tuve un problema procesando tu consulta. ¿Podrías intentar de nuevo?',  
        isUser: false,  
        timestamp: new Date(),  
        isVoiceInput: false,  
        isVoiceOutput: true  
      };  
        
      setMessages(prev => [...prev, errorMessage]);  
      setVoiceState('idle');  
    }  
  };  
  
  // ✅ Síntesis de voz mejorada con selección óptima de voces  
  const speakText = (text: string) => {  
    if ('speechSynthesis' in window && !isMuted) {  
      speechSynthesis.cancel();  
        
      const utterance = new SpeechSynthesisUtterance(text);  
      utterance.rate = speechRate;  
      utterance.pitch = 1.0;  
      utterance.volume = 1.0;  
        
      const setOptimalVoice = () => {  
        const voices = speechSynthesis.getVoices();  
          
        const voicePriority = [  
          voices.find(v => v.lang === 'es-CL'),  
          voices.find(v => ['es-419', 'es-AR', 'es-MX', 'es-CO', 'es-US'].includes(v.lang)),  
          voices.find(v => v.lang.startsWith('es')),  
          voices[0]  
        ].filter(Boolean);  
  
        const selectedVoice = voicePriority[0] || null;  
          
        if (selectedVoice) {  
          utterance.voice = selectedVoice;  
          utterance.lang = selectedVoice.lang;  
        } else {  
          utterance.lang = 'es-CL';  
        }  
      };  
        
      if (speechSynthesis.getVoices().length > 0) {  
        setOptimalVoice();  
      } else {  
        speechSynthesis.onvoiceschanged = () => {  
          setOptimalVoice();  
          speechSynthesis.onvoiceschanged = null;  
        };  
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
    const ventasHoy = ventas.filter((v: any) => new Date(v.fecha).toDateString() === today);  
    const totalVentasHoy = ventasHoy.reduce((sum: number, venta: any) => sum + (parseFloat(venta.total) || 0), 0);  
    const stockBajo = productos.filter((p: any) => p.stock <= p.stock_minimo);  
  
    return {  
      fecha: new Date().toLocaleDateString('es-CL'),  
      hora: new Date().toLocaleTimeString('es-CL'),  
      metricas_hoy: {  
        ventas: {  
          total: totalVentasHoy,  
          cantidad: ventasHoy.length,  
          promedio: ventasHoy.length > 0 ? totalVentasHoy / ventasHoy.length : 0  
        },  
        mermas: {  
          cantidad: mermas.length,  
          valor_total: mermas.reduce((sum: number, m: any) => sum + (parseFloat(m.valor) || 0), 0)  
        },  
        asistencias: {  
          presentes: asistencias.filter((a: any) => a.estado === 'presente').length,  
          ausentes: asistencias.filter((a: any) => a.estado === 'ausente').length  
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
        activa: s.activo || true  
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
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {  
      audioContextRef.current.close().catch(console.error);  
    }  
  };  
  
  if (!isOpen) return null;  
  
  return (  
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">  
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[700px] flex shadow-2xl overflow-hidden">  
          
        {/* Sidebar con Quick Actions */}  
        <div className="w-80 bg-gradient-to-b from-slate-50 to-slate-100 border-r border-slate-200 flex flex-col">  
          <div className="p-4 border-b border-slate-200">  
            <div className="flex items-center space-x-2 mb-3">  
              <Zap className="w-5 h-5 text-blue-600" />  
              <h3 className="font-bold text-lg text-slate-800">Quick Actions</h3>  
            </div>  
              
            <div className="flex flex-wrap gap-1">  
              {categories.map((category) => (  
                <button  
                  key={category.id}  
                  onClick={() => setSelectedCategory(category.id)}  
                  className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs transition-all ${  
                    selectedCategory === category.id  
                      ? 'bg-blue-100 text-blue-700 font-medium'  
                      : 'text-slate-600 hover:bg-slate-200'  
                  }`}  
                >  
                  {category.icon}  
                  <span>{category.name}</span>  
                </button>  
              ))}  
            </div>  
          </div>  
  
          <div className="flex-1 overflow-y-auto p-4 space-y-3">  
            {filteredActions.map((action) => (  
              <button  
                key={action.id}  
                onClick={() => handleVoiceInput(action.query)}  
                className={`w-full p-3 rounded-xl text-left transition-all duration-300 transform hover:scale-105 hover:shadow-lg bg-gradient-to-r ${action.gradient} ${  
                  action.gradient.includes('gray-900') ? 'text-white' : 'text-gray-900'  
                } group`}  
              >  
                <div className="flex items-start space-x-3">  
                  <div className={`flex-shrink-0 p-2 ${  
                    action.gradient.includes('gray-900') ? 'bg-white bg-opacity-20' : 'bg-gray-900 bg-opacity-10'  
                  } rounded-lg`}>  
                    {action.icon}  
                  </div>  
                  <div className="flex-1 min-w-0">  
                    <h4 className="font-semibold text-sm transition-colors">  
                      {action.title}  
                    </h4>  
                    <p className="text-xs opacity-90 mt-1 line-clamp-2">  
                      {action.subtitle}  
                    </p>  
                    {action.priority === 'high' && (  
                      <div className="flex items-center mt-2">  
                        <Star className="w-3 h-3 text-yellow-400 mr-1" />  
                        <span className="text-xs font-medium">Recomendado</span>  
                      </div>  
                    )}  
                  </div>  
                  <ChevronRight className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />  
                </div>  
              </button>  
            ))}  
          </div>  
        </div>  
  
        {/* Panel Principal de Chat */}  
        <div className="flex-1 flex flex-col">  
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white p-6">  
            <div className="flex items-center justify-between">  
              <div className="flex items-center space-x-4">  
                <div className="relative">  
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">  
                    <img   
                      src="/SolvIA.jpg"   
                      alt="SolvIA"  
                      className="w-8 h-8 rounded-lg object-cover"  
                      onError={(e) => {  
                        e.currentTarget.style.display = 'none';  
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;  
                        if (nextElement) {  
                          nextElement.style.display = 'flex';  
                        }  
                      }}  
                    />  
                    <Brain className="w-6 h-6 hidden" />  
                  </div>  
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center animate-pulse">  
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>  
                  </div>  
                </div>  
                  
                <div>  
                  <h2 className="font-bold text-xl flex items-center space-x-2">  
                    <span>SolvIA Voice</span>  
                    <Sparkles className="w-5 h-5 text-yellow-300" />  
                  </h2>  
                  <div className="text-blue-100 text-sm flex items-center space-x-2">  
                    {getStateIcon(voiceState)}  
                    <span>Estado: {getStateText(voiceState)}</span>  
                    {isListening && (  
                      <div className="flex space-x-1">  
                        <Waves className="w-4 h-4 animate-pulse" />  
                        <Signal className="w-4 h-4 animate-pulse" style={{ animationDelay: '150ms' }} />  
                        <Radio className="w-4 h-4 animate-pulse" style={{ animationDelay: '300ms' }} />  
                      </div>  
                    )}  
                  </div>  
                </div>  
              </div>  
  
              <div className="flex items-center space-x-3">  
                <button  
                  onClick={() => setShowAdvancedControls(!showAdvancedControls)}  
                  className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"  
                  title="Controles avanzados"  
                >  
                  <Settings className="w-5 h-5" />  
                </button>  
                  
                <button  
                  onClick={() => setIsMuted(!isMuted)}  
                  className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"  
                  title={isMuted ? "Activar audio" : "Silenciar"}  
                >  
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}  
                </button>  
                  
                {isSpeaking && (  
                  <button  
                    onClick={stopSpeaking}  
                    className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"  
                    title="Detener reproducción"  
                  >  
                    <Square className="w-5 h-5" />  
                  </button>  
                )}  
                  
                <button  
                  onClick={onClose}  
                  className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"  
                >  
                  <X className="w-5 h-5" />  
                </button>  
              </div>  
            </div>  
  
            {/* Controles avanzados expandibles */}  
            {showAdvancedControls && (  
              <div className="mt-4 p-4 bg-white bg-opacity-10 rounded-lg backdrop-blur-sm">  
                <div className="grid grid-cols-2 gap-4">  
                  <div>  
                    <label className="text-xs text-blue-100 block mb-1">Velocidad de voz</label>  
                    <input  
                      type="range"  
                      min="0.5"  
                      max="2"  
                      step="0.1"  
                      value={speechRate}  
                      onChange={(e) => setSpeechRate(parseFloat(e.target.value))}  
                      className="w-full"  
                    />  
                    <span className="text-xs text-blue-200">{speechRate}x</span>  
                  </div>  
                  <div>  
                    <label className="text-xs text-blue-100 block mb-1">Volumen de entrada</label>  
                    <div className="w-full bg-white bg-opacity-20 rounded-full h-2">  
                      <div   
                        className="bg-green-400 h-2 rounded-full transition-all duration-100"  
                        style={{ width: `${Math.min(voiceVolume, 100)}%` }}  
                      ></div>  
                    </div>  
                  </div>  
                </div>  
              </div>  
            )}  
          </div>  
  
          {/* Área de mensajes */}  
          <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-50 to-white">  
            <div className="space-y-4">  
              {messages.map((message) => (  
                <div  
                  key={message.id}  
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}  
                >  
                  <div  
                    className={`max-w-md px-4 py-3 rounded-2xl shadow-sm ${  
                      message.isUser  
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'  
                        : 'bg-white text-gray-800 border border-gray-200'  
                    }`}  
                  >  
                    <p className="text-sm leading-relaxed">{message.text}</p>  
                    <div className="flex items-center justify-between mt-2">  
                      <span className={`text-xs ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>  
                        {message.timestamp.toLocaleTimeString('es-CL', {  
                          hour: '2-digit',  
                          minute: '2-digit'  
                        })}  
                      </span>  
                      <div className="flex items-center space-x-1">  
                        {message.isVoiceInput && (  
                          <Mic className="w-3 h-3 text-blue-400" />  
                        )}  
                        {message.isVoiceOutput && !message.isUser && (  
                          <Volume2 className="w-3 h-3 text-green-500" />  
                        )}  
                      </div>  
                    </div>  
                  </div>  
                </div>  
              ))}  
  
              {/* Vista previa de transcripción en tiempo real */}  
              {(transcript || finalTranscript) && (  
                <div className="flex justify-end">  
                  <div className="max-w-md px-4 py-3 rounded-2xl bg-blue-50 text-blue-800 border-2 border-dashed border-blue-300">  
                    <div className="flex items-center space-x-2 mb-2">  
                      <Mic2 className="w-4 h-4 text-blue-600" />  
                      <span className="text-xs font-medium text-blue-600">Vista previa</span>  
                    </div>  
                    <p className="text-sm">  
                      {finalTranscript}  
                      {transcript && <span className="italic opacity-70">{transcript}</span>}  
                    </p>  
                    <div className="flex items-center justify-between mt-2">  
                      <div className="flex items-center space-x-1">  
                        <Activity className="w-3 h-3 text-blue-600" />  
                        <span className="text-xs text-blue-600">  
                          {isListening ? 'Escuchando...' : 'Listo para enviar'}  
                        </span>  
                      </div>  
                    </div>  
                  </div>  
                </div>  
              )}  
  
              {/* Indicador de procesamiento */}  
              {voiceState === 'thinking' && (  
                <div className="flex justify-start">  
                  <div className="bg-white text-gray-800 px-4 py-3 rounded-2xl shadow-sm border">  
                    <div className="flex items-center space-x-3">  
                      <div className="flex space-x-1">  
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>  
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>  
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>  
                      </div>  
                      <Brain className="w-4 h-4 text-purple-500" />  
                      <span className="text-sm">SolvIA está analizando tus datos...</span>  
                    </div>  
                  </div>  
                </div>  
              )}  
              <div ref={messagesEndRef} />  
            </div>  
          </div>  
  
          {/* ✅ Controles de voz con toggle y botón de envío */}  
          <div className="border-t border-gray-200 p-6 bg-white">  
            <div className="flex items-center justify-center space-x-4">  
              {/* Botón toggle de micrófono */}  
              <button  
                onClick={toggleListening}  
                disabled={voiceState === 'thinking' || voiceState === 'speaking'}  
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all transform shadow-lg ${  
                  isListening  
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white scale-110 animate-pulse shadow-red-200'  
                    : voiceState === 'idle'  
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:scale-105 shadow-blue-200'  
                    : 'bg-gray-400 text-white cursor-not-allowed'  
                }`}  
              >  
                {isListening ? (  
                  <MicOff className="w-6 h-6" />  
                ) : (  
                  <Mic className="w-6 h-6" />  
                )}  
              </button>  
  
              {/* Botón de envío */}  
              <button  
                onClick={sendVoiceMessage}  
                disabled={!finalTranscript.trim() && !transcript.trim() || voiceState === 'thinking' || voiceState === 'speaking'}  
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all transform shadow-lg ${  
                  (finalTranscript.trim() || transcript.trim()) && voiceState === 'idle'  
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:scale-105 shadow-green-200'  
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'  
                }`}  
              >  
                <Send className="w-6 h-6" />  
              </button>  
            </div>  
  
            {/* Instrucciones dinámicas */}  
            <div className="mt-4 text-center">  
              <div className="flex items-center justify-center space-x-2">  
                {voiceState === 'idle' && !isListening && (  
                  <>  
                    <Mic className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-gray-600 font-medium">  
                      Haz clic en el micrófono para comenzar a grabar  
                    </p>  
                  </>  
                )}  
                {isListening && (  
                  <>  
                    <Waves className="w-4 h-4 text-blue-600 animate-pulse" />  
                    <p className="text-sm text-gray-600 font-medium">  
                      Grabando... Haz clic nuevamente para detener o usa el botón enviar  
                    </p>  
                  </>  
                )}  
                {voiceState === 'thinking' && (  
                  <>  
                    <Brain className="w-4 h-4 text-purple-600 animate-pulse" />  
                    <p className="text-sm text-gray-600 font-medium">  
                      Analizando tu consulta con IA avanzada...  
                    </p>  
                  </>  
                )}  
                {voiceState === 'speaking' && (  
                  <>  
                    <Headphones className="w-4 h-4 text-indigo-600 animate-pulse" />  
                    <p className="text-sm text-gray-600 font-medium">  
                      SolvIA está respondiendo...  
                    </p>  
                  </>  
                )}  
                {voiceState === 'error' && (  
                  <>  
                    <AlertTriangle className="w-4 h-4 text-red-600" />  
                    <p className="text-sm text-red-600 font-medium">  
                      {error}  
                    </p>  
                  </>  
                )}  
              </div>  
            </div>  
          </div>  
        </div>  
      </div>  
    </div>  
  );  
}