# Mercanto Frontend

Cliente web Single Page Application (SPA) para la plataforma Mercanto, desarrollado con **Vue 3**, **TypeScript**, **Vite** y **Tailwind CSS**.

---

## 🛠️ Stack de Tecnologías

| Categoría | Tecnologías | Descripción y Rol |
| :--- | :--- | :--- |
| **Framework Base** | **Vue 3** | Composition API reactiva utilizando la sintaxis `<script setup>` |
| **Herramienta de Compilación** | **Vite** | Dev server ultrarrápido con Hot Module Replacement (HMR) y bundler |
| **Sistema de Tipos** | **TypeScript** & **vue-tsc** | Tipado estático robusto y verificación en tiempo de desarrollo |
| **Gestión de Estado** | **Pinia** | Store central reactivo para autenticación, carrito y contexto de usuario |
| **Enrutamiento** | **Vue Router** | Navegación SPA con guardias de autenticación y roles de usuario |
| **Estilos & Diseño** | **Tailwind CSS** | Clases de utilidad y sistema de diseño responsive |
| **Mapas & Geoespacial** | **Leaflet** & `@vue-leaflet` | Visualización interactiva de proveedores y radios de cobertura departamental |
| **Validación de Esquemas** | **Zod** | Validación y parseo seguro de entradas y respuestas HTTP |
| **Utilidades Reactivas** | **@vueuse/core** | Colección de utilidades y composables reactivos de Vue |
| **Runtime & Servidor Web** | **Nginx Alpine** / **Node.js** | Servidor web estático optimizado para producción en contenedor OCI |

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
* **Podman** y **Podman Compose** (entorno de ejecución de contenedores principal).
* **Node.js**: v26 (LTS o superior) y `npm` (opcional si se ejecuta directamente en el host).
* **Just**: Gestor de tareas.

### 1. Variables de Entorno
Copia el archivo de ejemplo para configurar la URL del backend:
```bash
cp .env.example .env
```

---

### 2. Desarrollo con Contenedores (Podman)

El entorno de desarrollo utiliza una imagen **Debian** de Node.js (`node:26-slim`) sincronizada con la versión local, montando el código y la carpeta `node_modules` para evitar reinstalaciones constantes:

```bash
# Iniciar servidor de desarrollo en contenedor (puerto 5173 con HMR):
just dev
# o: podman compose -f debug.compose.yml up

# Detener el contenedor de desarrollo:
just down-dev
```

*(Si prefieres desarrollo local en el host sin contenedores, puedes usar `just install` y `just dev-local`)*.

---

### 3. Compilación y Despliegue de Producción (Nginx)

El empaquetado para producción utiliza un `Containerfile` multi-etapa:
1. Compila la SPA con `node:26-slim`.
2. Embebe los binarios estáticos en un contenedor ligero **Nginx Alpine** configurado con soporte para rutas SPA (`try_files $uri $uri/ /index.html;`) y compresión gzip.

```bash
# Construir la imagen de producción con Podman:
just build-image
# o: podman build -t mercanto-frontend:prod -f Containerfile .

# Desplegar el contenedor de producción en segundo plano (puerto 3000):
just up-prod
# o: podman compose up -d

# Ver registros en vivo:
just logs-prod

# Detener el contenedor de producción:
just down-prod
```

---

## 🧭 Recetas `just` Disponibles

| Receta | Comando Equivalente | Descripción |
| :--- | :--- | :--- |
| `just dev` | `podman compose -f debug.compose.yml up` | Inicia el entorno de desarrollo en contenedor con Node 26 Debian. |
| `just down-dev` | `podman compose -f debug.compose.yml down` | Detiene el contenedor de desarrollo. |
| `just logs-dev` | `podman compose -f debug.compose.yml logs -f` | Sigue los logs del servidor de desarrollo en contenedor. |
| `just build-image`| `podman build -t mercanto-frontend:prod -f Containerfile .` | Compila la imagen OCI de producción con Nginx. |
| `just up-prod` | `podman compose up -d` | Despliega el contenedor de producción (`compose.yml`). |
| `just down-prod` | `podman compose down` | Detiene el contenedor de producción. |
| `just logs-prod` | `podman compose logs -f` | Sigue los logs del contenedor de producción. |
| `just install` | `npm install` | Instala dependencias `npm` localmente en el host. |
| `just dev-local` | `npm run dev` | Inicia el servidor de desarrollo local en el host. |
| `just build-local`| `npm run build` | Compila estáticos localmente en la carpeta `dist/`. |
| `just typecheck` | `npm run typecheck` | Ejecuta verificación estática de tipos con `vue-tsc`. |
| `just preview` | `npm run preview` | Previsualiza el build de producción localmente. |

