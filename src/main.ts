import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './style.css';

// Lato
import "@fontsource/lato/400.css";       // Regular
import "@fontsource/lato/400-italic.css"; // Italic
import "@fontsource/lato/700.css";       // Bold
import "@fontsource/lato/700-italic.css"; // BoldItalic
import { registerSessionListeners } from './events/sessionListeners';
import { bootstrapApp } from './utils/bootstrap';
import { useAlertStore } from './stores/alertStore';

const app = createApp(App);

app.use(createPinia());

// Handle uncaught Vue component runtime errors globally
app.config.errorHandler = (err: unknown) => {
  console.error('[Global App Error]:', err);
  const alertStore = useAlertStore();
  const message = err instanceof Error ? err.message : String(err);
  alertStore.showError(message, "Error Inesperado");
};

registerSessionListeners();

(async () => {
  await bootstrapApp();
  app.use(router);
  app.mount('#app');
})();
