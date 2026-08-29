<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import logoImg from "../assets/logo.png";
import AppFooter from "../components/common/AppFooter.vue";

// Asset images
import mochilaImg from "../assets/mochila.png";
import utensiliosImg from "../assets/utensilios.png";
import tabletaImg from "../assets/tableta.png";
import paletaImg from "../assets/paleta.png";

interface ProductDetailData {
  id: string | number;
  title: string;
  category: string;
  price: number;
  minOrder: number;
  rating: number;
  providerRating: number;
  provider: {
    name: string;
    initial: string;
    location: string;
    verified: boolean;
  };
  image: string;
  rank: number;
  brand: string;
  description: string;
  colors: string[];
  shippingMethods: Array<{
    id: string;
    name: string;
    icon: string;
    cost: number;
  }>;
  prepTime: string;
}

const route = useRoute();
const router = useRouter();

const isMenuOpen = ref(false);
const showAddedToast = ref(false);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = () => {
  isMenuOpen.value = false;
};

// Fallback model when an item is completely empty or missing
const emptyProduct: ProductDetailData = {
  id: "vacio",
  title: "VACÍO",
  category: "VACÍO",
  price: 0,
  minOrder: 1,
  rating: 0,
  providerRating: 0,
  provider: {
    name: "VACÍO",
    initial: "-",
    location: "VACÍO",
    verified: false,
  },
  image: "",
  rank: 0,
  brand: "VACÍO",
  description: "VACÍO",
  colors: [],
  shippingMethods: [
    { id: "vacio", name: "VACÍO", icon: "fa-solid fa-truck", cost: 0 },
  ],
  prepTime: "VACÍO",
};

