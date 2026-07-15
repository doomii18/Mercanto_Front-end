import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'Home.html'),
        perfil: resolve(__dirname, 'Perfil.html'),
        pedidos: resolve(__dirname, 'Pedidos.html')
      }
    }
  },
  server: {
    open: '/Home.html'
  }
});
