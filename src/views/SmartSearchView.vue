<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useGeoStore } from "../stores/geo";
import AddressPickerModal, { type AddressPickerResult } from "@/components/common/AddressPickerModal.vue";
import mochilaImg from "../assets/mochila.png";
import utensiliosImg from "../assets/utensilios.png";
import tabletaImg from "../assets/tableta.png";
import paletaImg from "../assets/paleta.png";

const router = useRouter();
const route = useRoute();
const geoStore = useGeoStore();

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

interface SelectedProductItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

const viewMode = computed<"config" | "results">(() => {
  return route.query.step === "results" ? "results" : "config";
});

const selectedProducts = ref<SelectedProductItem[]>([]);
const deliveryAddress = ref("Managua, Nicaragua");
const pricePreference = ref(70);
const distancePreference = computed(() => 100 - pricePreference.value);

const showProductModal = ref(false);
const showGpsModal = ref(false);
const showDetailModal = ref(false);
const selectedOptionDetail = ref<any>(null);
const productSearchFilter = ref("");

// Address picker state
const initialLat = ref<number | null>(null);
const initialLng = ref<number | null>(null);
const initialAddress = ref<string>("");

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
  router.push({
    name: "smart-search",
    query: { ...route.query, step: "results" },
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const goToConfigView = () => {
  router.push({
    name: "smart-search",
    query: { ...route.query, step: "config" },
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const openGpsModal = () => {
  initialAddress.value = deliveryAddress.value;
  showGpsModal.value = true;
};

const handleLocationConfirmed = (result: AddressPickerResult) => {
  deliveryAddress.value = result.address;
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

onMounted(async () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (!geoStore.isInitialized) {
    await geoStore.initialize().catch((err) => {
      console.error("Failed to initialize geo store:", err);
    });
  }
});
</script>

<template>
  <div class="flex flex-col gap-6 w-full max-w-full box-border">
    <!-- Header Banner -->
    <div class="flex flex-col md:flex-row justify-between items-start gap-6 mb-2">
      <div class="flex-1">
        <h1 class="font-serif text-3xl font-bold text-[#083c5a] flex items-center gap-3 mb-1.5">
          <i class="fa-solid fa-magnifying-glass-dollar text-[#ff6a00]"></i>
          Búsqueda inteligente
        </h1>
        <p class="text-slate-500 text-sm leading-relaxed max-w-2xl">
          Gestiona tu lista de productos y encontraremos para ti los mejores proveedores combinando precio, distancia y disponibilidad en tu ubicación.
        </p>
      </div>
      <div class="bg-teal-50 border border-teal-100 rounded-2xl p-4 flex items-center gap-3.5 max-w-sm shadow-sm">
        <div class="w-10 h-10 rounded-full bg-[#083c5a] text-white flex items-center justify-center text-lg shrink-0">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
        </div>
        <div class="text-xs">
          <strong class="text-[#083c5a] text-sm block mb-0.5">¿Cómo funciona?</strong>
          <p class="text-slate-600 leading-snug">Nuestro algoritmo compara precios, distancia y tiempos de entrega para recomendarte la mejor opción para tu pedido.</p>
        </div>
      </div>
    </div>

    <!-- View Mode: Config -->
    <div v-if="viewMode === 'config'" class="flex flex-col gap-7">
      <!-- Steps / Feature Overview -->
      <div class="bg-white border border-slate-200 rounded-2xl p-5 md:p-7 shadow-xs">
        <span class="text-xs font-bold text-[#083c5a] tracking-wider block mb-4">PASOS RECOMENDADOS</span>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div class="flex items-start gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 bg-orange-100 text-orange-600">
              <i class="fa-solid fa-box-open"></i>
            </div>
            <div class="text-xs">
              <strong class="text-[#083c5a] text-sm block mb-1">Agrega tu lista de productos</strong>
              <p class="text-slate-500 leading-normal">Busca y agrega los productos que necesitas y sus cantidades.</p>
            </div>
          </div>
          <div class="flex items-start gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 bg-teal-100 text-teal-700">
              <i class="fa-solid fa-location-dot"></i>
            </div>
            <div class="text-xs">
              <strong class="text-[#083c5a] text-sm block mb-1">Selecciona tu ubicación</strong>
              <p class="text-slate-500 leading-normal">Usaremos tu ubicación para calcular distancias y tiempos de entrega.</p>
            </div>
          </div>
          <div class="flex items-start gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 bg-orange-100 text-orange-700">
              <i class="fa-solid fa-ranking-star"></i>
            </div>
            <div class="text-xs">
              <strong class="text-[#083c5a] text-sm block mb-1">Recibe las mejores opciones</strong>
              <p class="text-slate-500 leading-normal">Te mostraremos los proveedores con la mejor combinación de precio y distancia.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Config Panels -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Panel Products -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 md:p-7 flex flex-col shadow-xs">
          <h3 class="font-serif text-lg font-bold text-[#083c5a] flex items-center gap-2.5 mb-1.5">
            <i class="fa-solid fa-list-check text-teal-600"></i> Agrega los productos que necesitas
          </h3>
          <p class="text-slate-500 text-sm mb-4">Selecciona los artículos que deseas cotizar en los comercios.</p>
          <div v-if="selectedProducts.length === 0" class="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center text-center mb-5">
            <div class="w-12 h-12 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center text-2xl mb-3">
              <i class="fa-regular fa-clipboard"></i>
            </div>
            <h4 class="text-base font-bold text-[#083c5a] mb-1">Tu lista de productos está vacía</h4>
            <p class="text-slate-500 text-sm leading-normal max-w-xs mb-5">Busca o agrega los productos que necesitas para que podamos encontrar los mejores proveedores para ti.</p>
            <button
              type="button"
              class="bg-[#189c94] hover:bg-teal-700 text-white font-bold text-sm px-6 py-2.5 rounded-full transition-all duration-200 shadow-sm hover:-translate-y-0.5 cursor-pointer"
              @click="showProductModal = true"
            >
              Buscar y agregar productos
            </button>
          </div>
          <div v-else class="flex flex-col gap-3 mb-5">
            <div
              v-for="(prod, idx) in selectedProducts"
              :key="idx"
              class="flex items-center gap-3 bg-slate-50 p-2.5 px-3 rounded-xl border border-slate-200"
            >
              <img :src="prod.image" :alt="prod.name" class="w-10 h-10 object-contain" />
              <div class="flex-1 flex flex-col">
                <strong class="text-sm font-semibold text-[#083c5a]">{{ prod.name }}</strong>
                <span class="text-xs text-slate-500">{{ prod.quantity }} und • C$ {{ prod.price }}</span>
              </div>
              <button
                type="button"
                class="text-slate-400 hover:text-red-500 text-sm p-1 transition-colors cursor-pointer"
                title="Eliminar producto"
                @click="removeProduct(idx)"
              >
                ✕
              </button>
            </div>
            <button
              type="button"
              class="border border-[#189c94] text-[#189c94] hover:bg-teal-50 py-2 rounded-full font-semibold text-sm transition-colors cursor-pointer"
              @click="showProductModal = true"
            >
              + Agregar otro producto
            </button>
          </div>
          <div class="mt-auto flex items-center gap-2 text-xs text-slate-500 bg-slate-100 p-3 rounded-xl">
            <i class="fa-solid fa-circle-info text-teal-600 shrink-0"></i>
            <span><strong>Consejo:</strong> Puedes agregar varios productos y cantidades para obtener mejores resultados.</span>
          </div>
        </div>

        <!-- Panel Location & Preferences -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 md:p-7 flex flex-col shadow-xs">
          <h3 class="font-serif text-lg font-bold text-[#083c5a] flex items-center gap-2.5 mb-1.5">
            <i class="fa-solid fa-location-dot text-[#ff6a00]"></i> Ubicación de entrega
          </h3>
          <p class="text-slate-500 text-sm mb-4">Esta ubicación se usará para calcular distancias y tiempos de entrega.</p>
          <div class="flex flex-col sm:flex-row gap-2.5 mb-6">
            <div class="flex-1 flex items-center border border-slate-300 rounded-xl px-3.5 py-2 bg-white gap-2 focus-within:border-teal-500">
              <i class="fa-solid fa-location-dot text-slate-400 text-sm"></i>
              <input
                v-model="deliveryAddress"
                type="text"
                placeholder="Ingresa tu ubicación de entrega"
                class="w-full border-none outline-none text-sm text-slate-800 bg-transparent"
              />
              <button
                v-if="deliveryAddress"
                type="button"
                class="text-slate-400 hover:text-slate-600 text-xs font-bold"
                @click="deliveryAddress = ''"
              >
                ✕
              </button>
            </div>
            <button
              type="button"
              class="border border-slate-300 hover:border-teal-600 bg-white text-[#083c5a] hover:text-teal-600 px-4 py-2 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              @click="openGpsModal"
            >
              <i class="fa-solid fa-location-arrow"></i> Usar mi ubicación
            </button>
          </div>
          <div class="flex flex-col gap-3 border-t border-slate-100 pt-4">
            <div class="flex items-center gap-1.5">
              <label class="font-bold text-sm text-[#083c5a]">Preferencias de búsqueda</label>
              <i class="fa-regular fa-circle-question text-slate-400 text-xs"></i>
            </div>
            <p class="text-slate-500 text-xs mb-1">Ajusta lo que es más importante para ti en la búsqueda.</p>
            <div class="flex flex-col gap-1.5">
              <div class="flex justify-between text-xs text-slate-700 font-semibold">
                <span>Priorizar Precio</span>
                <strong>{{ pricePreference }}%</strong>
              </div>
              <input
                v-model.number="pricePreference"
                type="range"
                min="0"
                max="100"
                class="w-full h-1.5 rounded-lg bg-slate-200 outline-none accent-[#189c94] cursor-pointer"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <div class="flex justify-between text-xs text-slate-700 font-semibold">
                <span>Priorizar Distancia</span>
                <strong>{{ distancePreference }}%</strong>
              </div>
              <input
                :value="distancePreference"
                type="range"
                min="0"
                max="100"
                class="w-full h-1.5 rounded-lg bg-slate-200 outline-none accent-[#ff6a00] cursor-not-allowed opacity-80"
                disabled
              />
            </div>
            <span class="text-xs text-slate-400 mt-1">Puedes ajustar estos parámetros para optimizar los resultados.</span>
          </div>
        </div>
      </div>

      <!-- Action Button Zone -->
      <div class="flex flex-col items-center gap-2.5 mt-2">
        <button
          type="button"
          class="bg-gradient-to-b from-[#ff7a18] to-[#ff5500] hover:shadow-lg hover:shadow-orange-500/30 text-white font-bold text-lg px-12 py-3.5 rounded-full inline-flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
          @click="executeSearch"
        >
          <i class="fa-solid fa-magnifying-glass-dollar"></i> Búsqueda Inteligente
        </button>
        <span class="text-xs font-semibold text-teal-700 flex items-center gap-1.5">
          <i class="fa-regular fa-circle-check"></i> Es rápido, seguro y sin compromisos.
        </span>
      </div>
    </div>

    <!-- View Mode: Results -->
    <div v-else class="flex flex-col">
      <div class="grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-6 items-start">
        <!-- Sidebar -->
        <aside class="flex flex-col gap-5">
          <!-- Products Summary -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col shadow-xs">
            <div class="flex items-start gap-3 mb-3.5">
              <i class="fa-regular fa-clipboard text-xl text-slate-500 mt-0.5"></i>
              <div>
                <h4 class="text-base font-bold text-[#083c5a] mb-0.5">Lista de productos</h4>
                <p class="text-xs text-slate-500">Agrega los productos que necesitas</p>
              </div>
            </div>
            <div class="flex flex-col gap-3 mb-3.5">
              <div
                v-for="(prod, idx) in selectedProducts"
                :key="prod.id"
                class="flex items-center gap-2.5 bg-white border border-slate-300 rounded-xl p-2 px-2.5 relative"
              >
                <img :src="prod.image" :alt="prod.name" class="w-11 h-11 object-contain" />
                <div class="flex-1 flex flex-col">
                  <h5 class="text-xs font-bold text-[#083c5a] mb-0.5 line-clamp-1">{{ prod.name }}</h5>
                  <span class="text-xs text-slate-500">Cantidad: {{ prod.quantity }} und</span>
                  <span class="text-xs font-semibold text-slate-800">C$ {{ prod.price }}</span>
                </div>
                <button
                  type="button"
                  class="text-slate-400 hover:text-red-500 text-sm p-1 transition-colors cursor-pointer"
                  title="Eliminar producto"
                  @click="removeProduct(idx)"
                >
                  ✕
                </button>
              </div>
            </div>
            <button
              type="button"
              class="border border-[#189c94] text-[#189c94] hover:bg-[#189c94] hover:text-white py-2 px-3 rounded-full font-semibold text-xs transition-colors cursor-pointer text-center"
              @click="showProductModal = true"
            >
              + Agregar otro producto
            </button>
          </div>

          <!-- Location Summary -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col shadow-xs">
            <h4 class="text-base font-bold text-[#083c5a] mb-0.5">Ubicación de entrega</h4>
            <p class="text-xs text-slate-500">Selecciona tu ubicación para calcular el envío</p>
            <div class="flex items-center gap-2 border border-teal-500 bg-teal-50/50 rounded-xl p-2.5 my-3 text-xs text-[#083c5a] font-semibold">
              <i class="fa-solid fa-location-dot text-teal-600"></i>
              <span class="truncate">{{ deliveryAddress }}</span>
            </div>
            <button
              type="button"
              class="border border-teal-500 hover:bg-teal-50 text-teal-700 py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              @click="openGpsModal"
            >
              Usar mi ubicación <i class="fa-solid fa-crosshairs"></i>
            </button>
          </div>

          <!-- Preferences Summary -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col shadow-xs">
            <h4 class="text-base font-bold text-[#083c5a] mb-0.5">Preferencias</h4>
            <p class="text-xs text-slate-500">¿Qué es más importante para ti?</p>
            <div class="flex flex-col gap-1.5 mt-3">
              <div class="text-xs font-semibold text-[#083c5a] flex items-center gap-1.5">
                <i class="fa-solid fa-circle-dollar-to-slot text-teal-600"></i> Precios
              </div>
              <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div class="h-full bg-teal-600 transition-all duration-300" :style="{ width: `${pricePreference}%` }"></div>
              </div>
            </div>
            <div class="flex flex-col gap-1.5 mt-2.5">
              <div class="text-xs font-semibold text-[#083c5a] flex items-center gap-1.5">
                <i class="fa-solid fa-location-arrow text-[#ff6a00]"></i> Distancia
              </div>
              <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div class="h-full bg-[#ff6a00] transition-all duration-300" :style="{ width: `${distancePreference}%` }"></div>
              </div>
            </div>
            <button
              type="button"
              class="bg-gradient-to-b from-[#ff7a18] to-[#ff5500] hover:shadow-md hover:shadow-orange-500/20 text-white font-bold text-sm py-2.5 px-4 rounded-full flex items-center justify-center gap-2 mt-5 cursor-pointer"
              @click="executeSearch"
            >
              <i class="fa-solid fa-magnifying-glass-dollar"></i> Recalcular
            </button>
            <button
              type="button"
              class="text-slate-500 hover:text-[#083c5a] text-xs font-semibold mt-3 flex items-center justify-center gap-1.5 cursor-pointer"
              @click="goToConfigView"
            >
              <i class="fa-solid fa-arrow-left"></i> Modificar búsqueda
            </button>
          </div>
        </aside>

        <!-- Main Results Area -->
        <main class="flex flex-col gap-5">
          <!-- Top Results Header -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 class="font-serif text-2xl text-[#083c5a] font-bold flex items-center gap-2 mb-1">
                <i class="fa-solid fa-magnifying-glass-dollar text-[#ff6a00]"></i>
                Opciones recomendadas
              </h2>
              <p class="text-slate-500 text-sm">Hemos encontrado las mejores alternativas para tu pedido.</p>
            </div>
            <div class="bg-teal-50 border border-teal-200 rounded-2xl p-2.5 px-4 flex items-center gap-3">
              <div class="flex flex-col">
                <span class="text-xs text-teal-700">Ahorro estimado:</span>
                <strong class="text-lg text-[#083c5a] font-bold leading-tight">C$ 3,450</strong>
              </div>
              <i class="fa-solid fa-piggy-bank text-2xl text-teal-600"></i>
            </div>
          </div>

          <!-- Primary Recommendation Card -->
          <div class="bg-white border-2 border-teal-500 rounded-2xl relative overflow-hidden pt-7 shadow-xs">
            <div class="absolute top-0 left-5 bg-teal-600 text-white text-xs font-bold py-1 px-4 rounded-b-xl shadow-xs">
              La mejor opción para ti
            </div>
            <div class="p-6 md:p-7 grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
              <div class="flex flex-col">
                <span class="text-xs text-slate-500 mb-1">Proveedor recomendado</span>
                <div class="flex items-center gap-2.5 mb-1.5">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {{ primaryOption.initial }}
                  </div>
                  <div class="flex items-center gap-1.5">
                    <strong class="text-sm text-[#083c5a]">{{ primaryOption.providerName }}</strong>
                    <i class="fa-solid fa-circle-check text-sky-500 text-sm"></i>
                  </div>
                </div>
                <div class="flex items-center gap-1.5 text-sm font-bold text-[#083c5a] mb-1">
                  <i class="fa-solid fa-star text-[#ff6a00]"></i>
                  <span>{{ primaryOption.rating }}</span>
                </div>
                <p class="text-xs text-slate-500">{{ primaryOption.location }}</p>
              </div>
              <div class="flex flex-col">
                <span class="text-xs text-slate-500 mb-0.5">Tiempo de entrega estimado</span>
                <div class="flex items-center gap-1.5 text-sm font-semibold text-[#083c5a]">
                  <i class="fa-solid fa-truck-fast text-teal-600"></i>
                  <strong>{{ primaryOption.deliveryTime }}</strong>
                </div>
                <span class="text-xs text-slate-500 mb-3">{{ primaryOption.deliveryCarrier }}</span>
                <span class="text-xs text-slate-500 mb-0.5">Distancia</span>
                <div class="flex items-center gap-1.5 text-sm font-semibold text-[#083c5a]">
                  <i class="fa-solid fa-location-dot text-teal-600"></i>
                  <strong>{{ primaryOption.distance }}</strong>
                </div>
                <span class="text-xs text-slate-500">Desde tu ubicación</span>
              </div>
              <div class="flex flex-col">
                <span class="text-xs text-slate-500 mb-0.5">Total por tu pedido</span>
                <div class="font-serif text-2xl font-bold text-[#ff6a00] leading-tight">
                  C$ 28,150
                </div>
                <span class="text-xs text-slate-400 line-through mb-1">C$ 31,600</span>
                <span class="inline-flex text-xs text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md w-fit mb-3 font-medium">
                  Ahorras: <strong class="ml-1">C$ 3,450 (10.9%)</strong>
                </span>
                <button
                  type="button"
                  class="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm py-2.5 px-4 rounded-xl transition-colors cursor-pointer shadow-sm text-center"
                  @click="openOptionDetails(primaryOption)"
                >
                  Ver detalle y continuar
                </button>
              </div>
            </div>
          </div>

          <!-- Alternative Recommendation Card -->
          <div class="bg-white border border-slate-200 rounded-2xl relative overflow-hidden pt-7 shadow-xs">
            <div class="absolute top-0 left-5 bg-rose-100 text-rose-700 text-xs font-bold py-1 px-4 rounded-b-xl">
              Opción alternativa
            </div>
            <div class="p-6 md:p-7 grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
              <div class="flex flex-col">
                <span class="text-xs text-slate-500 mb-1">Proveedor alternativo</span>
                <div class="flex items-center gap-2.5 mb-1.5">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {{ alternativeOption.initial }}
                  </div>
                  <div class="flex items-center gap-1.5">
                    <strong class="text-sm text-[#083c5a]">{{ alternativeOption.providerName }}</strong>
                    <i class="fa-solid fa-circle-check text-sky-500 text-sm"></i>
                  </div>
                </div>
                <div class="flex items-center gap-1.5 text-sm font-bold text-[#083c5a] mb-1">
                  <i class="fa-solid fa-star text-[#ff6a00]"></i>
                  <span>{{ alternativeOption.rating }}</span>
                </div>
                <p class="text-xs text-slate-500">{{ alternativeOption.location }}</p>
              </div>
              <div class="flex flex-col">
                <span class="text-xs text-slate-500 mb-0.5">Tiempo de entrega estimado</span>
                <div class="flex items-center gap-1.5 text-sm font-semibold text-[#083c5a]">
                  <i class="fa-solid fa-truck-fast text-teal-600"></i>
                  <strong>{{ alternativeOption.deliveryTime }}</strong>
                </div>
                <span class="text-xs text-slate-500 mb-3">{{ alternativeOption.deliveryCarrier }}</span>
                <span class="text-xs text-slate-500 mb-0.5">Distancia</span>
                <div class="flex items-center gap-1.5 text-sm font-semibold text-[#083c5a]">
                  <i class="fa-solid fa-location-dot text-teal-600"></i>
                  <strong>{{ alternativeOption.distance }}</strong>
                </div>
                <span class="text-xs text-slate-500">Desde tu ubicación</span>
              </div>
              <div class="flex flex-col">
                <span class="text-xs text-slate-500 mb-0.5">Total por tu pedido</span>
                <div class="font-serif text-2xl font-bold text-orange-700 leading-tight">
                  C$ 31,500
                </div>
                <span class="text-xs text-slate-400 line-through mb-1">C$ 31,600</span>
                <span class="inline-flex text-xs text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md w-fit mb-3 font-medium">
                  Ahorras: <strong class="ml-1">C$ 100 (0.3%)</strong>
                </span>
                <button
                  type="button"
                  class="bg-slate-600 hover:bg-slate-700 text-white font-bold text-sm py-2.5 px-4 rounded-xl transition-colors cursor-pointer shadow-sm text-center"
                  @click="openOptionDetails(alternativeOption)"
                >
                  Ver detalle y continuar
                </button>
              </div>
            </div>
          </div>

          <!-- Comparison Table Matrix -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs overflow-x-auto">
            <table class="w-full text-left text-sm border-collapse">
              <thead>
                <tr class="border-b border-slate-200">
                  <th class="py-3 px-4 font-bold text-[#083c5a]">Detalle</th>
                  <th class="py-3 px-4 font-bold text-[#083c5a]">
                    NicaTech S.A
                    <span class="inline-block text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded ml-1.5">MEJOR OPCIÓN</span>
                  </th>
                  <th class="py-3 px-4 font-bold text-[#083c5a]">
                    Managua Tech S.A
                    <span class="inline-block text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded ml-1.5">Opción alternativa</span>
                  </th>
                  <th class="py-3 px-4 font-bold text-[#083c5a]">Diferencia</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr>
                  <td class="py-3 px-4 font-medium text-slate-600">Subtotal productos</td>
                  <td class="py-3 px-4">C$ 25,350</td>
                  <td class="py-3 px-4">C$ 28,800</td>
                  <td class="py-3 px-4 text-emerald-600 font-semibold">C$ 3,450 ↓</td>
                </tr>
                <tr>
                  <td class="py-3 px-4 font-medium text-slate-600">Costo de envío</td>
                  <td class="py-3 px-4">C$ 2,800</td>
                  <td class="py-3 px-4">C$ 1,200</td>
                  <td class="py-3 px-4 text-red-600 font-semibold">-C$ 1,600 ↑</td>
                </tr>
                <tr>
                  <td class="py-3 px-4 font-medium text-slate-600">Distancia</td>
                  <td class="py-3 px-4">127 km</td>
                  <td class="py-3 px-4">12 km</td>
                  <td class="py-3 px-4 text-red-600 font-semibold">115 km ↑</td>
                </tr>
                <tr>
                  <td class="py-3 px-4 font-medium text-slate-600">Tiempo de entrega</td>
                  <td class="py-3 px-4">2-3 días</td>
                  <td class="py-3 px-4">1 día</td>
                  <td class="py-3 px-4 text-red-600 font-semibold">+1-2 días ↑</td>
                </tr>
                <tr>
                  <td class="py-3 px-4 font-medium text-slate-600">Calificación</td>
                  <td class="py-3 px-4">4.0 <i class="fa-regular fa-star text-amber-500"></i></td>
                  <td class="py-3 px-4">4.5 <i class="fa-regular fa-star text-amber-500"></i></td>
                  <td class="py-3 px-4 text-red-600 font-semibold">-0.5 ↓</td>
                </tr>
                <tr class="bg-slate-50 font-bold border-t-2 border-slate-200">
                  <td class="py-3 px-4 text-[#083c5a]">Total por tu pedido</td>
                  <td class="py-3 px-4 text-[#083c5a]">C$ 28,150</td>
                  <td class="py-3 px-4 text-[#083c5a]">C$ 31,500</td>
                  <td class="py-3 px-4 text-emerald-600 font-bold">C$ 3,450 ↓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>

    <!-- Product Catalog Modal -->
    <div
      v-if="showProductModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showProductModal = false"
    >
      <div class="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div class="flex justify-between items-center p-5 border-b border-slate-200">
          <h3 class="text-base font-bold text-[#083c5a] flex items-center gap-2">
            <i class="fa-solid fa-bag-shopping text-teal-600"></i> Agregar Productos a Búsqueda Inteligente
          </h3>
          <button type="button" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer" @click="showProductModal = false">✕</button>
        </div>
        <div class="flex items-center px-6 py-3 bg-slate-50 border-b border-slate-200 gap-2">
          <i class="fa-solid fa-magnifying-glass text-slate-400 text-sm"></i>
          <input
            v-model="productSearchFilter"
            type="text"
            placeholder="Buscar por nombre, categoría o proveedor..."
            class="w-full bg-transparent border-none outline-none text-sm text-slate-800"
          />
        </div>
        <div class="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-[60vh]">
          <div
            v-for="item in filteredCatalog"
            :key="item.id"
            class="border border-slate-200 rounded-xl p-3.5 flex flex-col bg-white hover:border-teal-500 transition-colors"
          >
            <img :src="item.image" :alt="item.name" class="w-full h-28 object-contain mb-2" />
            <span class="text-[11px] text-slate-500">{{ item.category }}</span>
            <h5 class="text-sm font-bold text-[#083c5a] my-0.5 line-clamp-1">{{ item.name }}</h5>
            <span class="text-xs text-slate-400 mb-1">Por: {{ item.provider }}</span>
            <span class="text-sm font-bold text-[#ff6a00] mb-2.5">C$ {{ item.price }}</span>
            <button
              type="button"
              class="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2 px-3 rounded-lg transition-colors cursor-pointer mt-auto flex items-center justify-center gap-1.5"
              @click="addProductFromCatalog(item)"
            >
              <i class="fa-solid fa-plus"></i> Agregar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- GPS Location Modal (Reusing AddressPickerModal) -->
    <AddressPickerModal
      v-model="showGpsModal"
      :initial-lat="initialLat"
      :initial-lng="initialLng"
      :initial-address="initialAddress"
      @confirm="handleLocationConfirmed"
    />

    <!-- Order Detail Modal -->
    <div
      v-if="showDetailModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showDetailModal = false"
    >
      <div class="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div class="flex justify-between items-center p-5 border-b border-slate-200">
          <h3 class="text-base font-bold text-[#083c5a] flex items-center gap-2">
            <i class="fa-solid fa-circle-check text-teal-600"></i> Pedido con {{ selectedOptionDetail?.providerName }}
          </h3>
          <button type="button" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer" @click="showDetailModal = false">✕</button>
        </div>
        <div class="p-6 flex flex-col gap-4 overflow-y-auto">
          <div class="flex gap-3 bg-teal-50 border border-teal-200 p-3.5 rounded-xl">
            <i class="fa-solid fa-circle-check text-teal-600 text-2xl shrink-0 mt-0.5"></i>
            <div class="text-xs text-slate-700 leading-snug">
              <strong class="text-[#083c5a] text-sm block mb-0.5">¡Mejor combinación de proveedor confirmada!</strong>
              Tu pedido será preparado por {{ selectedOptionDetail?.providerName }} y despachado hacia {{ deliveryAddress }}.
            </div>
          </div>
          <h4 class="text-sm font-bold text-[#083c5a]">Resumen de Productos ({{ selectedProducts.length }})</h4>
          <div class="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
            <div
              v-for="item in selectedProducts"
              :key="item.id"
              class="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200"
            >
              <img :src="item.image" :alt="item.name" class="w-9 h-9 object-contain" />
              <div class="flex-1 flex flex-col">
                <strong class="text-xs font-semibold text-[#083c5a]">{{ item.name }}</strong>
                <span class="text-[11px] text-slate-500">{{ item.quantity }} unidades x C$ {{ item.price }}</span>
              </div>
              <span class="text-xs font-bold text-[#083c5a]">
                C$ {{ (item.price * item.quantity).toLocaleString() }}
              </span>
            </div>
          </div>
          <hr class="border-slate-200 my-1" />
          <div class="flex flex-col gap-1.5 text-xs text-slate-600">
            <div class="flex justify-between">
              <span>Subtotal:</span>
              <strong class="text-slate-800">C$ {{ selectedOptionDetail?.subtotal?.toLocaleString() }}</strong>
            </div>
            <div class="flex justify-between">
              <span>Costo de envío:</span>
              <strong class="text-slate-800">C$ {{ selectedOptionDetail?.shippingCost?.toLocaleString() }}</strong>
            </div>
            <div class="flex justify-between text-sm text-[#083c5a] font-bold border-t border-dashed border-slate-300 pt-2 mt-1">
              <span>Total a pagar:</span>
              <span>C$ {{ selectedOptionDetail?.total?.toLocaleString() }}</span>
            </div>
          </div>
        </div>
        <div class="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50/50">
          <button
            type="button"
            class="border border-slate-300 hover:bg-slate-100 text-slate-600 px-4 py-2 rounded-lg font-semibold text-xs cursor-pointer"
            @click="showDetailModal = false"
          >
            Cerrar
          </button>
          <button
            type="button"
            class="bg-[#ff6a00] hover:bg-orange-600 text-white font-bold text-xs px-5 py-2 rounded-lg cursor-pointer shadow-sm"
            @click="confirmAndOrder"
          >
            Confirmar y Realizar Pedido
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