// Complete and accurate catalog dictionary for all products across the platform
const catalog: Record<string, ProductDetailData> = {
  "laptop-adventure": {
    id: "1",
    title: "Laptop Adventure",
    category: "Artículos Tecnológicos",
    price: 2350,
    minOrder: 1,
    rating: 4.5,
    providerRating: 4.0,
    provider: {
      name: "NicaTech S. A",
      initial: "N",
      location: "Managua, Managua",
      verified: true,
    },
    image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&q=80",
    rank: 1,
    brand: "Lenovo",
    description:
      "Laptop de alto rendimiento ideal para negocios, ligera y potente, con excelente autonomía de bateria.",
    colors: ["#189c94", "#1e293b", "#5a1818"],
    shippingMethods: [
      { id: "bus", name: "Bus Interlocal", icon: "fa-solid fa-bus", cost: 150 },
      { id: "courier", name: "Empresas de paquetería", icon: "fa-solid fa-truck", cost: 200 },
    ],
    prepTime: "12 horas",
  },
  "1": {
    id: "1",
    title: "Laptop Adventure",
    category: "Artículos Tecnológicos",
    price: 2350,
    minOrder: 1,
    rating: 4.5,
    providerRating: 4.0,
    provider: {
      name: "NicaTech S. A",
      initial: "N",
      location: "Managua, Managua",
      verified: true,
    },
    image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&q=80",
    rank: 1,
    brand: "Lenovo",
    description:
      "Laptop de alto rendimiento ideal para negocios, ligera y potente, con excelente autonomía de bateria.",
    colors: ["#189c94", "#1e293b", "#5a1818"],
    shippingMethods: [
      { id: "bus", name: "Bus Interlocal", icon: "fa-solid fa-bus", cost: 150 },
      { id: "courier", name: "Empresas de paquetería", icon: "fa-solid fa-truck", cost: 200 },
    ],
    prepTime: "12 horas",
  },
  "samsung-s26-ultra": {
    id: "2",
    title: "Samsung S26 Ultra",
    category: "Artículos Tecnológicos",
    price: 23350,
    minOrder: 1,
    rating: 4.5,
    providerRating: 4.0,
    provider: {
      name: "Mangua Labs S.A.",
      initial: "M",
      location: "Managua, Managua",
      verified: true,
    },
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80",
    rank: 2,
    brand: "Samsung",
    description:
      "Smartphone de gama ultra alta con cámara de 200MP, pantalla Dynamic AMOLED 2X y procesador Snapdragon de última generación.",
    colors: ["#0f172a", "#64748b", "#3b82f6"],
    shippingMethods: [
      { id: "bus", name: "Bus Interlocal", icon: "fa-solid fa-bus", cost: 150 },
      { id: "courier", name: "Empresas de paquetería", icon: "fa-solid fa-truck", cost: 220 },
    ],
    prepTime: "12 horas",
  },
  "2": {
    id: "2",
    title: "Samsung S26 Ultra",
    category: "Artículos Tecnológicos",
    price: 23350,
    minOrder: 1,
    rating: 4.5,
    providerRating: 4.0,
    provider: {
      name: "Mangua Labs S.A.",
      initial: "M",
      location: "Managua, Managua",
      verified: true,
    },
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80",
    rank: 2,
    brand: "Samsung",
    description:
      "Smartphone de gama ultra alta con cámara de 200MP, pantalla Dynamic AMOLED 2X y procesador Snapdragon de última generación.",
    colors: ["#0f172a", "#64748b", "#3b82f6"],
    shippingMethods: [
      { id: "bus", name: "Bus Interlocal", icon: "fa-solid fa-bus", cost: 150 },
      { id: "courier", name: "Empresas de paquetería", icon: "fa-solid fa-truck", cost: 220 },
    ],
    prepTime: "12 horas",
  },
  "tablet-para-ninos": {
    id: "3",
    title: "Tablet para niños",
    category: "Artículos Tecnológicos",
    price: 950,
    minOrder: 1,
    rating: 4.5,
    providerRating: 4.0,
    provider: {
      name: "Mangua Labs S.A.",
      initial: "M",
      location: "Managua, Managua",
      verified: true,
    },
    image: tabletaImg,
    rank: 3,
    brand: "KidsTech",
    description:
      "Tablet educativa con funda de silicona a prueba de caídas, pantalla HD de 7 pulgadas y control parental integrado.",
    colors: ["#0284c7", "#f43f5e", "#10b981"],
    shippingMethods: [
      { id: "bus", name: "Bus Interlocal", icon: "fa-solid fa-bus", cost: 150 },
      { id: "courier", name: "Empresas de paquetería", icon: "fa-solid fa-truck", cost: 200 },
    ],
    prepTime: "12 horas",
  },
  "3": {
    id: "3",
    title: "Tablet para niños",
    category: "Artículos Tecnológicos",
    price: 950,
    minOrder: 1,
    rating: 4.5,
    providerRating: 4.0,
    provider: {
      name: "Mangua Labs S.A.",
      initial: "M",
      location: "Managua, Managua",
      verified: true,
    },
    image: tabletaImg,
    rank: 3,
    brand: "KidsTech",
    description:
      "Tablet educativa con funda de silicona a prueba de caídas, pantalla HD de 7 pulgadas y control parental integrado.",
    colors: ["#0284c7", "#f43f5e", "#10b981"],
    shippingMethods: [
      { id: "bus", name: "Bus Interlocal", icon: "fa-solid fa-bus", cost: 150 },
      { id: "courier", name: "Empresas de paquetería", icon: "fa-solid fa-truck", cost: 200 },
    ],
    prepTime: "12 horas",
  },
  "smart-watch-apple": {
    id: "4",
    title: "Smart Watch Apple",
    category: "Artículos Tecnológicos",
    price: 350,
    minOrder: 1,
    rating: 4.5,
    providerRating: 4.2,
    provider: {
      name: "Apante Software",
      initial: "A",
      location: "San Ramón, Matagalpa",
      verified: true,
    },
    image: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=800&q=80",
    rank: 4,
    brand: "Apple",
    description:
      "Reloj inteligente con monitor cardíaco continuo, registro de actividad física diaria y notificaciones sincronizadas.",
    colors: ["#000000", "#cbd5e1", "#189c94"],
    shippingMethods: [
      { id: "bus", name: "Bus Interlocal", icon: "fa-solid fa-bus", cost: 120 },
      { id: "courier", name: "Empresas de paquetería", icon: "fa-solid fa-truck", cost: 150 },
    ],
    prepTime: "12 horas",
  },
  "4": {
    id: "4",
    title: "Smart Watch Apple",
    category: "Artículos Tecnológicos",
    price: 350,
    minOrder: 1,
    rating: 4.5,
    providerRating: 4.2,
    provider: {
      name: "Apante Software",
      initial: "A",
      location: "San Ramón, Matagalpa",
      verified: true,
    },
    image: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=800&q=80",
    rank: 4,
    brand: "Apple",
    description:
      "Reloj inteligente con monitor cardíaco continuo, registro de actividad física diaria y notificaciones sincronizadas.",
    colors: ["#000000", "#cbd5e1", "#189c94"],
    shippingMethods: [
      { id: "bus", name: "Bus Interlocal", icon: "fa-solid fa-bus", cost: 120 },
      { id: "courier", name: "Empresas de paquetería", icon: "fa-solid fa-truck", cost: 150 },
    ],
    prepTime: "12 horas",
  },
  "consola-de-video": {
    id: "5",
    title: "Consola de video",
    category: "Artículos Tecnológicos",
    price: 850,
    minOrder: 1,
    rating: 4.5,
    providerRating: 4.2,
    provider: {
      name: "Apante Software",
      initial: "A",
      location: "San Ramón, Matagalpa",
      verified: true,
    },
    image: "https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=800&q=80",
    rank: 1,
    brand: "RetroPlay",
    description:
      "Consola de videojuegos portátil con pantalla IPS de 3.5 pulgadas y catálogo de más de 10,000 juegos clásicos.",
    colors: ["#1e293b", "#dc2626", "#2563eb"],
    shippingMethods: [
      { id: "bus", name: "Bus Interlocal", icon: "fa-solid fa-bus", cost: 120 },
      { id: "courier", name: "Empresas de paquetería", icon: "fa-solid fa-truck", cost: 170 },
    ],
    prepTime: "12 horas",
  },
  "5": {
    id: "5",
    title: "Consola de video",
    category: "Artículos Tecnológicos",
    price: 850,
    minOrder: 1,
    rating: 4.5,
    providerRating: 4.2,
    provider: {
      name: "Apante Software",
      initial: "A",
      location: "San Ramón, Matagalpa",
      verified: true,
    },
    image: "https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=800&q=80",
    rank: 1,
    brand: "RetroPlay",
    description:
      "Consola de videojuegos portátil con pantalla IPS de 3.5 pulgadas y catálogo de más de 10,000 juegos clásicos.",
    colors: ["#1e293b", "#dc2626", "#2563eb"],
    shippingMethods: [
      { id: "bus", name: "Bus Interlocal", icon: "fa-solid fa-bus", cost: 120 },
      { id: "courier", name: "Empresas de paquetería", icon: "fa-solid fa-truck", cost: 170 },
    ],
    prepTime: "12 horas",
  },
  "set-de-camaras": {
    id: "6",
    title: "Set de cámaras",
    category: "Artículos Tecnológicos",
    price: 660,
    minOrder: 1,
    rating: 4.5,
    providerRating: 4.5,
    provider: {
      name: "NicaTech S.A.",
      initial: "N",
      location: "León, El viejo",
      verified: true,
    },
    image: "https://images.unsplash.com/photo-1557862921-37829c790f19?w=800&q=80",
    rank: 2,
    brand: "Hikvision",
    description:
      "Kit de 4 cámaras de seguridad Full HD 1080p con visión nocturna por infrarrojos y monitoreo remoto.",
    colors: ["#ffffff", "#0f172a"],
    shippingMethods: [
      { id: "bus", name: "Bus Interlocal", icon: "fa-solid fa-bus", cost: 150 },
      { id: "courier", name: "Empresas de paquetería", icon: "fa-solid fa-truck", cost: 200 },
    ],
    prepTime: "24 horas",
  },
  "6": {
    id: "6",
    title: "Set de cámaras",
    category: "Artículos Tecnológicos",
    price: 660,
    minOrder: 1,
    rating: 4.5,
    providerRating: 4.5,
    provider: {
      name: "NicaTech S.A.",
      initial: "N",
      location: "León, El viejo",
      verified: true,
    },
    image: "https://images.unsplash.com/photo-1557862921-37829c790f19?w=800&q=80",
    rank: 2,
    brand: "Hikvision",
    description:
      "Kit de 4 cámaras de seguridad Full HD 1080p con visión nocturna por infrarrojos y monitoreo remoto.",
    colors: ["#ffffff", "#0f172a"],
    shippingMethods: [
      { id: "bus", name: "Bus Interlocal", icon: "fa-solid fa-bus", cost: 150 },
      { id: "courier", name: "Empresas de paquetería", icon: "fa-solid fa-truck", cost: 200 },
    ],
    prepTime: "24 horas",
  },
  "usb-64gb-hp": {
    id: "7",
    title: "Usb 64Gb - HP",
    category: "Artículos Tecnológicos",
    price: 250,
    minOrder: 1,
    rating: 4.5,
    providerRating: 4.0,
    provider: {
      name: "Mangua Labs S.A.",
      initial: "M",
      location: "Managua, Managua",
      verified: true,
    },
    image: "https://images.unsplash.com/photo-1622535056705-4171a824b7a4?w=800&q=80",
    rank: 3,
    brand: "HP",
    description:
      "Memoria flash USB 3.1 metálica de 64GB de alta velocidad resistente al polvo y golpes.",
    colors: ["#94a3b8"],
    shippingMethods: [
      { id: "bus", name: "Bus Interlocal", icon: "fa-solid fa-bus", cost: 80 },
      { id: "courier", name: "Empresas de paquetería", icon: "fa-solid fa-truck", cost: 120 },
    ],
    prepTime: "6 horas",
  },
  "7": {
    id: "7",
    title: "Usb 64Gb - HP",
    category: "Artículos Tecnológicos",
    price: 250,
    minOrder: 1,
    rating: 4.5,
    providerRating: 4.0,
    provider: {
      name: "Mangua Labs S.A.",
      initial: "M",
      location: "Managua, Managua",
      verified: true,
    },
    image: "https://images.unsplash.com/photo-1622535056705-4171a824b7a4?w=800&q=80",
    rank: 3,
    brand: "HP",
    description:
      "Memoria flash USB 3.1 metálica de 64GB de alta velocidad resistente al polvo y golpes.",
    colors: ["#94a3b8"],
    shippingMethods: [
      { id: "bus", name: "Bus Interlocal", icon: "fa-solid fa-bus", cost: 80 },
      { id: "courier", name: "Empresas de paquetería", icon: "fa-solid fa-truck", cost: 120 },
    ],
    prepTime: "6 horas",
  },
  "cargador-samsung": {
    id: "8",
    title: "Cargador Samsung",
    category: "Artículos Tecnológicos",
    price: 150,
    minOrder: 1,
    rating: 4.5,
    providerRating: 4.5,
    provider: {
      name: "NicaTech S.A.",
      initial: "N",
      location: "León, El viejo",
      verified: true,
    },
    image: "https://images.unsplash.com/photo-1628149455678-16f37bc392f4?w=800&q=80",
    rank: 4,
    brand: "Samsung",
    description:
      "Cargador de pared USB-C con tecnología Super Fast Charging de 25W y protección térmica integrada.",
    colors: ["#ffffff", "#000000"],
    shippingMethods: [
      { id: "bus", name: "Bus Interlocal", icon: "fa-solid fa-bus", cost: 80 },
      { id: "courier", name: "Empresas de paquetería", icon: "fa-solid fa-truck", cost: 120 },
    ],
    prepTime: "6 horas",
  },
  "8": {
    id: "8",
    title: "Cargador Samsung",
    category: "Artículos Tecnológicos",
    price: 150,
    minOrder: 1,
    rating: 4.5,
    providerRating: 4.5,
    provider: {
      name: "NicaTech S.A.",
      initial: "N",
      location: "León, El viejo",
      verified: true,
    },
    image: "https://images.unsplash.com/photo-1628149455678-16f37bc392f4?w=800&q=80",
    rank: 4,
    brand: "Samsung",
    description:
      "Cargador de pared USB-C con tecnología Super Fast Charging de 25W y protección térmica integrada.",
    colors: ["#ffffff", "#000000"],
    shippingMethods: [
      { id: "bus", name: "Bus Interlocal", icon: "fa-solid fa-bus", cost: 80 },
      { id: "courier", name: "Empresas de paquetería", icon: "fa-solid fa-truck", cost: 120 },
    ],
    prepTime: "6 horas",
  },
  "mochila-adventure": {
    id: "mochila-adventure",
    title: "Mochila Adventure",
    category: "Bolsos & Maletas",
    price: 350,
    minOrder: 1,
    rating: 4.5,
    providerRating: 4.5,
    provider: {
      name: "Megaboutique S.A",
      initial: "M",
      location: "San Ramón, Matagalpa",
      verified: true,
    },
    image: mochilaImg,
    rank: 1,
    brand: "Adventure Gear",
    description: "Mochila ergonómica impermeable de alta capacidad con compartimentos reforzados para viaje o trabajo.",
    colors: ["#1e293b", "#189c94", "#7c2d12"],
    shippingMethods: [
      { id: "bus", name: "Bus Interlocal", icon: "fa-solid fa-bus", cost: 100 },
      { id: "courier", name: "Empresas de paquetería", icon: "fa-solid fa-truck", cost: 150 },
    ],
    prepTime: "24 horas",
  },
  "set-de-ollas": {
    id: "set-de-ollas",
    title: "Set de ollas 9 piezas",
    category: "Cocina",
    price: 350,
    minOrder: 1,
    rating: 4.5,
    providerRating: 4.5,
    provider: {
      name: "Megaboutique S.A",
      initial: "M",
      location: "San Ramón, Matagalpa",
      verified: true,
    },
    image: utensiliosImg,
    rank: 2,
    brand: "Chef Master",
    description: "Juego completo de ollas antiadherentes de aluminio forjado de 9 piezas con tapas de vidrio templado.",
    colors: ["#334155", "#991b1b", "#0f766e"],
    shippingMethods: [
      { id: "bus", name: "Bus Interlocal", icon: "fa-solid fa-bus", cost: 120 },
      { id: "courier", name: "Empresas de paquetería", icon: "fa-solid fa-truck", cost: 180 },
    ],
    prepTime: "24 horas",
  },
  "paleta-de-sombras": {
    id: "paleta-de-sombras",
    title: "Paleta de sombras",
    category: "Makeup & Cuidado personal",
    price: 350,
    minOrder: 1,
    rating: 4.5,
    providerRating: 4.5,
    provider: {
      name: "Megaboutique S.A",
      initial: "M",
      location: "San Ramón, Matagalpa",
      verified: true,
    },
    image: paletaImg,
    rank: 4,
    brand: "Beauty Creations",
    description: "Paleta de sombras profesional con 35 tonos de alta pigmentación en acabado mate, satinado y glitter.",
    colors: ["#be185d", "#b45309", "#4338ca"],
    shippingMethods: [
      { id: "bus", name: "Bus Interlocal", icon: "fa-solid fa-bus", cost: 100 },
      { id: "courier", name: "Empresas de paquetería", icon: "fa-solid fa-truck", cost: 140 },
    ],
    prepTime: "12 horas",
  },
};

