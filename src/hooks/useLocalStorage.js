import { useState, useEffect } from 'react';

/**
 * Hook personalizado para persistir estado en localStorage
 * @param {string} key - Clave para almacenar en localStorage
 * @param {any} initialValue - Valor inicial si no existe en localStorage
 * @returns {[any, function]} - [valor, función para actualizar]
 */
export function useLocalStorage(key, initialValue) {
  // Obtener valor inicial de localStorage o usar el valor por defecto
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Actualizar localStorage cuando el valor cambie
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

/**
 * Hook para manejar estadísticas de sesión con reset diario
 * @returns {object} - { stats, incrementStats, resetStats }
 */
export function useSessionStats() {
  const [stats, setStats] = useLocalStorage('sessionStats', { total: 0, today: 0 });
  const [totalAllTime, setTotalAllTime] = useLocalStorage('totalAllTime', 0);
  const [lastVisit, setLastVisit] = useLocalStorage('lastVisit', '');

  useEffect(() => {
    const today = new Date().toDateString();
    if (lastVisit !== today) {
      // Nuevo día, resetear contador diario
      setStats({ total: 0, today: 0 });
      setLastVisit(today);
    }
  }, [lastVisit, setLastVisit, setStats]);

  const incrementStats = () => {
    setStats(prev => ({
      total: prev.total + 1,
      today: prev.today + 1
    }));
    setTotalAllTime(prev => prev + 1);
  };

  const resetStats = () => {
    setStats({ total: 0, today: 0 });
  };

  return {
    stats,
    totalAllTime,
    incrementStats,
    resetStats
  };
}
