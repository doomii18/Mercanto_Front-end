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

const app = createApp(App);

app.use(createPinia());

registerSessionListeners();

(async () => {
  await bootstrapApp();
  app.use(router);
  app.mount('#app');
})();
