// hooks/useGlobalVoiceSolvIA.ts  
import { useState, useEffect } from 'react';  
  
export const useGlobalVoiceSolvIA = () => {  
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);  
  
  // Activación por tecla de acceso rápido  
  useEffect(() => {  
    const handleKeyPress = (event: KeyboardEvent) => {  
      // Ctrl + Shift + V para activar SolvIA  
      if (event.ctrlKey && event.shiftKey && event.key === 'V') {  
        setIsVoiceOpen(true);  
      }  
      // Escape para cerrar  
      if (event.key === 'Escape' && isVoiceOpen) {  
        setIsVoiceOpen(false);  
      }  
    };  
  
    window.addEventListener('keydown', handleKeyPress);  
    return () => window.removeEventListener('keydown', handleKeyPress);  
  }, [isVoiceOpen]);  
  
  return {  
    isVoiceOpen,  
    setIsVoiceOpen  
  };  
};