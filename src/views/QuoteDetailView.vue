<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { quoteApi, organizationApi } from "../api";
import type { QuoteAggregateResponse, QuoteStatus } from "../api/services/quote/types";
import type { PublicProviderDto } from "../api/services/organization/types";

const route = useRoute();
const router = useRouter();

const quoteAggregate = ref<QuoteAggregateResponse | null>(null);
const provider = ref<PublicProviderDto | null>(null);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

const STATUS_CONFIG: Record<QuoteStatus, { label: string; class: string; icon: string }> = {
  draft: { label: "Borrador", class: "status-draft", icon: "fa-regular fa-file-lines" },
  pending_provider: { label: "Pendiente", class: "status-pending", icon: "fa-regular fa-clock" },
  accepted: { label: "Aceptado", class: "status-accepted", icon: "fa-solid fa-circle-check" },
  paid: { label: "Pagado", class: "status-paid", icon: "fa-solid fa-receipt" },
  fulfilled: { label: "Recibido", class: "status-fulfilled", icon: "fa-solid fa-box-open" },
  rejected: { label: "Rechazado", class: "status-rejected", icon: "fa-solid fa-circle-xmark" },
  cancelled: { label: "Cancelado", class: "status-cancelled", icon: "fa-solid fa-ban" },
};

const PAYMENT_LABELS: Record<string, string> = {
  card: "Tarjeta de crédito / débito",
  transfer: "Transferencia bancaria",
  virtual_wallet: "Billetera virtual",
};

const SHIPPING_LABELS: Record<string, string> = {
  bus: "Bus Interlocal",
  own_delivery: "Entrega propia / Paquetería",
};

const formatCode = (id: string): string => `MC-${id.slice(0, 8).toUpperCase()}`;

