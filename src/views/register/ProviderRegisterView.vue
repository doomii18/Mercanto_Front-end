<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const isStep1 = computed(() => route.name === "provider-step-1");
const isStep2 = computed(() => route.name === "provider-step-2");
const isStep3 = computed(() => route.name === "provider-step-3");
</script>

<template>
  <div class="provider-register-page">
    <main class="wizard-container">
      <div class="wizard-header">
        <h1>Registro de Proveedor</h1>
        <p>
          Completa la información requerida para crear una cuenta de proveedor
          en la plataforma.
        </p>
      </div>

      <!-- Stepper Indicator -->
      <div class="stepper">
        <div
          :class="[
            'step',
            {
              active: isStep1,
              completed: isStep2 || isStep3,
            },
          ]"
        >
          <div class="step-circle">1</div>
          <span class="step-label">Información del Negocio</span>
        </div>
        <div :class="['step-line', { active: isStep2 || isStep3 }]"></div>

        <div
          :class="[
            'step',
            {
              active: isStep2,
              completed: isStep3,
            },
          ]"
        >
          <div class="step-circle">2</div>
          <span class="step-label">Información del Propietario</span>
        </div>
        <div :class="['step-line', { active: isStep3 }]"></div>

        <div
          :class="[
            'step',
            {
              active: isStep3,
              completed: isStep3,
            },
          ]"
        >
          <div class="step-circle">3</div>
          <span class="step-label">Revisión y Envío</span>
        </div>
      </div>

      <!-- Nested Step View -->
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.provider-register-page {
  min-height: 100%;
  background-color: #ffffff;
  color: var(--primary-blue);
  padding-bottom: 4rem;
}

.wizard-container {
  max-width: 1050px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
}

.wizard-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.wizard-header h1 {
  font-size: 2.2rem;
  color: var(--primary-blue);
  margin-bottom: 0.4rem;
}

.wizard-header p {
  color: #64748b;
  font-size: 1rem;
}

.stepper {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 2.5rem;
}

.step {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  opacity: 0.45;
  transition: opacity 0.2s ease;
}

.step.active,
.step.completed {
  opacity: 1;
}

.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #94a3b8;
  color: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 700;
  font-size: 0.9rem;
}

.step.active .step-circle {
  background-color: var(--primary-orange);
}

.step.completed .step-circle {
  background-color: var(--light-teal);
}

.step-label {
  font-weight: 600;
  font-size: 0.92rem;
  color: var(--primary-blue);
}

.step-line {
  flex: 1;
  max-width: 90px;
  height: 2px;
  background-color: var(--border-gray);
  margin: 0 1rem;
}

.step-line.active {
  background-color: var(--light-teal);
}

@media (max-width: 900px) {
  .stepper {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  .step-line {
    display: none;
  }
}
</style>
