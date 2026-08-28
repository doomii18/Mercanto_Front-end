<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { QuoteAggregateResponse, QuoteStatus } from "../../api/services/quote/types";

import { organizationApi } from "../../api";
import type { OrganizationResponse } from "../../api/services/organization/types";

const props = defineProps<{
  quoteAggregate: QuoteAggregateResponse;
}>();

const emit = defineEmits<{
  (e: "select", quoteId: string): void;
}>();

// Module-level memoization cache for provider metadata across cards
const providerCache = new Map<string, Promise<OrganizationResponse>>();

const provider = ref<OrganizationResponse | null>(null);
const isLoadingProvider = ref(false);

const quote = computed(() => props.quoteAggregate.quote);
const items = computed(() => props.quoteAggregate.items);

const totalUnits = computed(() => {
  return items.value.reduce((acc, item) => acc + item.quantity, 0);
});

const calculatedTotal = computed(() => {
  return items.value.reduce(
    (acc, item) => acc + item.quantity * item.unit_price_snapshot,
    0
  );
});

const formattedCode = computed(() => {
  return `MC-${quote.value.id.slice(0, 8).toUpperCase()}`;
});

const formattedDate = computed(() => {
  if (!quote.value.updated_at) return "—";
  return new Date(quote.value.updated_at).toLocaleDateString("es-NI", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

const formatCurrency = (amount: number) => {
  return `C$ ${amount.toLocaleString("es-NI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const statusConfig = computed(() => {
  const status = quote.value.status as QuoteStatus;
  const configs: Record<QuoteStatus, { label: string; class: string; icon: string }> = {
    draft: { label: "Borrador", class: "status-draft", icon: "fa-regular fa-file-lines" },
    pending_provider: { label: "Pendiente", class: "status-pending", icon: "fa-regular fa-clock" },
    accepted: { label: "Aceptado", class: "status-accepted", icon: "fa-solid fa-circle-check" },
    paid: { label: "Pagado", class: "status-paid", icon: "fa-solid fa-receipt" },
    fulfilled: { label: "Recibido", class: "status-fulfilled", icon: "fa-solid fa-box-open" },
    rejected: { label: "Rechazado", class: "status-rejected", icon: "fa-solid fa-circle-xmark" },
    cancelled: { label: "Cancelado", class: "status-cancelled", icon: "fa-solid fa-ban" },
  };

  return configs[status] || { label: status, class: "status-draft", icon: "fa-solid fa-circle-info" };
});

const loadProviderMetadata = async () => {
  const providerId = quote.value.provider_id;
  if (!providerId) return;

  isLoadingProvider.value = true;
  try {
    if (!providerCache.has(providerId)) {
      providerCache.set(providerId, organizationApi.getOrganization(providerId));
    }
    provider.value = await providerCache.get(providerId)!;
  } catch (err) {
    console.error(`Failed to load provider metadata for ${providerId}:`, err);
  } finally {
    isLoadingProvider.value = false;
  }
};

onMounted(() => {
  loadProviderMetadata();
});
</script>

<template>
  <div class="quote-card">
    <div class="quote-details">
      <h4>Pedido #{{ formattedCode }}</h4>
      <p class="quote-date">{{ formattedDate }}</p>
      <p class="quote-total-label">Total</p>
      <h3 class="quote-amount">{{ formatCurrency(calculatedTotal) }}</h3>
      <p class="quote-count">
        {{ totalUnits }} {{ totalUnits === 1 ? 'producto' : 'productos' }}
      </p>
    </div>

    <div class="quote-provider">
      <div class="provider-info-left">
        <div class="provider-avatar">
          <i v-if="isLoadingProvider" class="fa-solid fa-spinner fa-spin"></i>
          <span v-else>{{ provider?.company_name?.charAt(0).toUpperCase() || 'P' }}</span>
        </div>
        <div class="provider-meta">
          <p class="provider-name">{{ provider?.company_name || 'Cargando proveedor...' }}</p>
          <span class="provider-kind">{{ provider?.kind || 'Proveedor' }}</span>
        </div>
      </div>

      <div class="quote-items-preview">
        <div
          v-for="item in items.slice(0, 2)"
          :key="item.product_id"
          class="item-pill"
          :title="item.product_title_snapshot"
        >
          <i class="fa-solid fa-box"></i>
          <span class="item-title">{{ item.product_title_snapshot }}</span>
          <span class="item-qty">x{{ item.quantity }}</span>
        </div>
        <div v-if="items.length > 2" class="more-items-pill">
          +{{ items.length - 2 }} más
        </div>
      </div>
    </div>

    <div class="quote-status-action">
      <div :class="['status-badge', statusConfig.class]">
        <i :class="statusConfig.icon"></i>
        <span>{{ statusConfig.label }}</span>
      </div>
      <button
        type="button"
        class="btn-outline-teal"
        @click="emit('select', quote.id)"
      >
        Ver detalles
      </button>
    </div>
  </div>
</template>

<style scoped>
.quote-card {
  background-color: #ffffff;
  border: 1.5px solid var(--border-gray, #e0e0e0);
  border-radius: 16px;
  padding: 1.5rem 2rem;
  display: grid;
  grid-template-columns: 1.2fr 2.2fr 1fr;
  align-items: center;
  gap: 1.5rem;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.quote-card:hover {
  border-color: var(--light-teal, #189c94);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
}

.quote-details h4 {
  color: var(--primary-blue, #083c5a);
  font-size: 1.1rem;
  margin-bottom: 0.3rem;
  font-family: 'Lora', serif;
}

.quote-date {
  color: #94a3b8;
  font-size: 0.85rem;
  margin-bottom: 0.8rem;
}

.quote-total-label {
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 500;
}

.quote-amount {
  color: var(--primary-orange, #ff6a00);
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.3rem;
}

.quote-count {
  color: #64748b;
  font-size: 0.85rem;
}

.quote-provider {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0 1.5rem;
  border-left: 1px solid var(--border-gray, #e0e0e0);
  border-right: 1px solid var(--border-gray, #e0e0e0);
}

.provider-info-left {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.provider-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #e2f4f2;
  color: var(--light-teal, #189c94);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
}

.provider-name {
  font-weight: 700;
  color: var(--primary-blue, #083c5a);
  font-size: 0.95rem;
}

.provider-kind {
  font-size: 0.78rem;
  color: #64748b;
  text-transform: capitalize;
}

.quote-items-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.item-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--bg-gray, #f5f7f9);
  padding: 0.3rem 0.65rem;
  border-radius: 8px;
  font-size: 0.8rem;
  color: var(--primary-blue, #083c5a);
  max-width: 180px;
}

.item-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-qty {
  font-weight: 700;
  color: var(--light-teal, #189c94);
}

.more-items-pill {
  font-size: 0.78rem;
  color: #64748b;
  display: flex;
  align-items: center;
}

.quote-status-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.status-badge {
  padding: 0.45rem 1.2rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.88rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.status-draft { background-color: #f1f5f9; color: #475569; }
.status-pending { background-color: #fff7ed; color: #ea580c; }
.status-accepted { background-color: #eff6ff; color: #2563eb; }
.status-paid { background-color: #f0fdf4; color: #16a34a; }
.status-fulfilled { background-color: #d8f1ef; color: #00a896; }
.status-rejected { background-color: #fef2f2; color: #dc2626; }
.status-cancelled { background-color: #f3f4f6; color: #6b7280; }

.btn-outline-teal {
  background-color: transparent;
  color: var(--light-teal, #189c94);
  border: 1.5px solid var(--light-teal, #189c94);
  padding: 0.45rem 1.3rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-outline-teal:hover {
  background-color: var(--light-teal, #189c94);
  color: #ffffff;
}

@media (max-width: 900px) {
  .quote-card {
    grid-template-columns: 1fr;
  }
  .quote-provider {
    border-left: none;
    border-right: none;
    border-top: 1px solid var(--border-gray);
    border-bottom: 1px solid var(--border-gray);
    padding: 1rem 0;
  }
}
</style>
