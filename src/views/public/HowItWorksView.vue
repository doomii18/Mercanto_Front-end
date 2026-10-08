<script setup lang="ts">
import { useRouter } from "vue-router";
import { buyerSteps, providerSteps, type TutorialTrack } from "@/data/tutorials";

const router = useRouter();

function openTutorial(track: TutorialTrack = "compradores", stepIdx = 0) {
  router.push({
    name: "how-it-works-tutorial",
    query: {
      track,
      step: stepIdx.toString(),
    },
  });
}
</script>

<template>
  <div class="w-full min-h-screen py-8 sm:py-12">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-14 lg:space-y-20">
      <!-- ================================================================= -->
      <!-- 1. HERO BANNER: Centro de Capacitación / ¿Cómo Funciona Mercanto?  -->
      <!-- ================================================================= -->
      <section
        class="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#8ce9e4] via-[#fff] to-[#8ce9e4] p-6 sm:p-10 lg:p-14 shadow-xs"
      >
        <!-- Decorative background shapes matching mockup -->
        <div class="absolute -right-20 -bottom-24 w-96 h-96 rounded-full bg-[#ff6a00] opacity-95 pointer-events-none"></div>
        <div class="absolute right-32 -bottom-20 w-80 h-80 rounded-full bg-[#00a896] opacity-90 pointer-events-none"></div>

        <div class="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <!-- Left Column: Text & CTA -->
          <div class="lg:col-span-7 space-y-5 text-left">
            <!-- Badge -->
            <div class="inline-flex items-center gap-2 rounded-lg bg-[#8ce9e4]/30 border border-[#8ce9e4]/70 px-3.5 py-1.5 text-xs font-bold text-[#023859]">
              <i class="fa-solid fa-book-open text-[#00a99c]"></i>
              <span>Centro de Capacitación</span>
            </div>

            <!-- Title -->
            <h1 class="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-[#023859] leading-[1.15]">
              ¿Cómo Funciona<br />
              <span class="text-[#ff6a00]">Mer</span>canto?
            </h1>

            <!-- Description -->
            <p class="text-xs sm:text-sm md:text-base text-slate-700 leading-relaxed max-w-xl">
              Aprende a utilizar nuestra plataforma de comercio Mercanto. Aquí podrás encontrar vídeos y guías que te ayudarán paso a paso cómo registrarte, buscar productos, comprar, vender y conectar con proveedores de todos los departamentos del país.
            </p>

            <!-- Button CTA -->
            <div class="pt-1">
              <button
                type="button"
                @click="openTutorial('compradores', 0)"
                class="inline-flex items-center gap-2.5 rounded-full bg-[#ff6a00] hover:bg-[#e65f00] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <span class="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#ff6a00] text-[10px]">
                  <i class="fa-solid fa-play ml-0.5"></i>
                </span>
                <span>Ver video introductorio</span>
              </button>
            </div>
          </div>

          <!-- Right Column: Laptop Mockup -->
          <div class="lg:col-span-5 flex justify-center lg:justify-end">
            <div
              @click="openTutorial('compradores', 0)"
              class="relative w-full max-w-[280px] sm:max-w-[350px] md:max-w-[390px] lg:max-w-[430px] group cursor-pointer transition-transform hover:scale-[1.02]"
              title="Reproducir video introductorio"
            >
              <img
                src="@/assets/laptop-mercanto.png"
                alt="Video introductorio Mercanto"
                class="w-full h-auto object-contain drop-shadow-2xl"
              />
              <!-- Play Button Overlay on Laptop Screen -->
              <div class="absolute inset-0 flex items-center justify-center -translate-y-3 sm:-translate-y-4 md:-translate-y-5">
                <div class="flex h-11 w-11 sm:h-13 sm:w-13 md:h-14 md:w-14 items-center justify-center rounded-full bg-[#ff6a00] text-white shadow-2xl group-hover:scale-110 active:scale-95 transition-all">
                  <i class="fa-solid fa-play text-xs sm:text-base ml-0.5"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- 2. ¿Qué es Mercanto?                                              -->
      <!-- ================================================================= -->
      <section class="space-y-4 text-left max-w-5xl">
        <h2 class="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-primary">
          ¿Qué es <span class="text-secondary">Mer</span>canto?
        </h2>
        <p class="text-xs sm:text-sm md:text-base text-slate-700 leading-relaxed">
          Mercanto es una plataforma de comercio web que conecta importadores y distribuidores mayoristas con emprendedores, micro, pequeñas y medianas empresas de Nicaragua, facilitando la compra de productos al por mayor mediante un sistema seguro, accesible y eficiente que reduzca las barreras geográficas, los costos de desplazamiento, la pérdida de tiempo y los riesgos asociados al abastecimiento presencial.
        </p>
      </section>

      <!-- ================================================================= -->
      <!-- 3. ¿Qué puedes hacer en la Plataforma?                            -->
      <!-- ================================================================= -->
      <section class="space-y-8 text-left">
        <h2 class="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-primary">
          ¿Qué puedes hacer en la Plataforma?
        </h2>

        <!-- 3 Feature Cards with Arch Images -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <!-- Card 1: Explora Productos -->
          <router-link
            :to="{ name: 'products' }"
            class="rounded-[32px] border-2 border-[#eddcd2] bg-white p-5 pb-8 flex flex-col items-center text-center shadow-xs hover:shadow-md hover:-translate-y-1 transition-all group"
          >
            <div class="w-full aspect-[4/3] rounded-t-[26px] rounded-b-lg overflow-hidden bg-slate-100 mb-4">
              <img
                src="@/assets/explora-productos.jpg"
                alt="Explora Productos"
                class="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h3 class="font-serif text-base sm:text-lg font-bold text-primary group-hover:text-accent transition-colors">
              Explora Productos
            </h3>
            <p class="text-xs text-slate-500 mt-2 max-w-[220px] leading-relaxed">
              Explora miles de productos al por mayor de proveedores verificados.
            </p>
          </router-link>

          <!-- Card 2: Encuentra Proveedores -->
          <router-link
            :to="{ name: 'providers' }"
            class="rounded-[32px] border-2 border-[#eddcd2] bg-white p-5 pb-8 flex flex-col items-center text-center shadow-xs hover:shadow-md hover:-translate-y-1 transition-all group"
          >
            <div class="w-full aspect-[4/3] rounded-t-[26px] rounded-b-lg overflow-hidden bg-slate-100 mb-4">
              <img
                src="@/assets/encuentra-proveedores.png"
                alt="Encuentra Proveedores"
                class="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h3 class="font-serif text-base sm:text-lg font-bold text-primary group-hover:text-accent transition-colors">
              Encuentra Proveedores
            </h3>
            <p class="text-xs text-slate-500 mt-2 max-w-[220px] leading-relaxed">
              Revisa calificaciones, precios y plazos de entrega en cada proveedor.
            </p>
          </router-link>

          <!-- Card 3: Realiza tus Pedidos -->
          <router-link
            :to="{ name: 'register' }"
            class="rounded-[32px] border-2 border-[#eddcd2] bg-white p-5 pb-8 flex flex-col items-center text-center shadow-xs hover:shadow-md hover:-translate-y-1 transition-all group"
          >
            <div class="w-full aspect-[4/3] rounded-t-[26px] rounded-b-lg overflow-hidden bg-slate-100 mb-4">
              <img
                src="@/assets/realiza-pedidos.png"
                alt="Realiza tus Pedidos"
                class="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h3 class="font-serif text-base sm:text-lg font-bold text-primary group-hover:text-accent transition-colors">
              Realiza tus Pedidos
            </h3>
            <p class="text-xs text-slate-500 mt-2 max-w-[220px] leading-relaxed">
              Haz pedidos al por mayor de forma rápida y transparente para tu negocio.
            </p>
          </router-link>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- 4. Aprende Paso a Paso - Compradores                              -->
      <!-- ================================================================= -->
      <section class="space-y-6 text-left">
        <!-- Section Header -->
        <div class="space-y-1">
          <div class="flex items-center gap-3">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white text-sm shadow-xs">
              <i class="fa-solid fa-play ml-0.5"></i>
            </div>
            <h2 class="font-serif text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-primary">
              Aprende Paso a Paso - <span class="text-secondary">Compradores</span>
            </h2>
          </div>
          <p class="text-xs sm:text-sm text-slate-500 pl-12">
            Mira los videos tutoriales para conocer las funciones de la plataforma.
          </p>
        </div>

        <!-- 6 Tutorial Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            v-for="(step, idx) in buyerSteps"
            :key="step.id"
            @click="openTutorial('compradores', idx)"
            class="group rounded-xl border border-slate-300 bg-white p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <!-- Video Thumbnail Frame matching Mockup -->
            <div class="w-full aspect-[16/9] rounded-lg bg-[#fdf1e8] flex items-center justify-center relative overflow-hidden group-hover:bg-[#fedec7] transition-colors">
              <div class="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white shadow-md group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-play text-sm ml-0.5"></i>
              </div>
            </div>

            <!-- Video Text Info -->
            <div class="pt-3.5 space-y-1">
              <h3 class="text-xs sm:text-sm font-bold text-primary group-hover:text-accent transition-colors leading-snug">
                {{ step.cardTitle }}
              </h3>
              <p class="text-[11px] text-slate-500 leading-relaxed">
                {{ step.cardDescription }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- 5. Aprende Paso a Paso - Proveedores                              -->
      <!-- ================================================================= -->
      <section class="space-y-6 text-left">
        <!-- Section Header -->
        <div class="space-y-1">
          <div class="flex items-center gap-3">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white text-sm shadow-xs">
              <i class="fa-solid fa-play ml-0.5"></i>
            </div>
            <h2 class="font-serif text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-primary">
              Aprende Paso a Paso - <span class="text-secondary">Proveedores</span>
            </h2>
          </div>
          <p class="text-xs sm:text-sm text-slate-500 pl-12">
            Mira los videos tutoriales para conocer las funciones de la plataforma.
          </p>
        </div>

        <!-- 6 Tutorial Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            v-for="(step, idx) in providerSteps"
            :key="step.id"
            @click="openTutorial('proveedores', idx)"
            class="group rounded-xl border border-slate-300 bg-white p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <!-- Video Thumbnail Frame matching Mockup -->
            <div class="w-full aspect-[16/9] rounded-lg bg-[#fdf1e8] flex items-center justify-center relative overflow-hidden group-hover:bg-[#fedec7] transition-colors">
              <div class="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white shadow-md group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-play text-sm ml-0.5"></i>
              </div>
            </div>

            <!-- Video Text Info -->
            <div class="pt-3.5 space-y-1">
              <h3 class="text-xs sm:text-sm font-bold text-primary group-hover:text-accent transition-colors leading-snug">
                {{ step.cardTitle }}
              </h3>
              <p class="text-[11px] text-slate-500 leading-relaxed">
                {{ step.cardDescription }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
