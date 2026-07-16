
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'home.html'),
        perfil: resolve(__dirname, 'perfil.html'),
        pedidos: resolve(__dirname, 'pedidos.html')
      }
    }
  },
  server: {
    open: '/home.html'
  }
});
