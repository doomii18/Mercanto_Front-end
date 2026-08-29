<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { GeocodingService } from "../modules/geo";

// Assets
import mochilaImg from "../assets/mochila.png";
import utensiliosImg from "../assets/utensilios.png";
import tabletaImg from "../assets/tableta.png";
import paletaImg from "../assets/paleta.png";

// Available Catalog for Modal Selection
interface CatalogProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  provider: string;
}

const availableCatalog = ref<CatalogProduct[]>([
  {
    id: "laptop-adventure",
    name: "Laptop Adventure",
    category: "Artículos Tecnológicos",
    price: 600,
    image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&q=80",
    provider: "NicaTech S. A",
  },
  {
    id: "cargador-samsung",
    name: "Cargador Samsung",
    category: "Artículos Tecnológicos",
    price: 600,
    image: "https://images.unsplash.com/photo-1628149455678-16f37bc392f4?w=400&q=80",
    provider: "NicaTech S. A",
  },
  {
    id: "usb-hp-64gb",
    name: "USB HP 64 GB",
    category: "Artículos Tecnológicos",
    price: 600,
    image: "https://images.unsplash.com/photo-1622535056705-4171a824b7a4?w=400&q=80",
    provider: "Mangua Labs S.A.",
  },
  {
    id: "tablet-para-ninos",
    name: "Tablet para niños",
    category: "Artículos Tecnológicos",
    price: 950,
    image: tabletaImg,
    provider: "Mangua Labs S.A.",
  },
  {
    id: "mochila-adventure",
    name: "Mochila Adventure",
    category: "Bolsos & Maletas",
    price: 350,
    image: mochilaImg,
    provider: "Megaboutique S.A",
  },
  {
    id: "set-de-ollas",
    name: "Set de ollas 9 piezas",
    category: "Cocina",
    price: 350,
    image: utensiliosImg,
    provider: "Megaboutique S.A",
  },
  {
    id: "paleta-de-sombras",
    name: "Paleta de sombras",
    category: "Makeup & Cuidado personal",
    price: 350,
    image: paletaImg,
    provider: "Megaboutique S.A",
  },
  {
    id: "smart-watch-apple",
    name: "Smart Watch Apple",
    category: "Artículos Tecnológicos",
    price: 350,
    image: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=400&q=80",
    provider: "Apante Software",
  },
  {
    id: "consola-de-video",
    name: "Consola de video",
    category: "Artículos Tecnológicos",
    price: 850,
    image: "https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=400&q=80",
    provider: "Apante Software",
  },
]);

// Selected User Products in Smart Search
interface SelectedProductItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

// Initial View Mode: 'config' (Initial screen matching the screenshot)
const viewMode = ref<"config" | "results">("config");

// Selected products list starts empty to show the initial empty state from screenshot
const selectedProducts = ref<SelectedProductItem[]>([]);

// Location and Preferences State
const deliveryAddress = ref("Managua, Nicaragua");
const pricePreference = ref(70);
const distancePreference = computed(() => 100 - pricePreference.value);

// Modals State
const showProductModal = ref(false);
const showGpsModal = ref(false);
const showDetailModal = ref(false);
const selectedOptionDetail = ref<any>(null);

// Product Modal Filtering
const productSearchFilter = ref("");
const filteredCatalog = computed(() => {
  const q = productSearchFilter.value.trim().toLowerCase();
  if (!q) return availableCatalog.value;
  return availableCatalog.value.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.provider.toLowerCase().includes(q)
  );
});

// GPS Map Leaflet State
const mapContainer = ref<HTMLElement | null>(null);
let mapInstance: any = null;
let markerInstance: any = null;
const mapAddressText = ref("Managua, Nicaragua");
const tempLat = ref<number | null>(12.1328);
const tempLng = ref<number | null>(-86.2504);
const isLocating = ref(false);
const DEFAULT_CENTER = [12.1328, -86.2504];

// Dynamic calculations based on selected products and preferences
const primaryOption = computed(() => {
  const total = 28150;
  const original = 31600;
  const savings = original - total;
  const savingsPct = ((savings / original) * 100).toFixed(1);
  return {
    providerName: "NicaTech S. A",
    initial: "N",
    verified: true,
    rating: "4.0",
    location: "Managua, Managua",
    deliveryTime: "2 - 3 días",
    deliveryCarrier: "Empresas de paquetería",
    distance: "127 km",
    subtotal: 25350,
    shippingCost: 2800,
    total: 28150,
    originalTotal: 31600,
    savings: 3450,
    savingsPercent: savingsPct,
  };
});

const alternativeOption = computed(() => {
  return {
    providerName: "Managua S. A",
    tableProviderName: "Managua Tech S.A",
    initial: "M",
    verified: true,
    rating: "4.0",
    location: "Managua, Managua",
    deliveryTime: "2 - 3 días",
    deliveryCarrier: "Empresas de paquetería",
    distance: "127 km",
    subtotal: 28800,
    shippingCost: 1200,
    total: 31500,
    originalTotal: 31600,
    savings: 100,
    savingsPercent: "0.3",
  };
});

// Stepper / Remove / Add Handlers
const removeProduct = (index: number) => {
  selectedProducts.value.splice(index, 1);
};

const addProductFromCatalog = (product: CatalogProduct) => {
  const existing = selectedProducts.value.find((p) => p.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    selectedProducts.value.push({
      id: product.id,
      name: product.name,
      quantity: 12,
      price: product.price,
      image: product.image,
    });
  }
  showProductModal.value = false;
};

const executeSearch = () => {
  if (selectedProducts.value.length === 0) {
    // If user clicks without products, prefill default 3 products
    selectedProducts.value = [
      {
        id: "laptop-adventure",
        name: "Laptop Adventure",
        quantity: 12,
        price: 600,
        image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&q=80",
      },
      {
        id: "cargador-samsung",
        name: "Cargador Samsung",
        quantity: 12,
        price: 600,
        image: "https://images.unsplash.com/photo-1628149455678-16f37bc392f4?w=400&q=80",
      },
      {
        id: "usb-hp-64gb",
        name: "USB HP 64 GB",
        quantity: 12,
        price: 600,
        image: "https://images.unsplash.com/photo-1622535056705-4171a824b7a4?w=400&q=80",
      },
    ];
  }
  viewMode.value = "results";
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const goToConfigView = () => {
  viewMode.value = "config";
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// Leaflet Lifecycle & Map Methods
onMounted(() => {
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (!document.getElementById("leaflet-css")) {
    const link = document.createElement("link");
    link.id = "leaflet-css";
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }
  if (!(window as any).L && !document.getElementById("leaflet-js")) {
    const script = document.createElement("script");
    script.id = "leaflet-js";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    document.head.appendChild(script);
  }
});

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
});

