import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  /* Fecha de compilación, para que el reporte de errores diga QUÉ versión falló.
     Se inyecta al construir y no se escribe a mano: una constante en el código
     se queda vieja el primer día que nadie se acuerda de subirla, y entonces
     miente, que es peor que no estar. */
  define: {
    __APP_BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')),
  },
  base: '/GramMaster/',
  server: {
    port: 5174,
    open: false
  }
})
