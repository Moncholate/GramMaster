import { useState, useCallback, useEffect } from 'react';

/**
 * Hook personalizado para síntesis de voz
 * @returns {object} - { speak, stop, isSpeaking, isSupported, error }
 */
export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
  }, []);

  const speak = useCallback((text, options = {}) => {
    if (!isSupported) {
      setError('Speech synthesis is not supported in this browser');
      return false;
    }

    if (!text) {
      setError('No text provided');
      return false;
    }

    try {
      // Cancelar cualquier síntesis en progreso
      window.speechSynthesis.cancel();
      setError(null);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate || 0.9;
      utterance.lang = options.lang || 'en-US';
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (event) => {
        setIsSpeaking(false);
        setError(`Speech synthesis error: ${event.error}`);
      };

      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      setError(`Failed to speak: ${err.message}`);
      setIsSpeaking(false);
      return false;
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    error
  };
}