const openGpsModal = async () => {
  showGpsModal.value = true;
  await nextTick();

  const L = (window as any).L;
  if (!L || !mapContainer.value) return;

  if (!mapInstance) {
    const initialLat = tempLat.value || DEFAULT_CENTER[0];
    const initialLng = tempLng.value || DEFAULT_CENTER[1];

    mapInstance = L.map(mapContainer.value).setView([initialLat, initialLng], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(mapInstance);

    mapInstance.on("click", (e: any) => updateMapMarker(e.latlng.lat, e.latlng.lng));

    updateMapMarker(initialLat, initialLng);
  } else {
    mapInstance.invalidateSize();
  }
};

const updateMapMarker = async (lat: number, lng: number) => {
  const L = (window as any).L;
  tempLat.value = lat;
  tempLng.value = lng;

  if (markerInstance) {
    markerInstance.setLatLng([lat, lng]);
  } else {
    markerInstance = L.marker([lat, lng], { draggable: true }).addTo(mapInstance);
    markerInstance.on("dragend", (e: any) => {
      const pos = e.target.getLatLng();
      updateMapMarker(pos.lat, pos.lng);
    });
  }

  mapAddressText.value = "Obteniendo dirección...";
  try {
    const addr = await GeocodingService.reverseGeocode(lat, lng);
    mapAddressText.value = addr;
  } catch {
    mapAddressText.value = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
  }
};

const useCurrentGpsLocation = () => {
  if (!navigator.geolocation) {
    window.alert("Geolocalización no soportada por su navegador.");
    return;
  }

  isLocating.value = true;
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      if (mapInstance) {
        mapInstance.setView([latitude, longitude], 15);
        await updateMapMarker(latitude, longitude);
      }
      isLocating.value = false;
    },
    () => {
      window.alert("No se pudo obtener el permiso de ubicación.");
      isLocating.value = false;
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
};

const confirmGpsLocation = () => {
  if (mapAddressText.value) {
    deliveryAddress.value = mapAddressText.value;
  }
  showGpsModal.value = false;
};

const openOptionDetails = (option: any) => {
  selectedOptionDetail.value = option;
  showDetailModal.value = true;
};

const confirmAndOrder = () => {
  showDetailModal.value = false;
  window.alert("¡Pedido registrado con éxito mediante Búsqueda Inteligente!");
};
</script>

<template>
  <div class="smart-search-view-container">
    <!-- Header Banner / Título e Info -->
    <div class="smart-header-banner">
      <div class="header-title-col">
        <h1 class="main-title">
          <i class="fa-solid fa-magnifying-glass-dollar search-orange-icon"></i>
          Búsqueda inteligente
        </h1>
        <p class="main-subtitle">
          Gestiona tu lista de productos y encontraremos para ti los mejores proveedores combinando precio, distancia y disponibilidad en tu ubicación.
        </p>
      </div>

      <div class="how-it-works-card">
        <div class="how-icon-circle">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
        </div>
        <div class="how-text-content">
          <strong>¿Cómo funciona?</strong>
          <p>Nuestro algoritmo compara precios, distancia y tiempos de entrega para recomendarte la mejor opción para tu pedido.</p>
        </div>
      </div>
    </div>

    <!-- VISTA 1: CONFIGURACIÓN INICIAL (ESTADO VACÍO / IMAGEN 1) -->
    <div v-if="viewMode === 'config'" class="config-view-layout">
      <!-- Barra de Pasos -->
      <div class="steps-progress-box">
        <span class="steps-box-label">SIGUE ESTOS PASOS PARA COMENZAR</span>
        <div class="steps-cards-row">
          <div class="step-badge-card">
            <div class="step-num-circle orange">1</div>
            <div class="step-info-text">
              <strong>Agrega tu lista de productos</strong>
              <p>Busca y agrega los productos que necesitas y sus cantidades.</p>
            </div>
          </div>

          <div class="step-badge-card">
            <div class="step-num-circle teal">2</div>
            <div class="step-info-text">
              <strong>Selecciona tu ubicación</strong>
              <p>Usaremos tu ubicación para calcular distancias y tiempos de entrega.</p>
            </div>
          </div>

          <div class="step-badge-card">
            <div class="step-num-circle peach">3</div>
            <div class="step-info-text">
              <strong>Recibe las mejores opciones</strong>
              <p>Te mostraremos los proveedores con la mejor combinación de precio y distancia.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Dos Paneles Principales -->
      <div class="two-columns-panels">
        <!-- Panel 1: Lista de Productos -->
        <div class="panel-box">
          <h3 class="panel-box-title">
            <i class="fa-solid fa-list-check"></i> 1. Agrega los productos que necesitas
          </h3>

          <!-- Estado Vacío -->
          <div v-if="selectedProducts.length === 0" class="empty-products-wrapper">
            <div class="empty-icon-badge">
              <i class="fa-regular fa-clipboard"></i>
            </div>
            <h4>Tu lista de productos está vacía</h4>
            <p>Busca o agrega los productos que necesitas para que podamos encontrar los mejores proveedores para ti.</p>
            <button type="button" class="btn-teal-pill" @click="showProductModal = true">
              Buscar y agregar productos
            </button>
          </div>

          <!-- Lista con productos agregados -->
          <div v-else class="added-products-list">
            <div
              v-for="(prod, idx) in selectedProducts"
              :key="idx"
              class="added-product-row"
            >
              <img :src="prod.image" :alt="prod.name" class="added-prod-thumb" />
              <div class="added-prod-meta">
                <strong>{{ prod.name }}</strong>
                <span>{{ prod.quantity }} und • C$ {{ prod.price }}</span>
              </div>
              <button
                type="button"
                class="btn-delete-row"
                title="Eliminar producto"
                @click="removeProduct(idx)"
              >
                ✕
              </button>
            </div>

            <button
              type="button"
              class="btn-outline-teal-action"
              @click="showProductModal = true"
            >
              + Agregar otro producto
            </button>
          </div>

          <div class="panel-bottom-hint">
            <i class="fa-solid fa-circle-info"></i>
            <span><strong>Consejo:</strong> Puedes agregar varios productos y cantidades para obtener mejores resultados.</span>
          </div>
        </div>

        <!-- Panel 2: Ubicación y Preferencias -->
        <div class="panel-box">
          <h3 class="panel-box-title">
            <i class="fa-solid fa-location-dot"></i> 2. Selecciona tu ubicación de entrega
          </h3>
          <p class="panel-box-desc">Esta ubicación se usará para calcular distancias y tiempos de entrega.</p>

          <div class="location-picker-group">
            <div class="location-text-field">
              <i class="fa-solid fa-location-dot loc-icon"></i>
              <input
                v-model="deliveryAddress"
                type="text"
                placeholder="Ingresa tu ubicación de entrega"
              />
              <button
                v-if="deliveryAddress"
                type="button"
                class="btn-clear-address"
                @click="deliveryAddress = ''"
              >
                ✕
              </button>
            </div>
            <button type="button" class="btn-location-gps-btn" @click="openGpsModal">
              <i class="fa-solid fa-location-arrow"></i> Usar mi ubicación
            </button>
          </div>

          <div class="preferences-container">
            <div class="pref-header-row">
              <label class="pref-title">Preferencias (opcional)</label>
              <i class="fa-regular fa-circle-question pref-info-icon"></i>
            </div>
            <p class="pref-subtitle">Ajusta lo que es más importante para ti en la búsqueda.</p>

            <!-- Slider 1: Precio -->
            <div class="pref-range-control">
              <div class="range-labels">
                <span>Precio</span>
                <strong>{{ pricePreference }}%</strong>
              </div>
              <input
                v-model.number="pricePreference"
                type="range"
                min="0"
                max="100"
                class="styled-slider teal-track"
              />
            </div>

            <!-- Slider 2: Distancia -->
            <div class="pref-range-control">
              <div class="range-labels">
                <span>Distancia</span>
                <strong>{{ distancePreference }}%</strong>
              </div>
              <input
                :value="distancePreference"
                type="range"
                min="0"
                max="100"
                class="styled-slider orange-track"
                disabled
              />
            </div>

            <span class="pref-bottom-text">Puedes ajustar estos parámetros para mejores resultados.</span>
          </div>
        </div>
      </div>

      <!-- Botón Central de Búsqueda Inteligente -->
      <div class="action-submit-zone">
        <button type="button" class="btn-orange-search-large" @click="executeSearch">
          <i class="fa-solid fa-magnifying-glass-dollar"></i> Búsqueda Inteligente
        </button>
        <span class="trust-guarantee-text">
          <i class="fa-regular fa-circle-check"></i> Es rápido, seguro y sin compromisos.
        </span>
      </div>
    </div>

    <!-- VISTA 2: RESULTADOS Y COMPARATIVA (IMAGEN 2) -->
    <div v-else class="results-view-layout">
      <div class="results-grid-structure">
        <!-- Columna Lateral Izquierda (Ajustes y Lista) -->
        <aside class="results-sidebar-col">
          <!-- Tarjeta 1: Lista de Productos -->
          <div class="side-info-card">
            <div class="side-card-top-title">
              <i class="fa-regular fa-clipboard side-icon-heading"></i>
              <div>
                <h4>Lista de productos</h4>
                <p>Agrega los productos que necesitas</p>
              </div>
            </div>

            <div class="side-items-stack">
              <div
                v-for="(prod, idx) in selectedProducts"
                :key="prod.id"
                class="side-product-card-item"
              >
                <img :src="prod.image" :alt="prod.name" class="side-thumb-image" />
                <div class="side-thumb-meta">
                  <h5>{{ prod.name }}</h5>
                  <span class="qty-line">Cantidad: {{ prod.quantity }} und</span>
                  <span class="price-line">Precio unitario: C$ {{ prod.price }}</span>
                </div>
                <button
                  type="button"
                  class="btn-trash-item"
                  title="Eliminar producto"
                  @click="removeProduct(idx)"
                >
                  ✕
                </button>
              </div>
            </div>

            <button
              type="button"
              class="btn-add-another-item"
              @click="showProductModal = true"
            >
              + Agregar otro producto
            </button>
          </div>

          <!-- Tarjeta 2: Ubicación de Entrega -->
          <div class="side-info-card">
            <h4>Ubicación de entrega</h4>
            <p class="side-card-sublabel">Selecciona tu ubicación para calcular el envío</p>

            <div class="side-address-pill">
              <i class="fa-solid fa-location-dot teal-pin"></i>
              <span>{{ deliveryAddress }}</span>
            </div>

            <button type="button" class="btn-side-gps-action" @click="openGpsModal">
              Usar mi ubicación <i class="fa-solid fa-crosshairs"></i>
            </button>
          </div>

          <!-- Tarjeta 3: Preferencias -->
          <div class="side-info-card">
            <h4>Preferencias</h4>
            <p class="side-card-sublabel">¿Qué es más importante para ti?</p>

            <div class="side-metric-row">
              <div class="metric-label">
                <i class="fa-solid fa-circle-dollar-to-slot"></i> Precios
              </div>
              <div class="metric-track-bar">
                <div class="metric-fill-bar teal" :style="{ width: `${pricePreference}%` }"></div>
              </div>
            </div>

            <div class="side-metric-row">
              <div class="metric-label">
                <i class="fa-solid fa-location-arrow"></i> Distancia
              </div>
              <div class="metric-track-bar">
                <div class="metric-fill-bar orange" :style="{ width: `${distancePreference}%` }"></div>
              </div>
            </div>

            <button type="button" class="btn-side-recalculate-btn" @click="executeSearch">
              <i class="fa-solid fa-magnifying-glass-dollar"></i> Búsqueda Inteligente
            </button>

            <button type="button" class="btn-link-edit-search" @click="goToConfigView">
              <i class="fa-solid fa-arrow-left"></i> Modificar búsqueda
            </button>
          </div>
        </aside>

        <!-- Columna Principal Derecha (Tarjetas y Comparativa) -->
        <main class="results-main-area">
          <!-- Encabezado de Resultados y Ahorro -->
          <div class="results-top-banner">
            <div class="results-title-block">
              <h2>
                <i class="fa-solid fa-magnifying-glass-dollar search-orange-icon"></i>
                Búsqueda Inteligente
              </h2>
              <p>Hemos encontrado las mejores opciones para tí</p>
            </div>

            <div class="savings-piggy-card">
              <div class="savings-amount-col">
                <span class="savings-tagline">Ahorro estimado:</span>
                <strong class="savings-val-text">C$ 3, 450</strong>
              </div>
              <div class="piggy-icon-container">
                <i class="fa-solid fa-piggy-bank"></i>
              </div>
            </div>
          </div>

          <!-- Tarjeta 1: La Mejor Opción Para Ti -->
          <div class="provider-card-box best-recommendation">
            <div class="provider-tag-label best-tag">La mejor opción para ti</div>

            <div class="provider-card-inner-grid">
              <div class="prov-col-info">
                <span class="sub-heading-gray">Proveedor recomendado</span>
                <div class="avatar-title-line">
                  <div class="prov-avatar-icon">
                    <span>{{ primaryOption.initial }}</span>
                  </div>
                  <div class="prov-name-wrap">
                    <strong>{{ primaryOption.providerName }}</strong>
                    <i class="fa-solid fa-circle-check verified-badge"></i>
                  </div>
                </div>
                <div class="rating-stars-line">
                  <i class="fa-solid fa-star star-amber"></i>
                  <span>{{ primaryOption.rating }}</span>
                </div>
                <p class="prov-location-line">{{ primaryOption.location }}</p>
              </div>

              <div class="prov-col-logistics">
                <span class="sub-heading-gray">Tiempo de entrega estimado</span>
                <div class="delivery-badge-line">
                  <i class="fa-solid fa-truck-fast icon-teal-sm"></i>
                  <strong>{{ primaryOption.deliveryTime }}</strong>
                </div>
                <span class="carrier-desc">{{ primaryOption.deliveryCarrier }}</span>

                <span class="sub-heading-gray mt-2">Distancia</span>
                <div class="distance-badge-line">
                  <i class="fa-solid fa-location-dot icon-teal-sm"></i>
                  <strong>{{ primaryOption.distance }}</strong>
                </div>
                <span class="distance-desc">Desde tu ubicación</span>
              </div>

              <div class="prov-col-pricing">
                <span class="sub-heading-gray">Total por tu pedido</span>
                <div class="price-strong-orange">
                  C$ 28, 150
                </div>
                <span class="strikethrough-old-price">C$ 31, 600</span>
                <span class="savings-green-pill">
                  Ahorras: <strong>C$ 3, 450 (10.9 %)</strong>
                </span>

                <button
                  type="button"
                  class="btn-action-view-best"
                  @click="openOptionDetails(primaryOption)"
                >
                  Ver detalle y continuar
                </button>
              </div>
            </div>
          </div>

          <!-- Tarjeta 2: Opción Alternativa -->
          <div class="provider-card-box alt-recommendation">
            <div class="provider-tag-label alt-tag">Opción alternativa</div>

            <div class="provider-card-inner-grid">
              <div class="prov-col-info">
                <span class="sub-heading-gray">Proveedor recomendado</span>
                <div class="avatar-title-line">
                  <div class="prov-avatar-icon alt-avatar">
                    <span>{{ alternativeOption.initial }}</span>
                  </div>
                  <div class="prov-name-wrap">
                    <strong>{{ alternativeOption.providerName }}</strong>
                    <i class="fa-solid fa-circle-check verified-badge"></i>
                  </div>
                </div>
                <div class="rating-stars-line">
                  <i class="fa-solid fa-star star-amber"></i>
                  <span>{{ alternativeOption.rating }}</span>
                </div>
                <p class="prov-location-line">{{ alternativeOption.location }}</p>
              </div>

              <div class="prov-col-logistics">
                <span class="sub-heading-gray">Tiempo de entrega estimado</span>
                <div class="delivery-badge-line">
                  <i class="fa-solid fa-truck-fast icon-teal-sm"></i>
                  <strong>{{ alternativeOption.deliveryTime }}</strong>
                </div>
                <span class="carrier-desc">{{ alternativeOption.deliveryCarrier }}</span>

                <span class="sub-heading-gray mt-2">Distancia</span>
                <div class="distance-badge-line">
                  <i class="fa-solid fa-location-dot icon-teal-sm"></i>
                  <strong>{{ alternativeOption.distance }}</strong>
                </div>
                <span class="distance-desc">Desde tu ubicación</span>
              </div>

              <div class="prov-col-pricing">
                <span class="sub-heading-gray">Total por tu pedido</span>
                <div class="price-strong-orange peach-color">
                  C$ 31, 500
                </div>
                <span class="strikethrough-old-price">C$ 31, 600</span>
                <span class="savings-green-pill">
                  Ahorras: <strong>C$ 100 (0.3 %)</strong>
                </span>

                <button
                  type="button"
                  class="btn-action-view-alt"
                  @click="openOptionDetails(alternativeOption)"
                >
                  Ver detalle y continuar
                </button>
              </div>
            </div>
          </div>

          <!-- Tabla Comparativa Detallada -->
          <div class="comparison-matrix-card">
            <table class="comparison-data-table">
              <thead>
                <tr>
                  <th class="col-detail-th">Detalle</th>
                  <th>
                    NicaTech S.A
                    <span class="table-tag-badge best-table-badge">MEJOR OPCIÓN</span>
                  </th>
                  <th>
                    Managua Tech S.A
                    <span class="table-tag-badge alt-table-badge">Opción alternativa</span>
                  </th>
                  <th class="col-diff-th">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="td-category-name">Subtotal productos</td>
                  <td>C$ 25,350</td>
                  <td>C$ 28,800</td>
                  <td class="diff-favorable">C$ 3,450 ↓</td>
                </tr>
                <tr>
                  <td class="td-category-name">Costo de envio</td>
                  <td>C$ 2,800</td>
                  <td>C$ 1,200</td>
                  <td class="diff-unfavorable">-C$ 1,600 ↑</td>
                </tr>
                <tr>
                  <td class="td-category-name">Distancia</td>
                  <td>127 km</td>
                  <td>12 km</td>
                  <td class="diff-unfavorable">115 km ↑</td>
                </tr>
                <tr>
                  <td class="td-category-name">Tiempo de entrega</td>
                  <td>2-3 dias</td>
                  <td>1 dia</td>
                  <td class="diff-unfavorable">+1-2 dias ↑</td>
                </tr>
                <tr>
                  <td class="td-category-name">Calificación</td>
                  <td>4.0 <i class="fa-regular fa-star"></i></td>
                  <td>4.5 <i class="fa-regular fa-star"></i></td>
                  <td class="diff-unfavorable">-0.5 ↓</td>
                </tr>
                <tr class="table-total-row-highlight">
                  <td class="td-category-name"><strong>Total por tu pedido</strong></td>
                  <td><strong>C$ 28,150</strong></td>
                  <td><strong>C$ 31,500</strong></td>
                  <td class="diff-favorable"><strong>C$ 3,450 ↓</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>

    <!-- MODAL 1: Catálogo de Productos Web -->
    <div v-if="showProductModal" class="modal-overlay-bg" @click.self="showProductModal = false">
      <div class="modal-window-box modal-catalog-size">
        <div class="modal-top-bar">
          <h3>
            <i class="fa-solid fa-bag-shopping"></i> Agregar Productos a Búsqueda Inteligente
          </h3>
          <button type="button" class="btn-close-modal-icon" @click="showProductModal = false">✕</button>
        </div>

        <div class="modal-search-field-wrap">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input
            v-model="productSearchFilter"
            type="text"
            placeholder="Buscar por nombre, categoría o proveedor..."
          />
        </div>

        <div class="modal-catalog-grid">
          <div
            v-for="item in filteredCatalog"
            :key="item.id"
            class="modal-catalog-card"
          >
            <img :src="item.image" :alt="item.name" class="modal-card-img" />
            <div class="modal-card-info">
              <span class="card-category-label">{{ item.category }}</span>
              <h5 class="card-item-title">{{ item.name }}</h5>
              <span class="card-provider-name">Por: {{ item.provider }}</span>
              <span class="card-item-price">C$ {{ item.price }}</span>
            </div>
            <button
              type="button"
              class="btn-add-to-search-list"
              @click="addProductFromCatalog(item)"
            >
              <i class="fa-solid fa-plus"></i> Agregar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL 2: Mapa GPS con Leaflet -->
    <div v-if="showGpsModal" class="modal-overlay-bg" @click.self="showGpsModal = false">
      <div class="modal-window-box modal-gps-size">
        <div class="modal-top-bar">
          <h3>
            <i class="fa-solid fa-map-location-dot"></i> Selecciona tu Ubicación de Entrega
          </h3>
          <button type="button" class="btn-close-modal-icon" @click="showGpsModal = false">✕</button>
        </div>

        <div class="gps-modal-content-area">
          <div class="gps-control-bar">
            <button
              type="button"
              class="btn-detect-gps-now"
              :disabled="isLocating"
              @click="useCurrentGpsLocation"
            >
              <i :class="isLocating ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-crosshairs'"></i>
              {{ isLocating ? "Detectando GPS..." : "Usar mi ubicación actual" }}
            </button>
            <span class="gps-tip-text">Haz clic o arrastra el marcador en el mapa</span>
          </div>

          <div ref="mapContainer" class="map-view-frame"></div>

          <div class="gps-selected-address-badge">
            <i class="fa-solid fa-location-dot pin-orange"></i>
            <div>
              <strong>Ubicación seleccionada:</strong>
              <p>{{ mapAddressText }}</p>
            </div>
          </div>
        </div>

        <div class="modal-bottom-actions">
          <button type="button" class="btn-modal-cancel" @click="showGpsModal = false">Cancelar</button>
          <button type="button" class="btn-modal-confirm-orange" @click="confirmGpsLocation">
            <i class="fa-solid fa-check"></i> Guardar Ubicación
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 3: Detalle de la Opción Seleccionada -->
    <div v-if="showDetailModal" class="modal-overlay-bg" @click.self="showDetailModal = false">
      <div class="modal-window-box modal-details-size">
        <div class="modal-top-bar">
          <h3>
            <i class="fa-solid fa-circle-check"></i> Pedido con {{ selectedOptionDetail?.providerName }}
          </h3>
          <button type="button" class="btn-close-modal-icon" @click="showDetailModal = false">✕</button>
        </div>

        <div class="order-detail-modal-body">
          <div class="confirmed-provider-box">
            <i class="fa-solid fa-circle-check check-teal-lg"></i>
            <div>
              <strong>¡Mejor combinación de proveedor confirmada!</strong>
              <p>Tu pedido será preparado por {{ selectedOptionDetail?.providerName }} y despachado hacia {{ deliveryAddress }}.</p>
            </div>
          </div>

          <h4>Resumen de Productos ({{ selectedProducts.length }})</h4>
          <div class="order-items-scroll-box">
            <div
              v-for="item in selectedProducts"
              :key="item.id"
              class="order-item-detail-row"
            >
              <img :src="item.image" :alt="item.name" />
              <div class="order-item-text-info">
                <strong>{{ item.name }}</strong>
                <span>{{ item.quantity }} unidades x C$ {{ item.price }}</span>
              </div>
              <span class="order-item-total-cost">
                C$ {{ (item.price * item.quantity).toLocaleString() }}
              </span>
            </div>
          </div>

          <hr class="modal-split-line" />

          <div class="order-final-breakdown">
            <div class="breakdown-line">
              <span>Subtotal:</span>
              <strong>C$ {{ selectedOptionDetail?.subtotal?.toLocaleString() }}</strong>
            </div>
            <div class="breakdown-line">
              <span>Costo de envío:</span>
              <strong>C$ {{ selectedOptionDetail?.shippingCost?.toLocaleString() }}</strong>
            </div>
            <div class="breakdown-line final-total-strong">
              <span>Total a pagar:</span>
              <strong>C$ {{ selectedOptionDetail?.total?.toLocaleString() }}</strong>
            </div>
          </div>
        </div>

        <div class="modal-bottom-actions">
          <button type="button" class="btn-modal-cancel" @click="showDetailModal = false">Cerrar</button>
          <button
            type="button"
            class="btn-modal-confirm-orange"
            @click="confirmAndOrder"
          >
            Confirmar y Realizar Pedido
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.smart-search-view-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.smart-header-banner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 0.5rem;
}

