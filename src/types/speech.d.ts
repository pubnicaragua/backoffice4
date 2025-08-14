declare global {  
  interface SpeechRecognition extends EventTarget {  
    continuous: boolean;  
    grammars: SpeechGrammarList;  
    interimResults: boolean;  
    lang: string;  
    maxAlternatives: number;  
    serviceURI: string;  
    start(): void;  
    stop(): void;  
    abort(): void;  
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;  
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;  
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;  
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;  
  }  
  
  interface SpeechRecognitionEvent extends Event {  
    results: SpeechRecognitionResultList;  
    resultIndex: number;  
  }  
  
  interface SpeechRecognitionErrorEvent extends Event {  
    error: string;  
    message: string;  
  }  
  
  interface Window {  
    SpeechRecognition: {  
      new (): SpeechRecognition;  
    };  
    webkitSpeechRecognition: {  
      new (): SpeechRecognition;  
    };  
  }  
}  
  
export {};