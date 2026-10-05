<script setup lang="ts">
import { ref, computed } from "vue";
import AppLogo from "@/components/common/AppLogo.vue";

// --- State for Training Course Player ---
const isPlayerOpen = ref(false);
const activeTrack = ref<"compradores" | "proveedores">("compradores");
const currentStepIndex = ref(0);
const completedStepIndexes = ref<number[]>([0]); // Track completed steps with checkmark
const isVideoPlaying = ref(false);

interface TutorialStep {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  duration: string;
  learningPoints: string[];
}

// --- Steps for Compradores ---
const buyerSteps: TutorialStep[] = [
  {
    id: "buyer-1",
    stepNumber: 1,
    title: "1. Cómo crear una cuenta",
    subtitle: "Vídeo",
    duration: "2:15 min",
    learningPoints: [
      "Cómo crear una cuenta de comprador.",
      "Cómo llenar tu información.",
      "Cómo crear contraseña.",
      "Elegir preferencias.",
    ],
  },
  {
    id: "buyer-2",
    stepNumber: 2,
    title: "2. Cómo buscar productos",
    subtitle: "Vídeo",
    duration: "3:40 min",
    learningPoints: [
      "Cómo utilizar el buscador",
      "Cómo filtrar productos",
      "Como buscar productos por imagen.",
      "Como utilizar la Busqueda Inteligente.",
      "Cómo consultar los detalles",
    ],
  },
  {
    id: "buyer-3",
    stepNumber: 3,
    title: "3. Conoce a nuestros proveedores",
    subtitle: "Vídeo",
    duration: "4:05 min",
    learningPoints: [
      "Cómo consultar perfiles de proveedores verificados.",
      "Revisar catálogo y lista de precios mayoristas.",
      "Verificar calificaciones, reseñas y ubicación.",
      "Conocer políticas de garantía y plazos de entrega.",
    ],
  },
  {
    id: "buyer-4",
    stepNumber: 4,
    title: "4. Cómo realizar un pedido",
    subtitle: "Vídeo",
    duration: "3:50 min",
    learningPoints: [
      "Cómo solicitar cotizaciones a medida.",
      "Agregar productos al carrito mayorista.",
      "Seleccionar métodos de entrega y dirección.",
      "Confirmar el pedido y recibir notificaciones.",
    ],
  },
  {
    id: "buyer-5",
    stepNumber: 5,
    title: "5. Cómo contactar proveedores",
    subtitle: "Vídeo",
    duration: "2:30 min",
    learningPoints: [
      "Cómo iniciar una conversación por chat interno.",
      "Resolver dudas sobre disponibilidad y volumen.",
      "Adjuntar comprobantes y documentos de soporte.",
      "Gestionar el seguimiento de tus pedidos.",
    ],
  },
  {
    id: "buyer-6",
    stepNumber: 6,
    title: "6. Cómo utilizar la Billetera Digital",
    subtitle: "Vídeo",
    duration: "4:15 min",
    learningPoints: [
      "Cómo consultar tu saldo disponible y transferencias.",
      "Cómo recargar mediante depósitos bancarios.",
      "Realizar pagos seguros de tus pedidos.",
      "Descargar historial de movimientos y facturas.",
    ],
  },
];