// Current active product computed reactively from route param
const product = computed<ProductDetailData>(() => {
  const param = (route.params.id as string) || "laptop-adventure";
  if (catalog[param]) {
    return catalog[param];
  }
  // If product not found in catalog, return empty product with requested title
  return {
    ...emptyProduct,
    id: param,
    title: param === "empty" ? "VACÍO" : `Producto (${param}) - VACÍO`,
  };
});

// Interactive state
const selectedColorIndex = ref(0);
const selectedShippingMethod = ref("bus");
const quantity = ref(1);

// Keep quantity aligned when product changes
watch(
  product,
  (newProduct) => {
    quantity.value = newProduct.minOrder > 0 ? newProduct.minOrder : 1;
    selectedColorIndex.value = 0;
    if (newProduct.shippingMethods.length > 0) {
      selectedShippingMethod.value = newProduct.shippingMethods[0].id;
    }
  },
  { immediate: true },
);

const selectedShipping = computed(() => {
  if (!product.value.shippingMethods || product.value.shippingMethods.length === 0) {
    return { id: "vacio", name: "VACÍO", icon: "fa-solid fa-truck", cost: 0 };
  }
  return (
    product.value.shippingMethods.find((m) => m.id === selectedShippingMethod.value) ||
    product.value.shippingMethods[0]
  );
});

