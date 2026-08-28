<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { QuoteAggregateResponse, QuoteStatus } from "../../api/services/quote/types";
import { organizationApi, productApi } from "../../api";
import type { PublicProviderDto } from "../../api/services/organization/types";
import ProductImage from "../product/ProductImage.vue";
import ProviderLogo from "../organization/ProviderLogo.vue";
import QuoteIdBadge from "./QuoteIdBadge.vue";
import QuoteStatusBadge from "./QuoteStatusBadge.vue";

const props = defineProps<{
  quoteAggregate: QuoteAggregateResponse;
}>();

const emit = defineEmits<{
  (e: "select", quoteId: string): void;
}>();

const providerCache = new Map<string, Promise<PublicProviderDto>>();
const productBlobCache = new Map<string, Promise<string | null>>();

const provider = ref<PublicProviderDto | null>(null);
const itemBlobIds = ref<Record<string, string | null>>({});

const quote = computed(() => props.quoteAggregate.quote);
const items = computed(() => props.quoteAggregate.items);

const previewItems = computed(() => items.value.slice(0, 2));
const remainingCount = computed(() => Math.max(0, items.value.length - 2));

const totalUnits = computed(() => {
  return items.value.reduce((acc, item) => acc + item.quantity, 0);
});

const calculatedTotal = computed(() => {
  return items.value.reduce(
    (acc, item) => acc + item.quantity * item.unit_price_snapshot,
    0
  );
});