// --- Steps for Proveedores ---
const providerSteps: TutorialStep[] = [
  {
    id: "prov-1",
    stepNumber: 1,
    title: "1. Cómo crear una cuenta",
    subtitle: "Vídeo",
    duration: "2:45 min",
    learningPoints: [
      "Cómo registrar tu empresa como proveedor mayorista.",
      "Subir documentos requeridos (RUC y cédula).",
      "Configurar los datos de tu negocio y ubicación.",
      "Proceso de validación y aprobación de cuenta.",
    ],
  },
  {
    id: "prov-2",
    stepNumber: 2,
    title: "2. Cómo publicar productos",
    subtitle: "Vídeo",
    duration: "5:10 min",
    learningPoints: [
      "Cómo crear nuevos productos en tu catálogo.",
      "Configurar precios unitarios y escalas por volumen.",
      "Subir imágenes y especificaciones técnicas.",
      "Administrar disponibilidad e inventario en tiempo real.",
    ],
  },
  {
    id: "prov-3",
    stepNumber: 3,
    title: "3. Cómo utilizar la Billetera Digital",
    subtitle: "Vídeo",
    duration: "3:30 min",
    learningPoints: [
      "Cómo recibir los ingresos de tus ventas al por mayor.",
      "Consultar comisiones y saldo neto retenido.",
      "Solicitar retiros a cuentas bancarias nacionales.",
      "Monitorear el estado de las transferencias.",
    ],
  },
  {
    id: "prov-4",
    stepNumber: 4,
    title: "4. Cómo visualizar los pedidos",
    subtitle: "Vídeo",
    duration: "3:15 min",
    learningPoints: [
      "Bandeja de pedidos pendientes y cotizaciones.",
      "Aceptar, preparar y marcar pedidos como despachados.",
      "Cargar guías de transporte y entrega.",
      "Historial de entregas completadas.",
    ],
  },
  {
    id: "prov-5",
    stepNumber: 5,
    title: "5. Cómo contactar a los compradores",
    subtitle: "Vídeo",
    duration: "2:50 min",
    learningPoints: [
      "Responder mensajes y solicitudes de compradores.",
      "Enviar ofertas personalizadas y acuerdos de precios.",
      "Coordinar detalles logísticos de entrega.",
      "Mantener una buena calificación de servicio.",
    ],
  },
  {
    id: "prov-6",
    stepNumber: 6,
    title: "6. Cómo actualizar tu información",
    subtitle: "Vídeo",
    duration: "3:05 min",
    learningPoints: [
      "Editar logo, nombre comercial y descripción.",
      "Actualizar cuentas bancarias registradas.",
      "Gestionar ubicaciones y zonas de cobertura.",
      "Cambiar contraseñas y permisos de acceso.",
    ],
  },
];

// Active steps list based on track
const activeSteps = computed(() => {
  return activeTrack.value === "compradores" ? buyerSteps : providerSteps;
});

const currentStep = computed(() => {
  return activeSteps.value[currentStepIndex.value] || activeSteps.value[0];
});

// Open Training Interface
function openCourse(track: "compradores" | "proveedores", stepIdx = 0) {
  activeTrack.value = track;
  currentStepIndex.value = stepIdx;
  if (!completedStepIndexes.value.includes(stepIdx) && stepIdx > 0) {
    // ensure previous steps are marked as watched for realistic preview
    for (let i = 0; i < stepIdx; i++) {
      if (!completedStepIndexes.value.includes(i)) {
        completedStepIndexes.value.push(i);
      }
    }
  }
  isVideoPlaying.value = false;
  isPlayerOpen.value = true;
  document.body.style.overflow = "hidden";
}

function markAsWatched(index = currentStepIndex.value) {
  if (!completedStepIndexes.value.includes(index)) {
    completedStepIndexes.value.push(index);
  }
}

function handleVideoTouch() {
  markAsWatched(currentStepIndex.value);
  isVideoPlaying.value = !isVideoPlaying.value;
}

function closePlayer() {
  isPlayerOpen.value = false;
  isVideoPlaying.value = false;
  document.body.style.overflow = "";
}

function handleNext() {
  markAsWatched(currentStepIndex.value);
  if (currentStepIndex.value < activeSteps.value.length - 1) {
    currentStepIndex.value++;
    isVideoPlaying.value = false;
  } else {
    // Finished all steps
    closePlayer();
  }
}

function handlePrev() {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--;
    isVideoPlaying.value = false;
  }
}

function selectStep(index: number) {
  currentStepIndex.value = index;
  isVideoPlaying.value = false;
}
</script>

