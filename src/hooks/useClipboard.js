import { useState, useCallback } from 'react';

/**
 * Hook personalizado para copiar al portapapeles
 * @param {number} resetDelay - Tiempo en ms para resetear el estado "copied" (default: 2000)
 * @returns {object} - { copy, copied, error }
 */
export function useClipboard(resetDelay = 2000) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const copy = useCallback(async (text) => {
    if (!text) {
      setError('No text provided to copy');
      return false;
    }

    try {
      // Intentar usar la API moderna del portapapeles
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback para navegadores antiguos
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (!successful) {
          throw new Error('Copy command failed');
        }
      }

      setCopied(true);
      setError(null);

      // Resetear estado después del delay
      setTimeout(() => setCopied(false), resetDelay);
      return true;
    } catch (err) {
      setError(`Failed to copy: ${err.message}`);
      setCopied(false);
      return false;
    }
  }, [resetDelay]);

  return {
    copy,
    copied,
    error
  };
}
