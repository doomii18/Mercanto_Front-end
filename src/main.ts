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

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');