<template>
  <section id="como-funciona" class="w-full max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 lg:space-y-24">
    <!-- ================================================================= -->
    <!-- 1. HERO BANNER: Centro de Capacitación / ¿Cómo Funciona Mercanto?  -->
    <!-- ================================================================= -->
    <div
      class="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#c6f3ed] via-[#daf7f3] to-[#ebfaf7] p-6 sm:p-10 lg:p-14 shadow-xs"
    >
      <!-- Decorative background circles on right -->
      <div class="absolute -right-20 -bottom-24 w-96 h-96 rounded-full bg-[#ff6a00] opacity-95 pointer-events-none"></div>
      <div class="absolute right-32 -bottom-20 w-80 h-80 rounded-full bg-[#00a896] opacity-90 pointer-events-none"></div>

      <div class="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <!-- Left Column: Text & CTA -->
        <div class="lg:col-span-7 space-y-5 text-left">
          <!-- Badge -->
          <div class="inline-flex items-center gap-2 rounded-lg bg-[#a6ece3]/80 border border-teal-500/25 px-3 py-1.5 text-xs font-bold text-[#023859]">
            <i class="fa-solid fa-book-open text-[#00a896]"></i>
            <span>Centro de Capacitación</span>
          </div>

          <!-- Title -->
          <h1 class="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#023859] leading-[1.15]">
            ¿Cómo Funciona<br />
            <span class="text-[#ff6a00]">M</span>ercanto?
          </h1>

          <!-- Description -->
          <p class="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed max-w-xl">
            Aprende a utilizar nuestra plataforma de comercio Mercanto. Aquí podrás encontrar videos y guías que te ayudarán paso a paso cómo registrarte, buscar productos, comprar, vender y conectar con proveedores de todos los departamentos del país.
          </p>

          <!-- Button CTA -->
          <div class="pt-2">
            <button
              type="button"
              @click="openCourse('compradores', 0)"
              class="inline-flex items-center gap-2.5 rounded-full bg-[#ff6a00] hover:bg-[#ea580c] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <span class="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#ff6a00] text-[10px]">
                <i class="fa-solid fa-play ml-0.5"></i>
              </span>
              <span>Ver video introductorio</span>
            </button>
          </div>
        </div>

        <!-- Right Column: Real Laptop Image from User Mockup -->
        <div class="lg:col-span-5 flex justify-center lg:justify-end">
          <div
            @click="openCourse('compradores', 0)"
            class="relative w-full max-w-[270px] sm:max-w-[340px] md:max-w-[380px] lg:max-w-[410px] group cursor-pointer transition-transform hover:scale-[1.03]"
          >
            <img
              src="@/assets/laptop-mercanto.png"
              alt="Video introductorio Mercanto"
              class="w-full h-auto object-contain drop-shadow-xl"
            />
            <!-- Play Button Overlay on Laptop Screen -->
            <div class="absolute inset-0 flex items-center justify-center -translate-y-3 sm:-translate-y-4 md:-translate-y-5">
              <div class="flex h-11 w-11 sm:h-13 sm:w-13 md:h-14 md:w-14 items-center justify-center rounded-full bg-[#ff6a00] text-white shadow-xl group-hover:scale-110 active:scale-95 transition-all">
                <i class="fa-solid fa-play text-xs sm:text-base ml-0.5"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- 2. ¿Qué es Mercanto?                                              -->
    <!-- ================================================================= -->
    <div class="space-y-4 text-left max-w-5xl">
      <h2 class="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#023859]">
        ¿Qué es <span class="text-[#ff6a00]">M</span>ercanto?
      </h2>
      <p class="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed">
        Mercanto es una plataforma de comercio web que conecta importadores y distribuidores mayoristas con emprendedores, micro, pequeñas y medianas empresas de Nicaragua, facilitando la compra de productos al por mayor mediante un sistema seguro, accesible y eficiente que reduzca las barreras geográficas, los costos de desplazamiento, la pérdida de tiempo y los riesgos asociados al abastecimiento presencial.
      </p>
    </div>

    <!-- ================================================================= -->
    <!-- 3. ¿Qué puedes hacer en la Plataforma?                            -->
    <!-- ================================================================= -->
    <div class="space-y-8 text-left">
      <h2 class="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#023859]">
        ¿Qué puedes hacer en la Plataforma?
      </h2>

      <!-- 3 Feature Cards with Arch Images -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        <!-- Card 1: Explora Productos -->
        <div class="rounded-[28px] border-2 border-[#eddcd2] bg-white p-5 pb-8 flex flex-col items-center text-center shadow-xs hover:shadow-md hover:-translate-y-1 transition-all">
          <div class="w-full aspect-[4/3] rounded-t-[28px] rounded-b-xl overflow-hidden bg-slate-100 mb-4">
            <img
              src="@/assets/explora-productos.jpg"
              alt="Explora Productos"
              class="h-full w-full object-cover"
            />
          </div>
          <h3 class="font-serif text-base sm:text-lg font-bold text-[#023859]">
            Explora Productos
          </h3>
          <p class="text-xs text-slate-500 mt-2 max-w-[220px] leading-relaxed">
            Explora miles de productos al por mayor de proveedores verificados.
          </p>
        </div>

        <!-- Card 2: Encuentra Proveedores -->
        <div class="rounded-[28px] border-2 border-[#eddcd2] bg-white p-5 pb-8 flex flex-col items-center text-center shadow-xs hover:shadow-md hover:-translate-y-1 transition-all">
          <div class="w-full aspect-[4/3] rounded-t-[28px] rounded-b-xl overflow-hidden bg-slate-100 mb-4">
            <img
              src="@/assets/encuentra-proveedores.png"
              alt="Encuentra Proveedores"
              class="h-full w-full object-cover"
            />
          </div>
          <h3 class="font-serif text-base sm:text-lg font-bold text-[#023859]">
            Encuentra Proveedores
          </h3>
          <p class="text-xs text-slate-500 mt-2 max-w-[220px] leading-relaxed">
            Revisa calificaciones, precios y plazos de entrega en cada proveedor.
          </p>
        </div>

        <!-- Card 3: Realiza tus Pedidos -->
        <div class="rounded-[28px] border-2 border-[#eddcd2] bg-white p-5 pb-8 flex flex-col items-center text-center shadow-xs hover:shadow-md hover:-translate-y-1 transition-all">
          <div class="w-full aspect-[4/3] rounded-t-[28px] rounded-b-xl overflow-hidden bg-slate-100 mb-4">
            <img
              src="@/assets/realiza-pedidos.png"
              alt="Realiza tus Pedidos"
              class="h-full w-full object-cover"
            />
          </div>
          <h3 class="font-serif text-base sm:text-lg font-bold text-[#023859]">
            Realiza tus Pedidos
          </h3>
          <p class="text-xs text-slate-500 mt-2 max-w-[220px] leading-relaxed">
            Haz pedidos al por mayor de forma rápida y transparente para tu negocio.
          </p>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- 4. Aprende Paso a Paso - Compradores                              -->
    <!-- ================================================================= -->
    <div class="space-y-6 text-left">
      <!-- Section Header -->
      <div class="space-y-1">
        <div class="flex items-center gap-3">
          <i class="fa-solid fa-circle-play text-2xl sm:text-3xl text-[#00a896]"></i>
          <h2 class="font-serif text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-[#023859]">
            Aprende Paso a Paso - <span class="text-[#f97316]">Compradores</span>
          </h2>
        </div>
        <p class="text-xs sm:text-sm text-slate-500 pl-9 sm:pl-10">
          Mira los videos tutoriales para conocer las funciones de la plataforma.
        </p>
      </div>

      <!-- 6 Tutorial Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="(step, idx) in buyerSteps"
          :key="step.id"
          @click="openCourse('compradores', idx)"
          class="group rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <!-- Video Thumbnail Frame -->
          <div class="w-full aspect-[16/9] rounded-xl bg-[#fef2e8] flex items-center justify-center relative overflow-hidden group-hover:bg-[#fedec7] transition-colors">
            <!-- Play Button in Center -->
            <div class="flex h-11 w-11 items-center justify-center rounded-full bg-[#00a896] text-white shadow-md group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-play text-sm ml-0.5"></i>
            </div>

            <!-- Duration tag -->
            <span class="absolute bottom-2 right-2 rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
              {{ step.duration }}
            </span>
          </div>

          <!-- Video Text Info -->
          <div class="pt-3 space-y-1">
            <h3 class="text-xs sm:text-sm font-bold text-[#023859] group-hover:text-[#00a896] transition-colors leading-snug">
              {{ step.title.replace(/^\d+\.\s*/, '') }}
            </h3>
            <p class="text-[11px] text-slate-500 leading-relaxed">
              {{ step.learningPoints[0] || 'Aprende a utilizar esta función en la plataforma.' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- 5. Aprende Paso a Paso - Proveedores                              -->
    <!-- ================================================================= -->
    <div class="space-y-6 text-left">
      <!-- Section Header -->
      <div class="space-y-1">
        <div class="flex items-center gap-3">
          <i class="fa-solid fa-circle-play text-2xl sm:text-3xl text-[#00a896]"></i>
          <h2 class="font-serif text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-[#023859]">
            Aprende Paso a Paso - <span class="text-[#f97316]">Proveedores</span>
          </h2>
        </div>
        <p class="text-xs sm:text-sm text-slate-500 pl-9 sm:pl-10">
          Mira los videos tutoriales para conocer las funciones de la plataforma.
        </p>
      </div>

      <!-- 6 Tutorial Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="(step, idx) in providerSteps"
          :key="step.id"
          @click="openCourse('proveedores', idx)"
          class="group rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <!-- Video Thumbnail Frame -->
          <div class="w-full aspect-[16/9] rounded-xl bg-[#fef2e8] flex items-center justify-center relative overflow-hidden group-hover:bg-[#fedec7] transition-colors">
            <!-- Play Button in Center -->
            <div class="flex h-11 w-11 items-center justify-center rounded-full bg-[#00a896] text-white shadow-md group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-play text-sm ml-0.5"></i>
            </div>

            <!-- Duration tag -->
            <span class="absolute bottom-2 right-2 rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
              {{ step.duration }}
            </span>
          </div>

          <!-- Video Text Info -->
          <div class="pt-3 space-y-1">
            <h3 class="text-xs sm:text-sm font-bold text-[#023859] group-hover:text-[#00a896] transition-colors leading-snug">
              {{ step.title.replace(/^\d+\.\s*/, '') }}
            </h3>
            <p class="text-[11px] text-slate-500 leading-relaxed">
              {{ step.learningPoints[0] || 'Aprende a utilizar esta función en la plataforma.' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- 6. FULLSCREEN TRAINING VIDEO PLAYER INTERFACE (Identical to User Mockup)   -->
    <!-- ========================================================================= -->
    <div
      v-if="isPlayerOpen"
      class="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden animate-in fade-in duration-200"
    >
      <!-- Top Header Bar -->
      <header class="h-16 sm:h-20 shrink-0 border-b border-slate-200 bg-white px-4 sm:px-8 flex items-center justify-between z-20">
        <!-- Orange Close Button -->
        <button
          type="button"
          @click="closePlayer"
          title="Cerrar reproductor"
          class="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-[#ff6a00] hover:bg-[#ea580c] flex items-center justify-center text-white transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <i class="fa-solid fa-xmark text-lg sm:text-xl"></i>
        </button>

        <!-- Mercanto Logo -->
        <div>
          <AppLogo variant="logo" class="h-9 sm:h-11 cursor-pointer" @click="closePlayer" />
        </div>
      </header>

      <!-- Main Body Container: Left Sidebar + Right Content Area -->
      <div class="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <!-- ── Left Sidebar (Steps List) ─────────────────────────────────── -->
        <aside class="w-full lg:w-[320px] xl:w-[340px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white p-4 sm:p-6 flex flex-col justify-between overflow-y-auto max-h-[35vh] lg:max-h-full">
          <!-- Steps List -->
          <div class="space-y-2">
            <div
              v-for="(step, idx) in activeSteps"
              :key="step.id"
              @click="selectStep(idx)"
              :class="[
                'w-full rounded-2xl p-3.5 sm:p-4 text-left transition-all cursor-pointer flex items-center justify-between group',
                currentStepIndex === idx
                  ? 'bg-[#fef0ea] text-[#023859]'
                  : 'bg-transparent hover:bg-slate-50 text-slate-700'
              ]"
            >
              <div class="space-y-0.5 min-w-0 pr-2 flex-1">
                <div class="flex items-center gap-2">
                  <p
                    :class="[
                      'text-xs sm:text-sm font-semibold truncate',
                      currentStepIndex === idx ? 'text-[#023859] font-bold' : 'text-slate-800'
                    ]"
                  >
                    {{ step.title }}
                  </p>
                  <!-- Completed checkmark icon in teal circle right next to title -->
                  <div
                    v-if="completedStepIndexes.includes(idx)"
                    class="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#00a896] text-white text-[9px] shadow-2xs"
                    title="Video visto"
                  >
                    <i class="fa-solid fa-check"></i>
                  </div>
                </div>
                <p class="text-[11px] text-slate-400 font-normal">
                  {{ step.subtitle }}
                </p>
              </div>
            </div>
          </div>

          <!-- Bottom Button: Continuar después... -->
          <div class="pt-4 lg:pt-6">
            <button
              type="button"
              @click="closePlayer"
              class="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer active:scale-95"
            >
              <i class="fa-solid fa-arrow-left text-xs text-slate-500"></i>
              <span>Continuar después...</span>
            </button>
          </div>
        </aside>

        <!-- ── Right Main Area (Soft Peach Canvas) ───────────────────────── -->
        <main class="flex-1 bg-[#faebe8] p-4 sm:p-6 lg:p-10 overflow-y-auto flex flex-col items-center">
          <div class="w-full max-w-4xl space-y-6">
            <!-- Top Navigation Bar inside Canvas -->
            <div class="flex items-center justify-between w-full">
              <!-- Back Button (hidden on step 0) -->
              <div>
                <button
                  v-if="currentStepIndex > 0"
                  type="button"
                  @click="handlePrev"
                  class="rounded-xl border border-slate-300 bg-white px-5 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-2xs inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <i class="fa-solid fa-arrow-left text-xs"></i>
                  <span>Atrás</span>
                </button>
              </div>

              <!-- Next Button -->
              <div>
                <button
                  type="button"
                  @click="handleNext"
                  class="rounded-xl border border-slate-300 bg-white px-5 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-2xs inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <span>{{ currentStepIndex === activeSteps.length - 1 ? 'Finalizar' : 'Siguiente' }}</span>
                  <i class="fa-solid fa-arrow-right text-xs"></i>
                </button>
              </div>
            </div>

            <!-- Video Player Card Container with User-Uploaded Portada -->
            <div
              @click="handleVideoTouch"
              class="relative w-full rounded-2xl sm:rounded-[24px] overflow-hidden bg-slate-950 shadow-md border border-slate-200 cursor-pointer group select-none"
            >
              <!-- Video Cover Image (User Uploaded Portada) -->
              <div class="relative w-full aspect-[16/9] sm:aspect-[16/8.5] flex items-center justify-center overflow-hidden bg-[#023859]">
                <img
                  src="@/assets/video-portada-mercanto.png"
                  :alt="currentStep.title"
                  class="w-full h-full object-cover sm:object-contain"
                />

                <!-- Play / Pause Overlay Center Indicator -->
                <div class="absolute inset-0 flex flex-col items-center justify-center bg-black/10 group-hover:bg-black/25 transition-colors p-4">
                  <div
                    class="flex h-14 w-14 sm:h-18 sm:w-18 items-center justify-center rounded-full bg-[#ff6a00] text-white shadow-2xl group-hover:scale-110 active:scale-95 transition-all"
                  >
                    <i :class="['text-xl sm:text-2xl ml-1', isVideoPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play']"></i>
                  </div>
                  <div class="mt-3 rounded-full bg-black/60 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-xs">
                    {{ isVideoPlaying ? 'Pausar video' : 'Reproducir ' + currentStep.title }}
                  </div>
                </div>

                <!-- Bottom Timeline Controls Bar -->
                <div class="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center gap-3 text-white text-xs">
                  <button @click.stop="handleVideoTouch" class="hover:text-[#ff6a00] transition-colors cursor-pointer">
                    <i :class="['text-sm sm:text-base', isVideoPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play']"></i>
                  </button>
                  <div class="flex-1 h-1.5 bg-white/30 rounded-full overflow-hidden cursor-pointer">
                    <div :class="['h-full bg-[#ff6a00] transition-all duration-300', isVideoPlaying ? 'w-2/3' : 'w-1/4']"></div>
                  </div>
                  <span class="text-[10px] sm:text-xs font-mono text-slate-300">{{ isVideoPlaying ? '01:45' : '00:00' }} / {{ currentStep.duration }}</span>
                  <i class="fa-solid fa-volume-high text-xs cursor-pointer hover:text-slate-300"></i>
                  <i class="fa-solid fa-expand text-xs cursor-pointer hover:text-slate-300"></i>
                </div>
              </div>
            </div>

            <!-- Info Box: ¿Qué aprenderás en este video? -->
            <div class="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-4">
              <h4 class="font-serif text-sm sm:text-base font-bold text-[#023859]">
                ¿Qué aprenderás en este {{ currentStepIndex === 1 ? 'Video' : 'video' }}?
              </h4>

              <ul class="space-y-2 text-xs sm:text-sm text-slate-700">
                <li
                  v-for="(point, pIdx) in currentStep.learningPoints"
                  :key="pIdx"
                  class="flex items-start gap-2.5"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-[#023859] mt-2 shrink-0"></span>
                  <span class="leading-relaxed">{{ point }}</span>
                </li>
              </ul>
            </div>

            <!-- Bottom Navigation Bar inside Canvas -->
            <div class="flex items-center justify-between w-full pt-1">
              <!-- Back Button (hidden on step 0) -->
              <div>
                <button
                  v-if="currentStepIndex > 0"
                  type="button"
                  @click="handlePrev"
                  class="rounded-xl border border-slate-300 bg-white px-5 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-2xs inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <i class="fa-solid fa-arrow-left text-xs"></i>
                  <span>Atrás</span>
                </button>
              </div>

              <!-- Next Button -->
              <div>
                <button
                  type="button"
                  @click="handleNext"
                  class="rounded-xl border border-slate-300 bg-white px-5 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-2xs inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <span>{{ currentStepIndex === activeSteps.length - 1 ? 'Finalizar' : 'Siguiente' }}</span>
                  <i class="fa-solid fa-arrow-right text-xs"></i>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  </section>
</template>
