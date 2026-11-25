import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa: el build funciona abierto desde cualquier carpeta o servidor local
export default defineConfig({
  plugins: [react()],
  base: './',
});