.header-title-col {
  flex: 1;
}

.main-title {
  font-family: 'Lora', serif;
  font-size: 1.9rem;
  font-weight: 700;
  color: var(--primary-blue, #083c5a);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.4rem;
}

.search-orange-icon {
  color: var(--primary-orange, #ff6a00);
}

.main-subtitle {
  color: #64748b;
  font-size: 0.92rem;
  line-height: 1.5;
  max-width: 680px;
}

.how-it-works-card {
  background-color: #d6f2ef;
  border-radius: 16px;
  padding: 1rem 1.3rem;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  max-width: 360px;
  box-shadow: 0 4px 15px rgba(24, 156, 148, 0.08);
}

.how-icon-circle {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background-color: var(--primary-blue, #083c5a);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  flex-shrink: 0;
}

.how-text-content strong {
  color: var(--primary-blue, #083c5a);
  font-size: 0.9rem;
  display: block;
  margin-bottom: 0.2rem;
}

.how-text-content p {
  color: #4a5568;
  font-size: 0.78rem;
  line-height: 1.35;
  margin: 0;
}

/* ==========================================================================
   VISTA 1: CONFIGURACIÓN INICIAL (IMAGEN 1)
   ========================================================================== */
.config-view-layout {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.steps-progress-box {
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 18px;
  padding: 1.25rem 1.75rem;
}

.steps-box-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--primary-blue, #083c5a);
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: 1rem;
}

.steps-cards-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

.step-badge-card {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  background-color: #f8fafc;
  padding: 0.9rem 1.1rem;
  border-radius: 14px;
  border: 1px solid #edf2f7;
}

.step-num-circle {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.95rem;
  flex-shrink: 0;
}

.step-num-circle.orange {
  background-color: #ffedd5;
  color: #ea580c;
}

.step-num-circle.teal {
  background-color: #ccfbf1;
  color: #0d9488;
}

.step-num-circle.peach {
  background-color: #ffedd5;
  color: #c2410c;
}

.step-info-text strong {
  color: var(--primary-blue, #083c5a);
  font-size: 0.88rem;
  display: block;
  margin-bottom: 0.2rem;
}

.step-info-text p {
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.35;
  margin: 0;
}

/* Dos Columnas */
.two-columns-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.panel-box {
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 20px;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
}

.panel-box-title {
  font-family: 'Lora', serif;
  font-size: 1.18rem;
  font-weight: 700;
  color: var(--primary-blue, #083c5a);
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.4rem;
}

.panel-box-desc {
  color: #718096;
  font-size: 0.85rem;
  margin-bottom: 1.1rem;
}

.empty-products-wrapper {
  background-color: #f8fafc;
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  padding: 2.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 1.25rem;
}

.empty-icon-badge {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: #e2e8f0;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 0.8rem;
}

.empty-products-wrapper h4 {
  font-size: 1rem;
  color: var(--primary-blue, #083c5a);
  margin-bottom: 0.35rem;
  font-weight: 700;
}

.empty-products-wrapper p {
  color: #64748b;
  font-size: 0.85rem;
  line-height: 1.45;
  max-width: 300px;
  margin-bottom: 1.25rem;
}

.btn-teal-pill {
  background-color: var(--light-teal, #189c94);
  color: #ffffff;
  border: none;
  padding: 0.65rem 1.5rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.92rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-teal-pill:hover {
  background-color: #12746e;
  transform: translateY(-2px);
}

.added-products-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.added-product-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: #f8fafc;
  padding: 0.55rem 0.75rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.added-prod-thumb {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.added-prod-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.added-prod-meta strong {
  font-size: 0.88rem;
  color: var(--primary-blue, #083c5a);
}

.added-prod-meta span {
  font-size: 0.78rem;
  color: #64748b;
}

.btn-delete-row {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.95rem;
}

.btn-delete-row:hover {
  color: #ef4444;
}

.btn-outline-teal-action {
  border: 1.5px solid var(--light-teal, #189c94);
  color: var(--light-teal, #189c94);
  background: transparent;
  padding: 0.5rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}

.panel-bottom-hint {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #64748b;
  background-color: #f1f5f9;
  padding: 0.65rem 0.85rem;
  border-radius: 10px;
}

/* Input de Ubicación */
.location-picker-group {
  display: flex;
  gap: 0.65rem;
  margin-bottom: 1.5rem;
}

.location-text-field {
  flex: 1;
  display: flex;
  align-items: center;
  border: 1.5px solid #cbd5e1;
  border-radius: 12px;
  padding: 0.55rem 0.85rem;
  background: #ffffff;
  gap: 0.5rem;
}

.loc-icon {
  color: #64748b;
}

.location-text-field input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.88rem;
  color: #1e293b;
}

.btn-clear-address {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-weight: bold;
}

.btn-location-gps-btn {
  border: 1.5px solid #cbd5e1;
  background: #ffffff;
  color: var(--primary-blue, #083c5a);
  padding: 0.55rem 1rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.btn-location-gps-btn:hover {
  border-color: var(--light-teal, #189c94);
  color: var(--light-teal, #189c94);
}

/* Preferencias */
.preferences-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-top: 1px solid #edf2f7;
  padding-top: 1rem;
}

.pref-header-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.pref-title {
  font-weight: 700;
  font-size: 0.92rem;
  color: var(--primary-blue, #083c5a);
}

.pref-info-icon {
  color: #94a3b8;
  font-size: 0.82rem;
}

.pref-subtitle {
  color: #64748b;
  font-size: 0.8rem;
  margin-bottom: 0.35rem;
}

.pref-range-control {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #334155;
  font-weight: 600;
}

.styled-slider {
  width: 100%;
  height: 6px;
  border-radius: 4px;
  outline: none;
  background: #e2e8f0;
}

.styled-slider.teal-track {
  accent-color: var(--light-teal, #189c94);
}

.styled-slider.orange-track {
  accent-color: var(--primary-orange, #ff6a00);
}

.pref-bottom-text {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.35rem;
}

.action-submit-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
  margin-top: 0.5rem;
}

.btn-orange-search-large {
  background: linear-gradient(180deg, #ff7a18 0%, #ff5500 100%);
  color: #ffffff;
  border: none;
  padding: 0.9rem 3.2rem;
  border-radius: 30px;
  font-size: 1.15rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 6px 20px rgba(255, 85, 0, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-orange-search-large:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(255, 85, 0, 0.45);
}

.trust-guarantee-text {
  font-size: 0.85rem;
  color: var(--light-teal, #189c94);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

/* ==========================================================================
   VISTA 2: RESULTADOS Y COMPARATIVA (IMAGEN 2)
   ========================================================================== */
.results-view-layout {
  display: flex;
  flex-direction: column;
}

.results-grid-structure {
  display: grid;
  grid-template-columns: 290px 1fr;
  gap: 1.5rem;
  align-items: start;
}

.results-sidebar-col {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.side-info-card {
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 18px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
}

.side-card-top-title {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.side-icon-heading {
  font-size: 1.3rem;
  color: #64748b;
  margin-top: 0.1rem;
}

.side-card-top-title h4,
.side-info-card h4 {
  font-size: 1rem;
  color: var(--primary-blue, #083c5a);
  font-weight: 700;
  margin-bottom: 0.15rem;
}

.side-card-top-title p,
.side-card-sublabel {
  font-size: 0.78rem;
  color: #64748b;
}

.side-items-stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.side-product-card-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  background-color: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 12px;
  padding: 0.5rem 0.65rem;
  position: relative;
}

.side-thumb-image {
  width: 44px;
  height: 44px;
  object-fit: contain;
}

.side-thumb-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.side-thumb-meta h5 {
  font-size: 0.85rem;
  color: var(--primary-blue, #083c5a);
  font-weight: 700;
  margin-bottom: 0.1rem;
}

.qty-line {
  font-size: 0.75rem;
  color: #64748b;
}

.price-line {
  font-size: 0.78rem;
  color: #1e293b;
  font-weight: 600;
}

.btn-trash-item {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.2rem;
}

.btn-trash-item:hover {
  color: #ef4444;
}

.btn-add-another-item {
  border: 1.5px solid var(--light-teal, #189c94);
  background: transparent;
  color: var(--light-teal, #189c94);
  padding: 0.55rem 0.85rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add-another-item:hover {
  background-color: var(--light-teal, #189c94);
  color: #ffffff;
}

.side-address-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1.5px solid var(--light-teal, #189c94);
  border-radius: 10px;
  padding: 0.5rem 0.7rem;
  font-size: 0.82rem;
  color: var(--primary-blue, #083c5a);
  font-weight: 600;
  margin: 0.65rem 0;
}

.teal-pin {
  color: var(--light-teal, #189c94);
}

.btn-side-gps-action {
  border: 1.5px solid var(--light-teal, #189c94);
  background: transparent;
  color: var(--light-teal, #189c94);
  padding: 0.5rem 0.85rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.82rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  cursor: pointer;
}

.btn-side-gps-action:hover {
  background-color: #f0fdfa;
}

.side-metric-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 0.65rem;
}

.metric-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--primary-blue, #083c5a);
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.metric-track-bar {
  width: 100%;
  height: 6px;
  background-color: #1e293b;
  border-radius: 4px;
  overflow: hidden;
}

.metric-fill-bar {
  height: 100%;
}

.metric-fill-bar.teal {
  background-color: var(--light-teal, #189c94);
}

.metric-fill-bar.orange {
  background-color: var(--primary-orange, #ff6a00);
}

.btn-side-recalculate-btn {
  background: linear-gradient(180deg, #ff7a18 0%, #ff5500 100%);
  color: #ffffff;
  border: none;
  padding: 0.7rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  margin-top: 1.25rem;
  box-shadow: 0 4px 15px rgba(255, 85, 0, 0.25);
}

.btn-link-edit-search {
  background: none;
  border: none;
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 600;
  margin-top: 0.65rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
}

.btn-link-edit-search:hover {
  color: var(--primary-blue, #083c5a);
}

/* Main Results Area */
.results-main-area {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.results-top-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.results-title-block h2 {
  font-family: 'Lora', serif;
  font-size: 1.65rem;
  color: var(--primary-blue, #083c5a);
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.2rem;
}

.results-title-block p {
  color: #64748b;
  font-size: 0.9rem;
}

.savings-piggy-card {
  background-color: #f0fdfa;
  border: 1.5px solid #99f6e4;
  border-radius: 14px;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.savings-amount-col {
  display: flex;
  flex-direction: column;
}

.savings-tagline {
  font-size: 0.72rem;
  color: #0d9488;
}

.savings-val-text {
  font-size: 1.2rem;
  color: var(--primary-blue, #083c5a);
  font-weight: 700;
}

.piggy-icon-container {
  font-size: 1.45rem;
  color: #0d9488;
}

/* Provider Recommendation Cards */
.provider-card-box {
  background: #ffffff;
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  padding-top: 1.75rem;
}

.provider-card-box.best-recommendation {
  border: 2px solid var(--light-teal, #189c94);
}

.provider-card-box.alt-recommendation {
  border: 1.5px solid #e2e8f0;
}

.provider-tag-label {
  position: absolute;
  top: 0;
  left: 20px;
  padding: 0.3rem 1.2rem;
  border-radius: 0 0 12px 12px;
  font-size: 0.8rem;
  font-weight: 700;
}

.best-tag {
  background-color: var(--light-teal, #189c94);
  color: #ffffff;
}

.alt-tag {
  background-color: #ffe4e6;
  color: #e11d48;
}

.provider-card-inner-grid {
  padding: 1rem 1.75rem 1.5rem;
  display: grid;
  grid-template-columns: 1.2fr 1fr 1.2fr;
  gap: 1.25rem;
  align-items: center;
}

.sub-heading-gray {
  font-size: 0.75rem;
  color: #64748b;
  display: block;
  margin-bottom: 0.35rem;
}

.mt-2 {
  margin-top: 0.75rem;
}

.avatar-title-line {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-bottom: 0.35rem;
}

.prov-avatar-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
}

.prov-avatar-icon.alt-avatar {
  background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%);
}

.prov-name-wrap {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.prov-name-wrap strong {
  font-size: 0.92rem;
  color: var(--primary-blue, #083c5a);
}

.verified-badge {
  color: #0284c7;
  font-size: 0.95rem;
}

.rating-stars-line {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--primary-blue, #083c5a);
  margin-bottom: 0.2rem;
}

.star-amber {
  color: var(--primary-orange, #ff6a00);
}

.prov-location-line {
  font-size: 0.8rem;
  color: #64748b;
}

.delivery-badge-line,
.distance-badge-line {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.9rem;
  color: var(--primary-blue, #083c5a);
}

.icon-teal-sm {
  color: var(--light-teal, #189c94);
  font-size: 1.05rem;
}

.carrier-desc,
.distance-desc {
  font-size: 0.75rem;
  color: #64748b;
  display: block;
}

.prov-col-pricing {
  display: flex;
  flex-direction: column;
}

.price-strong-orange {
  font-family: 'Lora', serif;
  font-size: 1.55rem;
  font-weight: 700;
  color: var(--primary-orange, #ff6a00);
}

.price-strong-orange.peach-color {
  color: #c2410c;
}

.strikethrough-old-price {
  font-size: 0.82rem;
  color: #94a3b8;
  text-decoration: line-through;
  margin-bottom: 0.2rem;
}

.savings-green-pill {
  font-size: 0.8rem;
  color: #0d9488;
  margin-bottom: 0.75rem;
}

.btn-action-view-best {
  background-color: var(--light-teal, #189c94);
  color: #ffffff;
  border: none;
  padding: 0.6rem 1.25rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-action-view-best:hover {
  background-color: #12746e;
}

.btn-action-view-alt {
  border: 1.5px solid var(--light-teal, #189c94);
  background: transparent;
  color: var(--light-teal, #189c94);
  padding: 0.6rem 1.25rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-action-view-alt:hover {
  background-color: var(--light-teal, #189c94);
  color: #ffffff;
}

/* Tabla Comparativa */
.comparison-matrix-card {
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 18px;
  overflow: hidden;
}

.comparison-data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.comparison-data-table th,
.comparison-data-table td {
  padding: 0.85rem 1.2rem;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.85rem;
}

.comparison-data-table th {
  background-color: #f8fafc;
  color: var(--primary-blue, #083c5a);
  font-weight: 700;
}

.col-detail-th {
  width: 25%;
}

.col-diff-th {
  width: 20%;
}

.table-tag-badge {
  display: block;
  font-size: 0.65rem;
  font-weight: 700;
  border-radius: 10px;
  padding: 0.12rem 0.45rem;
  width: fit-content;
  margin-top: 0.2rem;
}

.table-tag-badge.best-table-badge {
  background-color: #ccfbf1;
  color: #0d9488;
}

.table-tag-badge.alt-table-badge {
  background-color: #f1f5f9;
  color: #0284c7;
}

.td-category-name {
  color: #475569;
  font-weight: 500;
}

.diff-favorable {
  color: #0d9488;
  font-weight: 700;
}

.diff-unfavorable {
  color: #dc2626;
  font-weight: 600;
}

.table-total-row-highlight {
  background-color: #f8fafc;
}

.table-total-row-highlight td {
  border-bottom: none;
  font-size: 0.92rem;
  color: var(--primary-blue, #083c5a);
}

/* ==========================================================================
   Modales
   ========================================================================== */
.modal-overlay-bg {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1.5rem;
}

.modal-window-box {
  background: #ffffff;
  border-radius: 20px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.modal-catalog-size {
  max-width: 680px;
}

.modal-gps-size {
  max-width: 720px;
}

.modal-details-size {
  max-width: 580px;
}

.modal-top-bar {
  padding: 1.2rem 1.6rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-top-bar h3 {
  font-size: 1.15rem;
  color: var(--primary-blue, #083c5a);
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0;
}

.btn-close-modal-icon {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #64748b;
  cursor: pointer;
}

.modal-search-field-wrap {
  padding: 0.9rem 1.6rem 0.4rem;
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.modal-search-field-wrap input {
  flex: 1;
  border: 1.5px solid #cbd5e1;
  border-radius: 20px;
  padding: 0.5rem 1.1rem;
  font-size: 0.9rem;
  outline: none;
}

.modal-catalog-grid {
  padding: 0.9rem 1.6rem 1.4rem;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.9rem;
}

.modal-catalog-card {
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.modal-card-img {
  height: 75px;
  object-fit: contain;
  margin-bottom: 0.45rem;
}

.modal-card-info {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  margin-bottom: 0.75rem;
}

.card-category-label {
  font-size: 0.7rem;
  color: #64748b;
}

.card-item-title {
  font-size: 0.88rem;
  color: var(--primary-blue, #083c5a);
  font-weight: 700;
}

.card-provider-name {
  font-size: 0.72rem;
  color: #94a3b8;
}

.card-item-price {
  font-size: 0.95rem;
  color: var(--primary-orange, #ff6a00);
  font-weight: 700;
}

.btn-add-to-search-list {
  background-color: var(--light-teal, #189c94);
  color: #ffffff;
  border: none;
  padding: 0.45rem 1.1rem;
  border-radius: 16px;
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
  width: 100%;
}

/* GPS Modal Frame */
.gps-modal-content-area {
  padding: 1.2rem 1.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  flex: 1;
}

.gps-control-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.9rem;
}

.btn-detect-gps-now {
  background-color: #f0fdfa;
  border: 1.5px solid var(--light-teal, #189c94);
  color: var(--light-teal, #189c94);
  padding: 0.45rem 1.1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.gps-tip-text {
  font-size: 0.78rem;
  color: #64748b;
}

.map-view-frame {
  height: 300px;
  width: 100%;
  border-radius: 14px;
  border: 1.5px solid #cbd5e1;
}

.gps-selected-address-badge {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  background-color: #f8fafc;
  padding: 0.7rem 0.9rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.pin-orange {
  color: var(--primary-orange, #ff6a00);
  font-size: 1.15rem;
  margin-top: 0.15rem;
}

.gps-selected-address-badge strong {
  font-size: 0.85rem;
  color: var(--primary-blue, #083c5a);
}

.gps-selected-address-badge p {
  font-size: 0.8rem;
  color: #475569;
  margin: 0;
}

.modal-bottom-actions {
  padding: 0.9rem 1.6rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 0.9rem;
}

.btn-modal-cancel {
  background: none;
  border: 1.5px solid #cbd5e1;
  color: #64748b;
  padding: 0.55rem 1.25rem;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
}

.btn-modal-confirm-orange {
  background-color: var(--primary-orange, #ff6a00);
  color: #ffffff;
  border: none;
  padding: 0.55rem 1.5rem;
  border-radius: 20px;
  font-weight: 700;
  cursor: pointer;
}

/* Order Details Modal */
.order-detail-modal-body {
  padding: 1.4rem 1.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.confirmed-provider-box {
  background-color: #f0fdfa;
  border: 1.5px solid #99f6e4;
  border-radius: 12px;
  padding: 0.75rem 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.check-teal-lg {
  color: #0d9488;
  font-size: 1.35rem;
}

.order-items-scroll-box {
  max-height: 180px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.order-item-detail-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.45rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.order-item-detail-row img {
  width: 38px;
  height: 38px;
  object-fit: contain;
}

.order-item-text-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.order-item-text-info strong {
  font-size: 0.85rem;
  color: var(--primary-blue, #083c5a);
}

.order-item-text-info span {
  font-size: 0.75rem;
  color: #64748b;
}

.order-item-total-cost {
  font-weight: 700;
  color: var(--primary-blue, #083c5a);
  font-size: 0.9rem;
}

.modal-split-line {
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 0.45rem 0;
}

.order-final-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.breakdown-line {
  display: flex;
  justify-content: space-between;
  font-size: 0.88rem;
  color: #475569;
}

.breakdown-line.final-total-strong {
  font-size: 1.05rem;
  color: var(--primary-blue, #083c5a);
  border-top: 1.5px solid #cbd5e1;
  padding-top: 0.55rem;
  margin-top: 0.35rem;
}

/* Responsividad */
@media (max-width: 1024px) {
  .results-grid-structure {
    grid-template-columns: 1fr;
  }

  .two-columns-panels {
    grid-template-columns: 1fr;
  }

  .steps-cards-row {
    grid-template-columns: 1fr;
  }

  .provider-card-inner-grid {
    grid-template-columns: 1fr;
    gap: 1.1rem;
  }
}

@media (max-width: 768px) {
  .smart-header-banner {
    flex-direction: column;
  }

  .how-it-works-card {
    max-width: 100%;
  }

  .location-picker-group {
    flex-direction: column;
  }

  .modal-catalog-grid {
    grid-template-columns: 1fr;
  }
}
</style>