const formattedDate = computed(() => {
  if (!quote.value.updated_at) return "—";
  return new Date(quote.value.updated_at).toLocaleDateString("es-NI", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

const statusDateLabel = computed(() => {
  if (!quote.value.updated_at) return "";
  const dateStr = new Date(quote.value.updated_at).toLocaleDateString("es-NI", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const status = quote.value.status as QuoteStatus;
  if (status === "fulfilled") return `Recibido el ${dateStr}`;
  if (status === "accepted" || status === "paid") return `En proceso desde ${dateStr}`;
  return `Actualizado el ${dateStr}`;
});

const formatCurrency = (amount: number) => {
  return `C$ ${amount.toLocaleString("es-NI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const loadProductBlobId = async (productId: string): Promise<string | null> => {
  if (productBlobCache.has(productId)) {
    return productBlobCache.get(productId)!;
  }

  const promise = (async () => {
    try {
      const prod = await productApi.getProduct(productId);
      return prod.image_blob_ids?.[0] ?? null;
    } catch {
      return null;
    }
  })();

  productBlobCache.set(productId, promise);
  return promise;
};

const loadMetadata = async () => {
  const providerId = quote.value.provider_id;
  if (providerId) {
    try {
      if (!providerCache.has(providerId)) {
        providerCache.set(providerId, organizationApi.getOrganization(providerId));
      }
      provider.value = await providerCache.get(providerId)!;
    } catch (err) {
      console.error(`Failed to load provider metadata for ${providerId}:`, err);
    }
  }

  await Promise.all(
    previewItems.value.map(async (item) => {
      const blobId = await loadProductBlobId(item.product_id);
      itemBlobIds.value[item.product_id] = blobId;
    })
  );
};

onMounted(() => {
  loadMetadata();
});
</script>

<template>
  <div class="quote-card">
    <div class="quote-details">
      <div class="quote-header-row">
        <h4 class="quote-order-title">Pedido</h4>
        <QuoteIdBadge :quote-id="quote.id" size="sm" />
      </div>

      <p class="quote-date">{{ formattedDate }}</p>

      <div class="quote-total-group">
        <p class="quote-total-label">Total</p>
        <h3 class="quote-amount">{{ formatCurrency(calculatedTotal) }}</h3>
      </div>

      <p class="quote-count">
        {{ totalUnits }} {{ totalUnits === 1 ? 'producto' : 'productos' }}
      </p>
    </div>

    <div class="quote-center">
      <div class="provider-meta-group">
        <div class="provider-avatar">
          <ProviderLogo
            :blob-id="provider?.logo_blob_id"
            :alt="provider?.company_name"
            :fallback-text="provider?.company_name"
          />
        </div>
        <div class="provider-text">
          <p class="provider-name" :title="provider?.company_name">
            {{ provider?.company_name || 'Proveedor' }}
          </p>
          <a href="#" class="provider-link" @click.prevent>ver proveedor</a>
        </div>
      </div>

      <div class="products-preview-group">
        <div
          v-for="item in previewItems"
          :key="item.product_id"
          class="product-thumb-card"
          :title="item.product_title_snapshot"
        >
          <ProductImage
            :blob-id="itemBlobIds[item.product_id]"
            :alt="item.product_title_snapshot"
            fallback-icon="fa-solid fa-box"
            object-fit="contain"
          />
        </div>

        <div v-if="remainingCount > 0" class="more-products-pill">
          +{{ remainingCount }}
        </div>
      </div>
    </div>

    <div class="quote-status-action">
      <QuoteStatusBadge :status="quote.status" size="sm" />
      <p v-if="statusDateLabel" class="status-date-subtext">{{ statusDateLabel }}</p>
      <button
        type="button"
        class="btn-outline-teal"
        @click="emit('select', quote.id)"
      >
        ver detalles
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
  grid-template-columns: minmax(210px, 1.35fr) 2.1fr minmax(135px, 0.95fr);
  align-items: center;
  gap: 1.5rem;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.quote-card:hover {
  border-color: var(--light-teal, #189c94);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
}

.quote-details {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.quote-header-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
  margin-bottom: 0.25rem;
}

.quote-order-title {
  color: var(--primary-blue, #083c5a);
  font-size: 1.05rem;
  font-weight: 700;
  font-family: 'Lora', serif;
  margin: 0;
}

.quote-date {
  color: #94a3b8;
  font-size: 0.82rem;
  margin-bottom: 0.4rem;
}

.quote-total-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.15rem;
}

.quote-total-label {
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 500;
  margin: 0;
}

.quote-amount {
  color: var(--primary-blue, #083c5a);
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0.1rem 0;
}

.quote-count {
  color: #94a3b8;
  font-size: 0.8rem;
  margin: 0;
}

.quote-center {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  padding: 0 1.5rem;
  border-left: 1px solid var(--border-gray, #e0e0e0);
  border-right: 1px solid var(--border-gray, #e0e0e0);
  min-width: 0;
}

.provider-meta-group {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
  flex: 1;
}

.provider-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1.5px solid var(--border-gray, #e0e0e0);
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: var(--light-teal, #189c94);
  font-weight: 700;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.provider-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.provider-name {
  font-weight: 700;
  color: var(--primary-blue, #083c5a);
  font-size: 0.95rem;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.provider-link {
  font-size: 0.82rem;
  color: var(--light-teal, #189c94);
  text-decoration: none;
  font-weight: 500;
  margin-top: 0.1rem;
}

.provider-link:hover {
  text-decoration: underline;
}

.products-preview-group {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-shrink: 0;
}

.product-thumb-card {
  width: 52px;
  height: 52px;
  border: 1px solid var(--border-gray, #e0e0e0);
  border-radius: 8px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.more-products-pill {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--border-gray, #e0e0e0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  background: #ffffff;
}

.quote-status-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.status-date-subtext {
  font-size: 0.76rem;
  color: #94a3b8;
  margin: 0;
  text-align: center;
}

.btn-outline-teal {
  background-color: transparent;
  color: var(--light-teal, #189c94);
  border: 1.5px solid var(--light-teal, #189c94);
  padding: 0.4rem 1.4rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-outline-teal:hover {
  background-color: var(--light-teal, #189c94);
  color: #ffffff;
}

@media (max-width: 990px) {
  .quote-card {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  .quote-center {
    border-left: none;
    border-right: none;
    border-top: 1px solid var(--border-gray, #e0e0e0);
    border-bottom: 1px solid var(--border-gray, #e0e0e0);
    padding: 1rem 0;
    flex-wrap: wrap;
  }

  .quote-status-action {
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }

  .status-date-subtext {
    text-align: left;
  }
}
</style>