// Calculations
const subtotal = computed(() => {
  return product.value.price * quantity.value;
});

const shippingCost = computed(() => {
  return selectedShipping.value?.cost || 0;
});

const total = computed(() => {
  return subtotal.value + shippingCost.value;
});

const formatPrice = (val: number | null | undefined) => {
  if (val === null || val === undefined || isNaN(val)) return "0";
  return val.toLocaleString("es-NI");
};

const increaseQuantity = () => {
  quantity.value += 1;
};

const decreaseQuantity = () => {
  const min = product.value.minOrder > 0 ? product.value.minOrder : 1;
  if (quantity.value > min) {
    quantity.value -= 1;
  }
};

const handleAddToCart = () => {
  showAddedToast.value = true;
  setTimeout(() => {
    showAddedToast.value = false;
  }, 3000);
};

const navigateToCategory = () => {
  router.push({ name: "category" });
};

onMounted(() => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
</script>

<template>
  <div class="product-detail-page">
    <!-- Encabezado / Header -->
    <header class="header">
      <div class="container header-content">
        <div class="logo">
          <router-link :to="{ name: 'home' }">
            <img :src="logoImg" alt="Mercanto" class="logo-img" />
          </router-link>
        </div>

        <button
          class="mobile-menu-btn"
          aria-label="Alternar navegación"
          @click="toggleMenu"
        >
          <i :class="isMenuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'"></i>
        </button>

        <nav :class="['nav-links', { open: isMenuOpen }]">
          <router-link :to="{ name: 'home' }" @click="closeMenu">Inicio</router-link>
          <router-link :to="{ name: 'category' }" @click="closeMenu">Categorías</router-link>
          <router-link :to="{ name: 'home', hash: '#proveedores' }" @click="closeMenu">Proveedores</router-link>
          <router-link :to="{ name: 'home', hash: '#como-funciona' }" @click="closeMenu">Como funciona</router-link>
          <router-link :to="{ name: 'orders' }" @click="closeMenu">Pedidos</router-link>
        </nav>

        <div :class="['auth-buttons', { open: isMenuOpen }]">
          <router-link :to="{ name: 'login' }" class="login-link" @click="closeMenu">
            Iniciar sesión
          </router-link>
          <router-link :to="{ name: 'register' }" class="btn-register" @click="closeMenu">
            Registrarse
          </router-link>
        </div>
      </div>
    </header>

    <!-- Contenedor Principal -->
    <main class="container main-content">
      <!-- Breadcrumb / Migas de pan -->
      <nav class="breadcrumbs-nav" aria-label="Breadcrumb">
        <router-link :to="{ name: 'home' }">Inicio</router-link>
        <span class="separator">></span>
        <router-link :to="{ name: 'category' }">Categorías</router-link>
        <span class="separator">></span>
        <a href="#" @click.prevent="navigateToCategory">{{ product.category || 'VACÍO' }}</a>
        <span class="separator">></span>
        <span class="current-crumb">{{ product.title || 'VACÍO' }}</span>
      </nav>

      <!-- SECCIÓN 1: Ficha Principal del Producto (2 Columnas) -->
      <section class="product-top-grid">
        <!-- Columna Izquierda: Galería de Imagen -->
        <div class="product-gallery-card">
          <div class="product-image-container">
            <img
              v-if="product.image"
              :src="product.image"
              :alt="product.title"
              class="main-product-img"
            />
            <div v-else class="empty-image-placeholder">
              <i class="fa-regular fa-image"></i>
              <span>VACÍO</span>
            </div>
          </div>
          <div class="gallery-favorite-star">
            <i class="fa-solid fa-star star-orange"></i>
          </div>
        </div>

        <!-- Columna Derecha: Tarjeta de Información Detallada -->
        <div class="product-summary-card">
          <!-- Ranking Badge & Categoría -->
          <div class="summary-top-row">
            <div class="ranking-badge">{{ product.rank > 0 ? product.rank : '-' }}</div>
            <span class="category-tag-italic">{{ product.category || 'VACÍO' }}</span>
          </div>

          <!-- Título del Producto -->
          <h1 class="product-main-title">{{ product.title || 'VACÍO' }}</h1>

          <!-- Proveedor -->
          <div class="provider-pill-row">
            <div class="provider-avatar-circle">
              <span>{{ product.provider.initial || '-' }}</span>
            </div>
            <span class="provider-title-text">{{ product.provider.name || 'VACÍO' }}</span>
            <i v-if="product.provider.verified" class="fa-solid fa-circle-check verified-badge-icon"></i>
          </div>

          <!-- Precio Principal -->
          <div class="product-price-row">
            <span class="currency-price">
              {{ product.price > 0 ? `C$ ${formatPrice(product.price)}` : 'VACÍO' }}
            </span>
          </div>

          <!-- Pedido Mínimo -->
          <div class="min-order-row">
            <strong>Pedido mínimo:</strong>
            {{ product.minOrder > 0 ? `${product.minOrder} unidad${product.minOrder > 1 ? 'es' : ''}` : 'VACÍO' }}
          </div>

          <!-- Calificación -->
          <div class="rating-stars-row">
            <i class="fa-regular fa-star star-orange-outline"></i>
            <span class="rating-number">
              {{ product.rating > 0 ? product.rating.toFixed(1) : 'VACÍO' }}
            </span>
          </div>

          <!-- Selector de Colores -->
          <div class="colors-section">
            <p class="section-label">Colores disponibles:</p>
            <div v-if="product.colors && product.colors.length > 0" class="color-swatches-row">
              <button
                v-for="(color, idx) in product.colors"
                :key="idx"
                type="button"
                :class="['color-swatch-btn', { active: selectedColorIndex === idx }]"
                :style="{ backgroundColor: color }"
                :aria-label="`Color ${idx + 1}`"
                @click="selectedColorIndex = idx"
              ></button>
            </div>
            <p v-else class="empty-field-text">VACÍO</p>
          </div>

          <!-- Especificaciones / Detalles -->
          <div class="specs-list">
            <p class="spec-line">
              <strong>Marca:</strong> {{ product.brand || 'VACÍO' }}
            </p>
            <p class="spec-line">
              <strong>Descripción:</strong> {{ product.description || 'VACÍO' }}
            </p>
          </div>

          <!-- Tipo de Envío Disponible -->
          <div class="shipping-options-section">
            <p class="section-label">Tipo de envío disponible:</p>
            <div
              v-if="product.shippingMethods && product.shippingMethods.length > 0"
              class="shipping-methods-row"
            >
              <div
                v-for="method in product.shippingMethods"
                :key="method.id"
                :class="['shipping-method-item', { active: selectedShippingMethod === method.id }]"
                @click="selectedShippingMethod = method.id"
              >
                <i :class="method.icon"></i>
                <span>{{ method.name || 'VACÍO' }}</span>
              </div>
            </div>
            <p v-else class="empty-field-text">VACÍO</p>
          </div>

          <!-- Tiempo de Preparación -->
          <div class="prep-time-section">
            <p class="section-label">Tiempo de preparación:</p>
            <p class="prep-time-value">{{ product.prepTime || 'VACÍO' }}</p>
          </div>
        </div>
      </section>

      <!-- SECCIÓN 2: Proveedor y Cantidad (2 Columnas) -->
      <section class="product-bottom-grid">
        <!-- Columna Izquierda: Tarjeta "Tu proveedor" -->
        <div class="card-provider-box">
          <h3 class="box-heading">Tu proveedor</h3>

          <div class="provider-profile-summary">
            <div class="provider-avatar-circle large">
              <span>{{ product.provider.initial || '-' }}</span>
            </div>
            <div class="provider-name-wrapper">
              <span class="provider-name-bold">{{ product.provider.name || 'VACÍO' }}</span>
              <i v-if="product.provider.verified" class="fa-solid fa-circle-check verified-badge-icon"></i>
            </div>
          </div>

          <div class="provider-rating-score">
            <i class="fa-regular fa-star star-orange-outline"></i>
            <span class="score-number">
              {{ product.providerRating > 0 ? product.providerRating.toFixed(1) : 'VACÍO' }}
            </span>
          </div>

          <p class="provider-location-text">{{ product.provider.location || 'VACÍO' }}</p>

          <button type="button" class="btn-orange-pill btn-catalog">
            Ver catalogo
          </button>

          <hr class="card-divider" />

          <!-- Resumen de Pedido en Curso -->
          <div class="cart-summary-footer">
            <div class="cart-left-info">
              <i class="fa-solid fa-box-open box-cart-icon"></i>
              <span class="cart-items-count">Tienes 2 productos en tu pedido</span>
            </div>
            <router-link :to="{ name: 'orders' }" class="btn-view-order-link">
              Ver pedido >
            </router-link>
          </div>
        </div>

        <!-- Columna Derecha: Tarjeta "Elige la cantidad" -->
        <div class="card-quantity-box">
          <h3 class="box-heading">Elige la cantidad</h3>

          <!-- Stepper de Cantidad -->
          <div class="stepper-row">
            <div class="stepper-controls">
              <button
                type="button"
                class="btn-stepper minus"
                :disabled="quantity <= (product.minOrder > 0 ? product.minOrder : 1)"
                aria-label="Disminuir cantidad"
                @click="decreaseQuantity"
              >
                <i class="fa-solid fa-minus"></i>
              </button>

              <span class="stepper-value">{{ quantity }}</span>

              <button
                type="button"
                class="btn-stepper plus"
                aria-label="Aumentar cantidad"
                @click="increaseQuantity"
              >
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>

            <span class="unit-label">unidades</span>

            <span class="badge-min-order">Pedido mínimo</span>
          </div>

          <!-- Desglose de Cálculo de Precios -->
          <div class="price-breakdown-table">
            <div class="breakdown-row">
              <span class="row-label">Precio unitario:</span>
              <span class="row-value">
                {{ product.price > 0 ? `C$ ${formatPrice(product.price)}` : 'VACÍO' }}
              </span>
            </div>

            <div class="breakdown-row">
              <span class="row-label">Cantidad:</span>
              <span class="row-value">{{ quantity }} und</span>
            </div>

            <hr class="breakdown-divider light" />

            <div class="breakdown-row">
              <span class="row-label">Tipo de envío:</span>
              <span class="row-value">{{ selectedShipping.name || 'VACÍO' }}</span>
            </div>

            <div class="breakdown-row">
              <span class="row-label">Subtotal:</span>
              <span class="row-value">
                {{ subtotal > 0 ? `C$ ${formatPrice(subtotal)}` : 'VACÍO' }}
              </span>
            </div>

            <div class="breakdown-row">
              <span class="row-label">Envio estimado:</span>
              <span class="row-value">
                {{ shippingCost > 0 ? `C$ ${formatPrice(shippingCost)}` : 'C$ 0' }}
              </span>
            </div>

            <hr class="breakdown-divider strong" />

            <div class="breakdown-row total-row">
              <span class="total-label">Total estimado:</span>
              <span class="total-value">
                {{ total > 0 ? `C$ ${formatPrice(total)}` : 'VACÍO' }}
              </span>
            </div>
          </div>

          <!-- Botón de Acción Principal -->
          <button
            type="button"
            class="btn-orange-pill btn-add-to-cart"
            :disabled="product.price <= 0"
            @click="handleAddToCart"
          >
            Agregar al pedido
          </button>
        </div>
      </section>
    </main>

    <!-- Toast de Notificación al agregar al carrito -->
    <transition name="toast-fade">
      <div v-if="showAddedToast" class="toast-notification">
        <i class="fa-solid fa-circle-check"></i>
        <span>¡{{ product.title }} ({{ quantity }} unds) agregado a tu pedido!</span>
      </div>
    </transition>

    <!-- Pie de página -->
    <AppFooter />
  </div>
</template>

<style scoped>
.product-detail-page {
  min-height: 100vh;
  background-color: #ffffff;
  color: var(--text-dark, #1e293b);
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  width: 100%;
}

/* ==========================================================================
   Header
   ========================================================================== */
.header {
  background-color: #fff4ec;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-img {
  height: 42px;
  display: block;
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  font-size: 1.6rem;
  color: var(--primary-blue, #083c5a);
  cursor: pointer;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nav-links a {
  text-decoration: none;
  color: var(--primary-blue, #083c5a);
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.5rem 1.1rem;
  border-radius: 12px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
}

.nav-links a:hover {
  background-color: #ffebd9;
  color: var(--primary-orange, #ff6a00);
  box-shadow: 0 3px 10px rgba(255, 106, 0, 0.15);
  transform: translateY(-1px);
}

.nav-links a.router-link-active,
.nav-links a.router-link-exact-active {
  background-color: #ffd8bd;
  color: var(--primary-orange, #ff6a00);
  font-weight: 700;
  box-shadow: 0 3px 12px rgba(255, 106, 0, 0.2);
}

.auth-buttons {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.login-link {
  text-decoration: none;
  color: var(--primary-blue, #083c5a);
  font-weight: 600;
  font-size: 0.95rem;
}

.btn-register {
  background-color: var(--primary-orange, #ff6a00);
  color: #ffffff;
  padding: 0.65rem 1.4rem;
  border-radius: 20px;
  text-decoration: none;
  font-weight: 600;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.btn-register:hover {
  background-color: var(--primary-orange-hover, #e66000);
  transform: translateY(-2px);
}

/* ==========================================================================
   Main Content Layout
   ========================================================================== */
.main-content {
  padding-top: 1.5rem;
  padding-bottom: 4rem;
  flex: 1;
}

/* ==========================================================================
   Breadcrumbs
   ========================================================================== */
.breadcrumbs-nav {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
  font-size: 0.88rem;
  color: #718096;
  margin-bottom: 2rem;
}

.breadcrumbs-nav a {
  color: #718096;
  text-decoration: none;
  transition: color 0.2s ease;
}

.breadcrumbs-nav a:hover {
  color: var(--primary-orange, #ff6a00);
}

.separator {
  color: #a0aec0;
  font-weight: 500;
}

.current-crumb {
  color: #718096;
  font-weight: 600;
}

/* ==========================================================================
   Sección 1: Ficha Principal (Grid 2 Columnas)
   ========================================================================== */
.product-top-grid {
  display: grid;
  grid-template-columns: 1fr 1.35fr;
  gap: 2.5rem;
  align-items: stretch;
  margin-bottom: 2.5rem;
}

/* Columna Izquierda: Galería */
.product-gallery-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.5rem 1rem;
}

.product-image-container {
  width: 100%;
  height: 380px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-product-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 12px 25px rgba(0, 0, 0, 0.12));
  transition: transform 0.3s ease;
}

.main-product-img:hover {
  transform: scale(1.03);
}

.empty-image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #a0aec0;
  font-size: 2.5rem;
  background-color: #f8fafc;
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  width: 100%;
  height: 100%;
}

.empty-image-placeholder span {
  font-size: 0.95rem;
  font-weight: 700;
  color: #94a3b8;
}

.gallery-favorite-star {
  display: flex;
  align-items: center;
  padding-top: 1rem;
}

.star-orange {
  color: var(--primary-orange, #ff6a00);
  font-size: 1.4rem;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.star-orange:hover {
  transform: scale(1.25);
}

/* Columna Derecha: Tarjeta de Resumen */
.product-summary-card {
  background-color: #f1f4f8;
  border-radius: 24px;
  padding: 2.2rem 2.5rem;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
}

.summary-top-row {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  position: absolute;
  top: 1.8rem;
  right: 2rem;
  gap: 0.25rem;
}

.ranking-badge {
  background-color: var(--primary-orange, #ff6a00);
  color: #ffffff;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.95rem;
  box-shadow: 0 2px 8px rgba(255, 106, 0, 0.35);
}

.category-tag-italic {
  font-size: 0.85rem;
  color: #718096;
  font-style: italic;
  margin-top: 0.2rem;
}

.product-main-title {
  font-family: 'Lora', serif;
  font-size: 1.95rem;
  font-weight: 700;
  color: var(--primary-blue, #083c5a);
  margin-bottom: 0.8rem;
  max-width: 75%;
}

.provider-pill-row {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.2rem;
}

.provider-avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.95rem;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.provider-avatar-circle.large {
  width: 48px;
  height: 48px;
  font-size: 1.4rem;
}

.provider-title-text {
  color: var(--primary-blue, #083c5a);
  font-weight: 600;
  font-size: 0.95rem;
}

.verified-badge-icon {
  color: #0284c7;
  font-size: 1.05rem;
}

.product-price-row {
  margin-bottom: 0.6rem;
}

.currency-price {
  font-family: 'Lora', serif;
  color: var(--primary-orange, #ff6a00);
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.min-order-row {
  font-size: 0.95rem;
  color: #2d3748;
  margin-bottom: 0.8rem;
}

.min-order-row strong {
  font-weight: 700;
  color: #1a202c;
}

.rating-stars-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.95rem;
  color: #2d3748;
  font-weight: 600;
  margin-bottom: 1.2rem;
}

.star-orange-outline {
  color: var(--primary-orange, #ff6a00);
  font-size: 1.15rem;
}

.rating-number {
  color: #1a202c;
  font-weight: 600;
}

/* Selector de colores */
.colors-section {
  margin-bottom: 1.2rem;
}

.section-label {
  font-weight: 700;
  font-size: 0.92rem;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.color-swatches-row {
  display: flex;
  gap: 0.6rem;
}

.color-swatch-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 1px #cbd5e1;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.color-swatch-btn:hover {
  transform: scale(1.15);
}

.color-swatch-btn.active {
  box-shadow: 0 0 0 2px var(--primary-blue, #083c5a);
  transform: scale(1.15);
}

.empty-field-text {
  font-size: 0.9rem;
  color: #94a3b8;
  font-weight: 600;
}

/* Especificaciones */
.specs-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.2rem;
}

.spec-line {
  font-size: 0.9rem;
  line-height: 1.45;
  color: #2d3748;
}

.spec-line strong {
  font-weight: 700;
  color: #1a202c;
}

/* Métodos de envío */
.shipping-options-section {
  margin-bottom: 1.2rem;
}

.shipping-methods-row {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.shipping-method-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.35rem 0.6rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.shipping-method-item i {
  font-size: 1.2rem;
}

.shipping-method-item:first-child {
  color: var(--light-teal, #189c94);
}

.shipping-method-item:nth-child(2) {
  color: var(--primary-blue, #083c5a);
}

.shipping-method-item:hover {
  background-color: rgba(24, 156, 148, 0.08);
}

.shipping-method-item.active {
  background-color: rgba(24, 156, 148, 0.12);
}

/* Tiempo de preparación */
.prep-time-section {
  margin-top: auto;
}

.prep-time-value {
  font-size: 0.9rem;
  color: #2d3748;
}

/* ==========================================================================
   Sección 2: Proveedor y Cantidad (Grid 2 Columnas)
   ========================================================================== */
.product-bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1.35fr;
  gap: 2.5rem;
  align-items: stretch;
}

/* Tarjeta: Tu Proveedor */
.card-provider-box {
  background-color: #f1f4f8;
  border-radius: 24px;
  padding: 2.2rem 2.5rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
}

.box-heading {
  font-family: 'Lora', serif;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--primary-blue, #083c5a);
  margin-bottom: 1.25rem;
}

.provider-profile-summary {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.8rem;
}

.provider-name-wrapper {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.provider-name-bold {
  font-weight: 700;
  color: var(--primary-blue, #083c5a);
  font-size: 1.05rem;
}

.provider-rating-score {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}

.score-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-blue, #083c5a);
}

.provider-location-text {
  font-size: 0.88rem;
  color: #718096;
  margin-bottom: 1.2rem;
}

.btn-orange-pill {
  background: linear-gradient(180deg, #ff7a18 0%, #ff5500 100%);
  color: #ffffff;
  border: none;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.btn-orange-pill:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(255, 85, 0, 0.3);
}

.btn-orange-pill:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-catalog {
  width: 170px;
  padding: 0.65rem 1.4rem;
  border-radius: 20px;
  font-size: 0.92rem;
  margin-bottom: 1.5rem;
}

.card-divider {
  border: none;
  border-top: 1px solid #cbd5e1;
  margin: 0.5rem 0 1.25rem;
}

.cart-summary-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: auto;
}

.cart-left-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.box-cart-icon {
  color: var(--light-teal, #189c94);
  font-size: 1.35rem;
}

.cart-items-count {
  font-size: 0.85rem;
  color: #2d3748;
  font-weight: 500;
}

.btn-view-order-link {
  border: 1.5px solid var(--light-teal, #189c94);
  color: var(--light-teal, #189c94);
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.35rem 0.85rem;
  border-radius: 6px;
  background-color: transparent;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-view-order-link:hover {
  background-color: var(--light-teal, #189c94);
  color: #ffffff;
}

/* Tarjeta: Elige la Cantidad */
.card-quantity-box {
  background-color: #f1f4f8;
  border-radius: 24px;
  padding: 2.2rem 2.5rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
}

/* Stepper */
.stepper-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.stepper-controls {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.btn-stepper {
  width: 24px;
  height: 24px;
  background-color: #64748b;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.btn-stepper:hover:not(:disabled) {
  background-color: #475569;
  transform: scale(1.08);
}

.btn-stepper:disabled {
  background-color: #cbd5e1;
  cursor: not-allowed;
}

.stepper-value {
  color: var(--light-teal, #189c94);
  font-weight: 700;
  font-size: 1.15rem;
  min-width: 28px;
  text-align: center;
}

.unit-label {
  color: #4a5568;
  font-size: 0.9rem;
}

.badge-min-order {
  background-color: #d8f1ef;
  color: var(--light-teal, #189c94);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.2rem 0.65rem;
  border-radius: 12px;
}

/* Tabla de desglose de precios */
.price-breakdown-table {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1.75rem;
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
}

.row-label {
  color: #2d3748;
  font-weight: 500;
}

.row-value {
  color: #1a202c;
  font-weight: 700;
  font-size: 1rem;
}

.breakdown-divider.light {
  border: none;
  border-top: 1px solid #cbd5e1;
  margin: 0.4rem 0;
}

.breakdown-divider.strong {
  border: none;
  border-top: 1.5px solid #64748b;
  margin: 0.5rem 0;
}

.total-row {
  margin-top: 0.2rem;
}

.total-label {
  font-weight: 700;
  color: #1a202c;
  font-size: 1.05rem;
}

.total-value {
  font-weight: 700;
  color: #1a202c;
  font-size: 1.15rem;
}

.btn-add-to-cart {
  width: 100%;
  padding: 0.9rem;
  border-radius: 26px;
  font-size: 1.05rem;
  box-shadow: 0 4px 15px rgba(255, 106, 0, 0.25);
}

/* ==========================================================================
   Toast de Confirmación
   ========================================================================== */
.toast-notification {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background-color: var(--primary-blue, #083c5a);
  color: #ffffff;
  padding: 1rem 1.6rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
  z-index: 1000;
  font-weight: 600;
  font-size: 0.95rem;
  border-left: 5px solid var(--primary-orange, #ff6a00);
}

.toast-notification i {
  color: #10b981;
  font-size: 1.3rem;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* ==========================================================================
   Media Queries / Responsividad
   ========================================================================== */
@media (max-width: 992px) {
  .product-top-grid,
  .product-bottom-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .product-image-container {
    height: 300px;
  }

  .product-main-title {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-wrap: wrap;
  }

  .nav-links {
    display: none;
    flex-direction: column;
    width: 100%;
    align-items: center;
    gap: 1rem;
    padding: 1rem 0;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    margin-top: 0.75rem;
    order: 3;
  }

  .nav-links.open {
    display: flex;
  }

  .auth-buttons {
    display: none;
    flex-direction: column;
    width: 100%;
    align-items: center;
    gap: 0.75rem;
    order: 4;
    padding-bottom: 0.5rem;
  }

  .auth-buttons.open {
    display: flex;
  }

  .mobile-menu-btn {
    display: block;
  }

  .product-summary-card,
  .card-provider-box,
  .card-quantity-box {
    padding: 1.5rem;
  }
}
</style>
