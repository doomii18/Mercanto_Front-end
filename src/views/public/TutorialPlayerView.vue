<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppLogo from "@/components/common/AppLogo.vue";
import { buyerSteps, providerSteps, type TutorialTrack, type TutorialStep } from "@/data/tutorials";

const route = useRoute();
const router = useRouter();

const STORAGE_KEY = "mercanto.tutorials.completed";

const activeTrack = ref<TutorialTrack>("compradores");
const currentStepIndex = ref(0);
const completedStepIndexes = ref<number[]>([0]);
const isVideoPlaying = ref(false);

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        completedStepIndexes.value = data;
      }
    }
  } catch (e) {
    console.warn("Could not load tutorial progress from localStorage", e);
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completedStepIndexes.value));
  } catch (e) {
    console.warn("Could not save tutorial progress to localStorage", e);
  }
}

const activeSteps = computed<TutorialStep[]>(() => {
  return activeTrack.value === "compradores" ? buyerSteps : providerSteps;
});

const currentStep = computed<TutorialStep>(() => {
  return activeSteps.value[currentStepIndex.value] || activeSteps.value[0];
});

function syncFromRoute() {
  const queryTrack = route.query.track as string;
  if (queryTrack === "proveedores" || queryTrack === "compradores") {
    activeTrack.value = queryTrack;
  }

  const queryStep = parseInt(route.query.step as string, 10);
  if (!isNaN(queryStep) && queryStep >= 0 && queryStep < activeSteps.value.length) {
    currentStepIndex.value = queryStep;
  }
}

function updateRoute() {
  router.replace({
    name: "how-it-works-tutorial",
    query: {
      ...route.query,
      track: activeTrack.value,
      step: currentStepIndex.value.toString(),
    },
  });
}

function setTrack(track: TutorialTrack) {
  if (activeTrack.value !== track) {
    activeTrack.value = track;
    currentStepIndex.value = 0;
    isVideoPlaying.value = false;
    updateRoute();
  }
}

function markAsWatched(index = currentStepIndex.value) {
  if (!completedStepIndexes.value.includes(index)) {
    completedStepIndexes.value.push(index);
    saveProgress();
  }
}

function handleVideoTouch() {
  markAsWatched(currentStepIndex.value);
  isVideoPlaying.value = !isVideoPlaying.value;
}

function closePlayer() {
  isVideoPlaying.value = false;
  router.push({ name: "how-it-works" });
}

function handleFinish() {
  isVideoPlaying.value = false;
  router.push({ name: "home" });
}

function handleNext() {
  markAsWatched(currentStepIndex.value);
  if (currentStepIndex.value < activeSteps.value.length - 1) {
    currentStepIndex.value++;
    isVideoPlaying.value = false;
    updateRoute();
  } else {
    handleFinish();
  }
}

function handlePrev() {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--;
    isVideoPlaying.value = false;
    updateRoute();
  }
}

function selectStep(index: number) {
  currentStepIndex.value = index;
  isVideoPlaying.value = false;
  updateRoute();
}

onMounted(() => {
  loadProgress();
  syncFromRoute();
});

watch(
  () => [route.query.track, route.query.step],
  () => {
    syncFromRoute();
  }
);
</script>

