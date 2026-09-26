# Mercanto Frontend

Cliente web Single Page Application (SPA) para la plataforma Mercanto, desarrollado con **Vue 3**, **TypeScript**, **Vite** y **Tailwind CSS**.

---

## ⚡ Tecnologías Principales

* **Framework:** [Vue 3](https://vuejs.org/) (Composition API con `<script setup>`)
* **Empaquetador & Dev Server:** [Vite](https://vitejs.dev/)
* **Tipado:** [TypeScript](https://www.typescriptlang.org/) con verificación estricta (`vue-tsc`)
* **Gestión de Estado:** [Pinia](https://pinia.vuejs.org/)
* **Enrutamiento:** [Vue Router](https://router.vuejs.org/)
* **Estilos:** [Tailwind CSS](https://tailwindcss.com/) y componentes de interfaz
* **Mapas & Geolocalización:** [Leaflet](https://leafletjs.com/) y `@vue-leaflet/vue-leaflet`
* **Validación de Datos:** [Zod](https://zod.dev/)
* **Utilidades Reactivas:** [@vueuse/core](https://vueuse.org/)

---

## 🌟 Funcionalidades de la Aplicación

* 🔍 **Búsqueda Avanzada y Multimodal:**
  - Búsqueda tradicional con filtros de precios, categorías, reputación y disponibilidad departamental.
  - Búsqueda visual por imagen (`ImageSearchView`), aprovechando el servicio de embeddings CLIP del backend.
* 📦 **Gestión de Catálogo y Productos:**
  - Exploración de inventario mayorista y detalle de productos con escalas de precios por volumen.
  - Panel para proveedores: alta de productos, actualización de existencias y gestión de catálogo.
* 💬 **Negociación y Mensajería:**
  - Módulo de chat integrado para comunicación directa entre compradores y distribuidores.
  - Flujo de cotizaciones formales (`QuoteDetailView`) y órdenes de compra.
* 💳 **Billetera Digital:**
  - Consulta de saldos, movimientos, transferencias y recargas para pagos B2B.
* 🗺️ **Cobertura Geoespacial:**
  - Visualización en mapa interactivo de la ubicación de los distribuidores y radios de entrega departamentales.

---

## 📂 Estructura del Proyecto

```
frontend/
├── src/
│   ├── api/            # Clientes HTTP y llamadas a endpoints del backend
│   ├── assets/         # Recursos estáticos (imágenes, iconos, fuentes)
│   ├── components/     # Componentes Vue reutilizables (UI, tablas, modales)
│   ├── composables/    # Funciones de lógica compartida (Vue composables)
│   ├── router/         # Configuración de rutas y guardias de autenticación
│   ├── stores/         # Stores de Pinia (autenticación, carrito, usuario, etc.)
│   ├── views/          # Páginas y vistas principales de la aplicación
│   ├── App.vue         # Componente raíz
│   └── main.ts         # Punto de entrada de la aplicación
├── package.json        # Dependencias y scripts de Node.js
├── vite.config.ts      # Configuración de Vite y plugins
└── justfile            # Recetas de automatización local
```

---

## 🚀 Guía de Instalación y Ejecución

### Requisitos Previos
* **Node.js**: v18.0.0 o superior (se recomienda versión LTS).
* **npm**: v9.0.0 o superior.
* **Just**: Gestor de tareas (opcional pero recomendado).

### 1. Variables de Entorno
Copia el archivo de ejemplo para configurar la URL del backend:
```bash
cp .env.example .env
```

Contenido típico de `.env`:
```env
VITE_API_BASE_URL=https://localhost:8443
```

### 2. Instalación de Dependencias
```bash
# Con just:
just install

# O con npm:
npm install
```

### 3. Servidor de Desarrollo
Inicia el servidor local con Hot Module Replacement (HMR):
```bash
# Con just:
just dev

# O con npm:
npm run dev
```

Por defecto, la aplicación estará disponible en `http://localhost:5173`.

### 4. Verificación de Tipos y Compilación para Producción
```bash
# Verificar tipos de TypeScript:
just typecheck

# Compilar para producción (genera la carpeta dist/):
just build

# Previsualizar el paquete compilado localmente:
just preview
```

---

## 🧭 Recetas `just` Disponibles

| Receta | Comando Equivalente | Descripción |
| :--- | :--- | :--- |
| `just install` | `npm install` | Instala dependencias del proyecto. |
| `just dev` | `npm run dev` | Inicia el servidor de desarrollo Vite. |
| `just build` | `npm run build` | Ejecuta verificación de tipos y compilación optimizada. |
| `just typecheck` | `npm run typecheck` | Comprueba tipos TypeScript con `vue-tsc --noEmit`. |
| `just preview` | `npm run preview` | Sirve la carpeta `dist/` para pruebas locales. |
