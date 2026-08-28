<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { quoteApi, organizationApi, productApi, userProfileApi } from "../api";
import type { QuoteAggregateResponse, QuoteStatus } from "../api/services/quote/types";
import type { PublicProviderDto } from "../api/services/organization/types";
import type { UserProfileResponse } from "../api/services/user_profile/types";
import ProductImage from "../components/product/ProductImage.vue";
import ProviderLogo from "../components/organization/ProviderLogo.vue";
import QuoteIdBadge from "../components/quote/QuoteIdBadge.vue";

const route = useRoute();
const router = useRouter();

const quoteAggregate = ref<QuoteAggregateResponse | null>(null);
const provider = ref<PublicProviderDto | null>(null);
const buyerProfile = ref<UserProfileResponse | null>(null);
const itemBlobIds = ref<Record<string, string | null>>({});
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

const productBlobCache = new Map<string, Promise<string | null>>();

const STATUS_CONFIG: Record<QuoteStatus, { label: string; class: string; icon: string }> = {
  draft: { label: "Borrador", class: "status-draft", icon: "fa-regular fa-file-lines" },
  pending_provider: { label: "Pendiente", class: "status-pending", icon: "fa-regular fa-clock" },
  accepted: { label: "Aceptado", class: "status-accepted", icon: "fa-solid fa-circle-check" },
  paid: { label: "Pagado", class: "status-paid", icon: "fa-solid fa-receipt" },
  fulfilled: { label: "Recibido", class: "status-fulfilled", icon: "fa-regular fa-circle-check" },
  rejected: { label: "Rechazado", class: "status-rejected", icon: "fa-solid fa-circle-xmark" },
  cancelled: { label: "Cancelado", class: "status-cancelled", icon: "fa-solid fa-ban" },
};

const PAYMENT_LABELS: Record<string, string> = {
  card: "Tarjeta de crédito / débito",
  transfer: "Transferencia bancaria",
  virtual_wallet: "Billetera virtual",
};