<template>
  <div class="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden select-none">
    <!-- Top Header Bar -->
    <header class="h-16 sm:h-20 shrink-0 border-b border-slate-200 bg-white px-4 sm:px-8 flex items-center justify-between z-20">
      <!-- Close Button -->
      <button
        type="button"
        @click="closePlayer"
        title="Volver a capacitaciones"
        class="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-secondary hover:bg-(--primary-orange-hover) flex items-center justify-center text-white transition-all shadow-sm active:scale-95 cursor-pointer"
      >
        <i class="fa-solid fa-xmark text-lg sm:text-xl"></i>
      </button>

      <!-- Center: Track Switcher -->
      <div class="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
        <button
          type="button"
          @click="setTrack('compradores')"
          :class="[
            'rounded-lg px-3 py-1.5 transition-colors cursor-pointer',
            activeTrack === 'compradores' ? 'bg-secondary text-white shadow-xs' : 'hover:text-slate-900',
          ]"
        >
          <i class="fa-solid fa-bag-shopping mr-1.5 hidden sm:inline"></i>
          <span>Compradores</span>
        </button>
        <button
          type="button"
          @click="setTrack('proveedores')"
          :class="[
            'rounded-lg px-3 py-1.5 transition-colors cursor-pointer',
            activeTrack === 'proveedores' ? 'bg-accent text-white shadow-xs' : 'hover:text-slate-900',
          ]"
        >
          <i class="fa-solid fa-store mr-1.5 hidden sm:inline"></i>
          <span>Proveedores</span>
        </button>
      </div>

      <!-- Mercanto Logo -->
      <div>
        <AppLogo variant="logo" class="h-9 sm:h-11 cursor-pointer" @click="closePlayer" />
      </div>
    </header>

    <!-- Main Body Container: Left Sidebar + Right Content Area -->
    <div class="flex-1 flex flex-col lg:flex-row overflow-hidden">
      <!-- ── Left Sidebar (Steps List) ─────────────────────────────────── -->
      <aside class="w-full lg:w-[320px] xl:w-[360px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white p-4 sm:p-6 flex flex-col justify-between overflow-y-auto max-h-[35vh] lg:max-h-full">
        <!-- Steps List -->
        <div class="space-y-2">
          <div
            v-for="(step, idx) in activeSteps"
            :key="step.id"
            @click="selectStep(idx)"
            :class="[
              'w-full rounded-2xl p-3.5 sm:p-4 text-left transition-all cursor-pointer flex items-center justify-between group',
              currentStepIndex === idx
                ? 'bg-orange-50 text-primary'
                : 'bg-transparent hover:bg-slate-50 text-slate-700',
            ]"
          >
            <div class="space-y-0.5 min-w-0 pr-2 flex-1">
              <div class="flex items-center gap-2">
                <p
                  :class="[
                    'text-xs sm:text-sm font-semibold truncate',
                    currentStepIndex === idx ? 'text-primary font-bold' : 'text-slate-800',
                  ]"
                >
                  {{ step.title }}
                </p>
                <!-- Completed checkmark icon in teal circle right next to title -->
                <div
                  v-if="completedStepIndexes.includes(idx)"
                  class="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-accent text-white text-[9px] shadow-2xs"
                  title="Video visto"
                >
                  <i class="fa-solid fa-check"></i>
                </div>
              </div>
              <p class="text-[11px] text-slate-400 font-normal">
                {{ step.subtitle }} • {{ step.duration }}
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

          <!-- Video Player Card: Video real de YouTube (si el paso tiene videoUrl) -->
          <div
            v-if="currentStep.videoUrl"
            :key="currentStep.id"
            class="relative w-full rounded-2xl sm:rounded-[24px] overflow-hidden bg-slate-950 shadow-md border border-slate-200"
          >
            <div class="relative w-full aspect-video bg-black">
              <iframe
                class="absolute inset-0 h-full w-full"
                :src="currentStep.videoUrl"
                :title="currentStep.title"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen
              ></iframe>
            </div>
          </div>

          <!-- Video Player Card Container with User-Uploaded Portada (placeholder para pasos sin video) -->
          <div
            v-else
            @click="handleVideoTouch"
            class="relative w-full rounded-2xl sm:rounded-[24px] overflow-hidden bg-slate-950 shadow-md border border-slate-200 cursor-pointer group select-none"
          >
            <!-- Video Cover Image -->
            <div class="relative w-full aspect-[16/9] sm:aspect-[16/8.5] flex items-center justify-center overflow-hidden bg-primary">
              <img
                src="@/assets/video-portada-mercanto.png"
                :alt="currentStep.title"
                class="w-full h-full object-cover sm:object-contain"
              />

              <!-- Play / Pause Overlay Center Indicator -->
              <div class="absolute inset-0 flex flex-col items-center justify-center bg-black/10 group-hover:bg-black/25 transition-colors p-4">
                <div
                  class="flex h-14 w-14 sm:h-18 sm:w-18 items-center justify-center rounded-full bg-secondary text-white shadow-2xl group-hover:scale-110 active:scale-95 transition-all"
                >
                  <i :class="['text-xl sm:text-2xl ml-1', isVideoPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play']"></i>
                </div>
                <div class="mt-3 rounded-full bg-black/60 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-xs">
                  {{ isVideoPlaying ? 'Pausar video' : 'Reproducir ' + currentStep.title }}
                </div>
              </div>

              <!-- Bottom Timeline Controls Bar -->
              <div class="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center gap-3 text-white text-xs">
                <button @click.stop="handleVideoTouch" class="hover:text-secondary transition-colors cursor-pointer">
                  <i :class="['text-sm sm:text-base', isVideoPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play']"></i>
                </button>
                <div class="flex-1 h-1.5 bg-white/30 rounded-full overflow-hidden cursor-pointer">
                  <div :class="['h-full bg-secondary transition-all duration-300', isVideoPlaying ? 'w-2/3' : 'w-1/4']"></div>
                </div>
                <span class="text-[10px] sm:text-xs font-mono text-slate-300">{{ isVideoPlaying ? '01:45' : '00:00' }} / {{ currentStep.duration }}</span>
                <i class="fa-solid fa-volume-high text-xs cursor-pointer hover:text-slate-300"></i>
                <i class="fa-solid fa-expand text-xs cursor-pointer hover:text-slate-300"></i>
              </div>
            </div>
          </div>

          <!-- Info Box: ¿Qué aprenderás en este video? -->
          <div class="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-4">
            <h4 class="font-serif text-sm sm:text-base font-bold text-primary">
              ¿Qué aprenderás en este {{ currentStepIndex === 1 ? 'Video' : 'video' }}?
            </h4>

            <ul class="space-y-2 text-xs sm:text-sm text-slate-700">
              <li
                v-for="(point, pIdx) in currentStep.learningPoints"
                :key="pIdx"
                class="flex items-start gap-2.5"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0"></span>
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
</template>
