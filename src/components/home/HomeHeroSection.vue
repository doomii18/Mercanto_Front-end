<script setup lang="ts">
</script>

<template>
  <section id="inicio" class="mx-auto relative flex h-full w-full max-w-300 flex-col-reverse items-center justify-between gap-8 px-4 py-16 text-center md:flex-row md:text-left md:p-8 lg:px-6">
    <div class="relative flex-[1.1] max-w-150">
      <h1 class="mb-5 font-serif text-[1.8rem] font-bold leading-tight text-(--primary-blue) md:text-[2.6rem] lg:text-[3.2rem]">
        Encuentra los<br />mejores<br />
        <span class="text-(--primary-orange)">distribuidores<br />mayoristas</span><br />
        para tu negocio
      </h1>

      <p class="mb-8 text-[1.05rem] leading-relaxed text-neutral-600">
        Compra al por mayor de manera fácil, segura y confiable.<br />
        Conecta con proveedores verificados y haz crecer tu negocio hoy.
      </p>

      <div class="flex flex-col items-center gap-2 rounded-2xl border border-(--border-gray) bg-white p-3 shadow-[0_4px_15px_rgba(0,0,0,0.05)] md:flex-row md:rounded-full md:p-1.5 md:pl-5">
        <div class="flex w-full flex-1 items-center px-2 md:px-0">
          <i class="fa-solid fa-magnifying-glass mr-3 text-neutral-400"></i>
          <input
            type="text"
            placeholder="¿Qué producto estás buscando?"
            class="w-full flex-1 border-none bg-transparent text-[0.95rem] text-(--text-dark) outline-none"
          />
        </div>
        <button class="flex w-full items-center justify-center rounded-xl bg-(--primary-orange) px-5.5 py-2.5 text-[0.95rem] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-(--primary-orange-hover) md:w-auto md:rounded-full">
          Buscar productos
        </button>
      </div>
    </div>

    <div class="relative flex flex-[0.9] justify-center">
      <div class="absolute -top-4 right-2.5 z-10 flex items-center gap-1.5 rounded-full bg-(--light-teal) px-4 py-2 text-[0.82rem] font-bold text-(--primary-blue)">
        <i class="fa-solid fa-bag-shopping"></i> Plataforma de comercio #1 en Nicaragua
      </div>
      <img
        src="@/assets/hero.png"
        alt="Distribución mayorista"
        class="h-auto max-w-full rounded-3xl object-cover"
      />
    </div>
  </section>
</template>