const formatDate = (isoString?: string): string => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("es-NI", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatMoney = (val: number): string => {
  return `C$ ${val.toLocaleString("es-NI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const calculatedTotal = computed(() => {
  if (!quoteAggregate.value) return 0;
  return quoteAggregate.value.items.reduce(
    (acc, item) => acc + item.quantity * item.unit_price_snapshot,
    0
  );
});

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
    const detail = await quoteApi.getQuote(quoteId);
    quoteAggregate.value = detail;

    if (detail.quote.provider_id) {
      provider.value = await organizationApi.getOrganization(detail.quote.provider_id);
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
            <h2 class="details-order-heading">
              Detalles del Pedido #{{ formatCode(quoteAggregate.quote.id) }}
            </h2>
            <p class="details-order-subdate">
              Actualizado el {{ formatDate(quoteAggregate.quote.updated_at) }}
            </p>
          </div>
        </div>

        <div :class="['status-badge', STATUS_CONFIG[quoteAggregate.quote.status as QuoteStatus]?.class || 'status-draft']">
          <i :class="STATUS_CONFIG[quoteAggregate.quote.status as QuoteStatus]?.icon || 'fa-solid fa-circle-info'"></i>
          <span>{{ STATUS_CONFIG[quoteAggregate.quote.status as QuoteStatus]?.label || quoteAggregate.quote.status }}</span>
        </div>
      </div>

      <div class="order-summary-card">
        <div class="summary-col">
          <div class="summary-col-header">
            <i class="fa-regular fa-calendar-days summary-icon"></i>
            <span>Fecha</span>
          </div>
          <strong class="summary-val">{{ formatDate(quoteAggregate.quote.updated_at) }}</strong>
        </div>
        <div class="summary-col">
          <div class="summary-col-header">
            <i class="fa-regular fa-money-bill-1 summary-icon"></i>
            <span>Total</span>
          </div>
          <strong class="summary-val">{{ formatMoney(calculatedTotal) }}</strong>
        </div>
        <div class="summary-col">
          <div class="summary-col-header">
            <i class="fa-regular fa-credit-card summary-icon"></i>
            <span>Preferencia de Pago</span>
          </div>
          <strong class="summary-val">
            {{ PAYMENT_LABELS[quoteAggregate.quote.payment_preference] || quoteAggregate.quote.payment_preference }}
          </strong>
        </div>
        <div class="summary-col">
          <div class="summary-col-header">
            <i class="fa-solid fa-truck summary-icon"></i>
            <span>Método de Envío</span>
          </div>
          <strong class="summary-val">
            {{ SHIPPING_LABELS[quoteAggregate.quote.shipping_preference] || quoteAggregate.quote.shipping_preference }}
          </strong>
        </div>
      </div>

      <div class="details-split-grid">
        <div class="details-products-box">
          <h3 class="box-inner-title">Productos Cotizados ({{ quoteAggregate.items.length }})</h3>
          <div class="products-table-wrapper">
            <table class="order-products-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio Unitario</th>
                  <th>Cantidad</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in quoteAggregate.items" :key="item.product_id">
                  <td class="td-product">
                    <div class="product-item-cell">
                      <div class="table-prod-icon">
                        <i class="fa-solid fa-box"></i>
                      </div>
                      <span class="product-item-name">{{ item.product_title_snapshot }}</span>
                    </div>
                  </td>
                  <td class="td-price">{{ formatMoney(item.unit_price_snapshot) }}</td>
                  <td class="td-qty">{{ item.quantity }} und</td>
                  <td class="td-subtotal">
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
            <span>Total General</span>
            <strong>{{ formatMoney(calculatedTotal) }}</strong>
          </div>
        </div>

        <div class="details-sidebar-boxes">
          <div class="side-detail-card">
            <h4>Proveedor</h4>
            <div class="side-provider-avatar">
              <span>{{ provider?.company_name?.charAt(0).toUpperCase() || 'P' }}</span>
            </div>
            <h5>{{ provider?.company_name || 'Proveedor' }}</h5>
            <p class="side-provider-meta">{{ provider?.kind || 'Distribuidor' }}</p>
          </div>

          <div class="side-detail-card address-box">
            <h4>Dirección de Entrega</h4>
            <div class="address-user-line">
              <i class="fa-solid fa-location-dot map-pin-icon"></i>
              <span>Destino Registrado</span>
            </div>
            <p class="address-line-text">
              {{ quoteAggregate.quote.shipping_address || 'No especificada' }}
            </p>
          </div>
        </div>
      </div>

      <div class="details-footer-actions">
        <button type="button" class="btn-outline-teal footer-action-btn" @click="goBack">
          <i class="fa-solid fa-arrow-left"></i> Volver a la lista
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
}

.details-order-heading {
  font-size: 1.6rem;
  color: var(--primary-blue, #083c5a);
  font-weight: 700;
  font-family: 'Lora', serif;
}

.details-order-subdate {
  color: #64748b;
  font-size: 0.9rem;
}

.order-summary-card {
  background-color: #f2faf9;
  border: 1.5px solid #a3ded8;
  border-radius: 14px;
  padding: 1.4rem 2rem;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.summary-col {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.summary-col-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary-blue, #083c5a);
  font-size: 0.85rem;
  font-weight: 600;
}

.summary-val {
  color: var(--primary-blue, #083c5a);
  font-size: 0.95rem;
  font-weight: 700;
}

.details-split-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  align-items: start;
}

.details-products-box {
  background: #ffffff;
  border: 1.5px solid var(--border-gray, #e0e0e0);
  border-radius: 14px;
  padding: 1.5rem;
}

.box-inner-title {
  font-size: 1.05rem;
  color: var(--primary-blue, #083c5a);
  font-weight: 700;
  margin-bottom: 1rem;
}

.products-table-wrapper {
  overflow-x: auto;
}

.order-products-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.order-products-table th,
.order-products-table td {
  padding: 0.8rem 0.5rem;
  border-bottom: 1px solid #f2f2f2;
}

.order-products-table thead th {
  color: #777;
  font-weight: 500;
  text-align: left;
}

.product-item-cell {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.table-prod-icon {
  width: 40px;
  height: 40px;
  background: #f1f5f9;
  color: var(--primary-blue, #083c5a);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 1.1rem;
}

.product-item-name {
  font-weight: 600;
  color: var(--primary-blue, #083c5a);
}

.buyer-notes-box {
  background: var(--bg-gray, #f5f7f9);
  padding: 0.8rem 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  font-size: 0.88rem;
  color: #475569;
}

.table-bottom-total-row {
  background: #e5f5f3;
  border-radius: 8px;
  padding: 0.75rem 1.2rem;
  display: flex;
  justify-content: space-between;
  margin-top: 1.2rem;
  color: var(--primary-blue, #083c5a);
  font-weight: 700;
}

.details-sidebar-boxes {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.side-detail-card {
  background: #ffffff;
  border: 1.5px solid var(--border-gray, #e0e0e0);
  border-radius: 14px;
  padding: 1.5rem;
  text-align: center;
}

.side-detail-card h4 {
  text-align: left;
  margin-bottom: 1rem;
  color: var(--primary-blue, #083c5a);
}

.side-provider-avatar {
  width: 65px;
  height: 65px;
  border-radius: 50%;
  background: #e2f4f2;
  color: var(--light-teal, #189c94);
  font-size: 1.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.6rem auto;
}

.side-detail-card h5 {
  font-size: 1rem;
  color: var(--primary-blue, #083c5a);
  margin-bottom: 0.3rem;
}

.side-provider-meta,
.side-provider-phone {
  color: #64748b;
  font-size: 0.85rem;
  margin-bottom: 0.3rem;
}

.address-box {
  text-align: left;
}

.address-user-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary-blue, #083c5a);
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.address-line-text {
  color: #475569;
  font-size: 0.88rem;
  line-height: 1.4;
}

.details-footer-actions {
  display: flex;
  justify-content: flex-start;
  margin-top: 0.5rem;
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

@media (max-width: 1024px) {
  .order-summary-card {
    grid-template-columns: repeat(2, 1fr);
  }
  .details-split-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .details-top-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