const formatDate = (isoString?: string): string => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("es-NI", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatMoney = (val: number): string => {
  return `C$${val.toLocaleString("es-NI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const totalUnits = computed(() => {
  if (!quoteAggregate.value) return 0;
  return quoteAggregate.value.items.reduce((acc, item) => acc + item.quantity, 0);
});

const calculatedTotal = computed(() => {
  if (!quoteAggregate.value) return 0;
  return quoteAggregate.value.items.reduce(
    (acc, item) => acc + item.quantity * item.unit_price_snapshot,
    0
  );
});

const buyerFullName = computed(() => {
  if (!buyerProfile.value) return "Cliente Registrado";
  return `${buyerProfile.value.first_name || ""} ${buyerProfile.value.last_name || ""}`.trim() || "Cliente Registrado";
});

const buyerPhone = computed(() => {
  if (!buyerProfile.value) return null;
  return (buyerProfile.value as any).phone_number || null;
});

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

const loadQuoteDetails = async () => {
  const quoteId = route.params.id as string;
  if (!quoteId) {
    errorMessage.value = "Identificador de pedido inválido.";
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  errorMessage.value = null;

  try {
    const [detail, profile] = await Promise.allSettled([
      quoteApi.getQuote(quoteId),
      userProfileApi.getMyProfile(),
    ]);

    if (detail.status === "fulfilled") {
      quoteAggregate.value = detail.value;

      if (detail.value.quote.provider_id) {
        provider.value = await organizationApi.getOrganization(detail.value.quote.provider_id);
      }

      await Promise.all(
        detail.value.items.map(async (item) => {
          const blobId = await loadProductBlobId(item.product_id);
          itemBlobIds.value[item.product_id] = blobId;
        })
      );
    } else {
      throw detail.reason;
    }

    if (profile.status === "fulfilled") {
      buyerProfile.value = profile.value;
    }
  } catch (err: any) {
    console.error("Failed to load quote details:", err);
    errorMessage.value = err.message || "Error al cargar los detalles del pedido.";
  } finally {
    isLoading.value = false;
  }
};

const goBack = () => {
  router.push({ name: "orders" });
};

const handleDownloadInvoice = () => {
  alert("Descargando factura del pedido...");
};

const handleOpenChat = () => {
  alert("Redirigiendo al chat con el proveedor...");
};

onMounted(() => {
  loadQuoteDetails();
});
</script>

<template>
  <div class="quote-detail-shell">
    <div v-if="isLoading" class="loading-state">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <span>Cargando información del pedido...</span>
    </div>

    <div v-else-if="errorMessage || !quoteAggregate" class="error-state">
      <i class="fa-solid fa-circle-exclamation error-icon"></i>
      <p>{{ errorMessage || 'No se encontró el pedido solicitado.' }}</p>
      <button type="button" class="btn-outline-teal" @click="goBack">
        <i class="fa-solid fa-arrow-left"></i> Volver a Mis Pedidos
      </button>
    </div>

    <div v-else class="details-content">
      <div class="details-top-header">
        <div class="details-title-group">
          <button
            type="button"
            class="btn-back-arrow"
            aria-label="Regresar a pedidos"
            @click="goBack"
          >
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <div class="details-order-heading-wrapper">
              <span class="heading-title-text">Detalles del Pedido</span>
              <QuoteIdBadge
                :quote-id="quoteAggregate.quote.id"
                :updated-at="quoteAggregate.quote.updated_at"
                size="lg"
              />
            </div>
            <p class="details-order-subdate">
              Realizado el {{ formatDate(quoteAggregate.quote.updated_at) }}
            </p>
          </div>
        </div>

        <div :class="['status-badge', STATUS_CONFIG[quoteAggregate.quote.status as QuoteStatus]?.class || 'status-draft']">
          <i :class="STATUS_CONFIG[quoteAggregate.quote.status as QuoteStatus]?.icon || 'fa-regular fa-circle-check'"></i>
          <span>{{ STATUS_CONFIG[quoteAggregate.quote.status as QuoteStatus]?.label || quoteAggregate.quote.status }}</span>
        </div>
      </div>

      <div class="order-summary-card">
        <div class="summary-col">
          <div class="summary-col-header">
            <i class="fa-regular fa-calendar-days summary-icon"></i>
            <span>Fecha de Compra</span>
          </div>
          <strong class="summary-val">{{ formatDate(quoteAggregate.quote.updated_at) }}</strong>
        </div>

        <div class="summary-col">
          <div class="summary-col-header">
            <i class="fa-regular fa-money-bill-1 summary-icon"></i>
            <span>Total Pagado</span>
          </div>
          <strong class="summary-val">{{ formatMoney(calculatedTotal) }}</strong>
        </div>

        <div class="summary-col">
          <div class="summary-col-header">
            <i class="fa-regular fa-credit-card summary-icon"></i>
            <span>Método de Pago</span>
          </div>
          <strong class="summary-val">
            {{ PAYMENT_LABELS[quoteAggregate.quote.payment_preference] || quoteAggregate.quote.payment_preference }}
          </strong>
        </div>

        <div class="summary-col">
          <div class="summary-col-header">
            <i class="fa-solid fa-bag-shopping summary-icon"></i>
            <span>Cantidad de Productos</span>
          </div>
          <strong class="summary-val">
            {{ totalUnits }} {{ totalUnits === 1 ? 'producto' : 'productos' }}
          </strong>
        </div>
      </div>

      <div class="details-split-grid">
        <div class="details-products-box">
          <h3 class="box-inner-title">Productos ({{ quoteAggregate.items.length }})</h3>

          <div class="products-table-wrapper">
            <table class="order-products-table">
              <thead>
                <tr>
                  <th style="width: 48%;">Producto</th>
                  <th style="width: 18%;">Precio U.</th>
                  <th style="width: 16%;">Cantidad</th>
                  <th style="width: 18%; text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in quoteAggregate.items" :key="item.product_id">
                  <td class="td-product">
                    <div class="product-item-cell">
                      <div class="table-prod-img-box">
                        <ProductImage
                          :blob-id="itemBlobIds[item.product_id]"
                          :alt="item.product_title_snapshot"
                          fallback-icon="fa-solid fa-box"
                          object-fit="contain"
                        />
                      </div>
                      <span class="product-item-name">{{ item.product_title_snapshot }}</span>
                    </div>
                  </td>
                  <td class="td-price">{{ formatMoney(item.unit_price_snapshot) }}</td>
                  <td class="td-qty">Ud. {{ item.quantity }}</td>
                  <td class="td-subtotal" style="text-align: right;">
                    {{ formatMoney(item.quantity * item.unit_price_snapshot) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="quoteAggregate.quote.buyer_notes" class="buyer-notes-box">
            <strong>Notas del comprador:</strong>
            <p>{{ quoteAggregate.quote.buyer_notes }}</p>
          </div>

          <div class="table-bottom-total-row">
            <span class="total-text-label">Total</span>
            <strong class="total-text-amount">{{ formatMoney(calculatedTotal) }}</strong>
          </div>
        </div>

        <div class="details-sidebar-boxes">
          <div class="side-detail-card">
            <h4>Proveedor</h4>
            <div class="side-provider-avatar">
              <ProviderLogo
                :blob-id="provider?.logo_blob_id"
                :alt="provider?.company_name"
                :fallback-text="provider?.company_name"
              />
            </div>
            <h5>{{ provider?.company_name || 'Proveedor' }}</h5>

            <div class="provider-stars-rating">
              <i class="fa-solid fa-star star-filled"></i>
              <i class="fa-solid fa-star star-filled"></i>
              <i class="fa-solid fa-star star-filled"></i>
              <i class="fa-solid fa-star star-filled"></i>
              <i class="fa-regular fa-star star-empty"></i>
            </div>

            <button type="button" class="btn-side-action" @click.prevent>
              ver proveedor
            </button>
          </div>

          <div class="side-detail-card address-box">
            <h4>Dirección de Entrega</h4>

            <div class="address-user-line">
              <i class="fa-solid fa-location-dot map-pin-icon"></i>
              <span class="address-user-name">{{ buyerFullName }}</span>
            </div>

            <p class="address-line-text">
              {{ quoteAggregate.quote.shipping_address || 'Dirección no especificada' }}
            </p>

            <p v-if="buyerPhone" class="address-phone-text">
              Tel. {{ buyerPhone }}
            </p>
          </div>
        </div>
      </div>

      <div class="details-action-footer">
        <button
          type="button"
          class="btn-footer-pill"
          @click="handleDownloadInvoice"
        >
          <i class="fa-solid fa-arrow-down-to-bracket"></i>
          <span>Descargar factura</span>
        </button>

        <button
          type="button"
          class="btn-footer-pill right"
          @click="handleOpenChat"
        >
          <i class="fa-regular fa-comment-dots"></i>
          <span>Enviar mensaje al proveedor</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quote-detail-shell {
  display: flex;
  flex-direction: column;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  gap: 1rem;
  color: #64748b;
  font-size: 1rem;
}

.error-icon {
  font-size: 3rem;
  color: #ef4444;
}

.details-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.details-top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.details-title-group {
  display: flex;
  align-items: center;
  gap: 1.2rem;
}

.btn-back-arrow {
  background: none;
  border: none;
  font-size: 1.4rem;
  color: var(--primary-blue, #083c5a);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.details-order-heading-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.heading-title-text {
  font-size: 1.55rem;
  color: var(--primary-blue, #083c5a);
  font-weight: 700;
  font-family: 'Lora', serif;
}

.details-order-subdate {
  color: #64748b;
  font-size: 0.88rem;
  margin-top: 0.2rem;
}

.status-badge {
  padding: 0.4rem 1.2rem;
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

.order-summary-card {
  background-color: #f0faf9;
  border: 1.5px solid #a3ded8;
  border-radius: 16px;
  padding: 1.4rem 2rem;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.summary-col {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-col-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary-blue, #083c5a);
  font-size: 0.85rem;
  font-weight: 600;
}

.summary-icon {
  color: var(--primary-blue, #083c5a);
  font-size: 1rem;
}

.summary-val {
  color: var(--primary-blue, #083c5a);
  font-size: 0.95rem;
  font-weight: 700;
}

.details-split-grid {
  display: grid;
  grid-template-columns: 2.2fr 1fr;
  gap: 1.5rem;
  align-items: start;
}

.details-products-box {
  background: #ffffff;
  border: 1.5px solid var(--border-gray, #e0e0e0);
  border-radius: 16px;
  padding: 1.5rem;
}

.box-inner-title {
  font-size: 1rem;
  color: var(--primary-blue, #083c5a);
  font-weight: 700;
  margin-bottom: 1.2rem;
}

.products-table-wrapper {
  overflow-x: auto;
}

.order-products-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.order-products-table th {
  color: #777;
  font-weight: 500;
  text-align: left;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f2f2f2;
}

.order-products-table td {
  padding: 1rem 0.5rem;
  border-bottom: 1px solid #f8f8f8;
  vertical-align: middle;
}

.product-item-cell {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.table-prod-img-box {
  width: 58px;
  height: 58px;
  border: 1px solid var(--border-gray, #e0e0e0);
  border-radius: 8px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 4px;
  flex-shrink: 0;
}

.product-item-name {
  font-weight: 600;
  color: var(--primary-blue, #083c5a);
  line-height: 1.35;
  font-size: 0.88rem;
}

.td-price,
.td-qty,
.td-subtotal {
  font-weight: 600;
  color: var(--primary-blue, #083c5a);
  font-size: 0.88rem;
}

.buyer-notes-box {
  background: var(--bg-gray, #f5f7f9);
  padding: 0.8rem 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  font-size: 0.85rem;
  color: #475569;
}

.table-bottom-total-row {
  background-color: #e2f4f2;
  border-radius: 10px;
  padding: 0.85rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  color: var(--primary-blue, #083c5a);
}

.total-text-label {
  font-size: 0.95rem;
  font-weight: 600;
}

.total-text-amount {
  font-size: 1rem;
  font-weight: 700;
}

.details-sidebar-boxes {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.side-detail-card {
  background: #ffffff;
  border: 1.5px solid var(--border-gray, #e0e0e0);
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
}

.side-detail-card h4 {
  text-align: left;
  margin-bottom: 1.2rem;
  color: var(--primary-blue, #083c5a);
  font-size: 0.95rem;
  font-weight: 700;
}

.side-provider-avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: 2px solid #083c5a;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.8rem auto;
  overflow: hidden;
  padding: 4px;
}

.side-detail-card h5 {
  font-size: 0.95rem;
  color: var(--primary-blue, #083c5a);
  font-weight: 700;
  margin-bottom: 0.4rem;
}

.provider-stars-rating {
  display: flex;
  justify-content: center;
  gap: 0.25rem;
  font-size: 0.85rem;
  margin-bottom: 1.2rem;
}

.star-filled {
  color: #f59e0b;
}

.star-empty {
  color: #cbd5e1;
}

.btn-side-action {
  width: 100%;
  background: transparent;
  border: 1.5px solid var(--light-teal, #189c94);
  color: var(--light-teal, #189c94);
  padding: 0.5rem 1.2rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-side-action:hover {
  background-color: var(--light-teal, #189c94);
  color: #ffffff;
}

.address-box {
  text-align: left;
}

.address-user-line {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--primary-blue, #083c5a);
  margin-bottom: 0.6rem;
}

.map-pin-icon {
  color: var(--primary-blue, #083c5a);
  font-size: 1.1rem;
}

.address-user-name {
  font-weight: 700;
  font-size: 0.92rem;
}

.address-line-text {
  color: var(--light-teal, #189c94);
  font-size: 0.82rem;
  line-height: 1.45;
  font-weight: 500;
  margin-bottom: 0.6rem;
}

.address-phone-text {
  color: var(--light-teal, #189c94);
  font-size: 0.82rem;
  font-weight: 500;
}

.details-action-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  margin-top: 0.5rem;
}

.btn-footer-pill {
  background: transparent;
  border: 1.5px solid var(--light-teal, #189c94);
  color: var(--light-teal, #189c94);
  padding: 0.65rem 1.4rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  transition: all 0.2s ease;
}

.btn-footer-pill:hover {
  background-color: var(--light-teal, #189c94);
  color: #ffffff;
}

@media (max-width: 1024px) {
  .order-summary-card {
    grid-template-columns: repeat(2, 1fr);
  }
  .details-split-grid {
    grid-template-columns: 1fr;
  }
  .details-action-footer {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 768px) {
  .details-top-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
