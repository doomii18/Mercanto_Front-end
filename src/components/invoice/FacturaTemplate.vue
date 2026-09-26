<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import mercantoLogo from '@/assets/logo.png?inline'
import { useQuoteApi } from '@/api/modules/quote/useQuoteApi'
import type { QuoteAggregateResponse } from '@/api/modules/quote/types'
import type { PublicProviderDto } from '@/api/modules/organization/types'
import type { UserProfileResponse } from '@/api/modules/user_profile/types'
import type { AccountResponse } from '@/api/modules/identity/types'
import { useIdentityApi } from '@/api/modules/identity/useIdentityApi'
import { useUserProfileApi } from '@/api/modules/user_profile/useUserProfileApi'
import { useOrganizationApi } from '@/api/modules/organization/useOrganizationApi'

type QuoteItem = QuoteAggregateResponse['items'][number]

interface Props {
  quoteId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'ready', isReady: boolean): void
  (e: 'error', error: unknown): void
}>()

const identityApi = useIdentityApi();
const userProfileApi = useUserProfileApi();
const organizationApi = useOrganizationApi();
const quoteApi = useQuoteApi();

const pageRefs = ref<HTMLElement[]>([])
const isLoading = ref<boolean>(true)
const isReady = ref<boolean>(false)

const quoteData = ref<QuoteAggregateResponse | null>(null)
const providerData = ref<PublicProviderDto | null>(null)
const buyerProfile = ref<UserProfileResponse | null>(null)
const buyerAccount = ref<AccountResponse | null>(null)

const FIRST_PAGE_LIMIT = 8
const SUBSEQUENT_PAGE_LIMIT = 18

const pages = computed<QuoteItem[][]>(() => {
  if (!quoteData.value?.items?.length) return []
  const items = quoteData.value.items

  if (items.length <= FIRST_PAGE_LIMIT) {
    return [items]
  }

  const result: QuoteItem[][] = [items.slice(0, FIRST_PAGE_LIMIT)]
  let remaining = items.slice(FIRST_PAGE_LIMIT)

  while (remaining.length > 0) {
    result.push(remaining.slice(0, SUBSEQUENT_PAGE_LIMIT))
    remaining = remaining.slice(SUBSEQUENT_PAGE_LIMIT)
  }

  return result
})

function formatDate(isoString?: string): string {
  if (!isoString) return ''
  return new Intl.DateTimeFormat('es-NI', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(isoString))
}

const paymentMethodLabels: Record<string, string> = {
  transfer: 'Transferencia bancaria',
  card: 'Tarjeta de crédito/débito',
  virtual_wallet: 'Billetera digital',
}

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  pending_provider: 'Pendiente de proveedor',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  paid: 'Pagado',
  fulfilled: 'Recibido',
  cancelled: 'Cancelado',
}

const subtotal = computed(() => {
  if (!quoteData.value) return 0
  return quoteData.value.items.reduce(
    (acc, item) => acc + item.quantity * item.unit_price_snapshot,
    0,
  )
})

const buyerFullName = computed(() => {
  if (!buyerProfile.value) return 'Cliente'
  return `${buyerProfile.value.first_name} ${buyerProfile.value.last_name}`
})

const buyerNationalId = computed(() => {
  if (!buyerProfile.value || !('national_id' in buyerProfile.value)) return null
  return buyerProfile.value.national_id
})

const buyerPhone = computed(() => {
  if (!buyerProfile.value || !('phone_number' in buyerProfile.value)) return null
  return buyerProfile.value.phone_number
})

async function fetchInvoiceData() {
  if (!props.quoteId) return
  isLoading.value = true
  isReady.value = false
  pageRefs.value = []
  emit('ready', false)

  try {
    const aggregate = await quoteApi.getQuote(props.quoteId)
    quoteData.value = aggregate

    const [provider, profile, account] = await Promise.all([
      organizationApi.getPublicProvider(aggregate.quote.provider_id),
      userProfileApi.getUserProfile(aggregate.quote.buyer_id),
      identityApi.getAccount(aggregate.quote.buyer_id),
    ])

    providerData.value = provider
    buyerProfile.value = profile
    buyerAccount.value = account

    isReady.value = true
    emit('ready', true)
  } catch (err) {
    console.error('Error loading invoice data:', err)
    emit('error', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchInvoiceData)
watch(() => props.quoteId, fetchInvoiceData)

defineExpose({
  pageRefs,
  isReady,
  isLoading,
  quoteData,
  refresh: fetchInvoiceData,
})
</script>

<template>
  <div v-if="isLoading" class="p-8 text-center text-slate-500 font-medium">
    Cargando datos de la factura...
  </div>

  <div
    v-else-if="quoteData && providerData"
    class="flex flex-col gap-8 items-center"
  >
    <div
      v-for="(pageItems, index) in pages"
      :key="index"
      :ref="(el) => { if (el) pageRefs[index] = el as HTMLElement }"
      class="w-[210mm] h-[297mm] bg-white p-12 text-slate-800 shadow-md box-border font-sans antialiased flex flex-col justify-between"
    >
      <div>
        <!-- Page 1 Header & Metadata -->
        <template v-if="index === 0">
          <header class="flex items-start justify-between border-b-2 border-orange-500 pb-4">
            <div>
              <h1 class="text-3xl font-extrabold tracking-tight text-slate-900">FACTURA</h1>
              <p class="text-sm font-bold text-orange-600 mt-1">
                #FAC-{{ quoteData.quote.id.substring(0, 8).toUpperCase() }}
              </p>
            </div>
            <div class="flex flex-col items-end">
              <img
                :src="mercantoLogo"
                alt="Mercanto"
                class="h-10 w-auto object-contain"
              />
              <p class="text-xs text-slate-500 mt-2 font-medium">
                {{ formatDate(quoteData.quote.updated_at) }}
              </p>
            </div>
          </header>

          <section class="grid grid-cols-3 gap-6 py-6 border-b border-slate-100 text-xs">
            <div class="space-y-1">
              <div class="flex items-center gap-1.5 font-bold text-orange-600 mb-1">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span class="text-sm">Comprador</span>
              </div>
              <p class="font-bold text-slate-900 text-sm">{{ buyerFullName }}</p>
              <p v-if="buyerNationalId" class="text-slate-500">Cédula: {{ buyerNationalId }}</p>
              <p class="text-slate-500">{{ quoteData.quote.shipping_address }}</p>
              <p v-if="buyerPhone" class="text-slate-500">{{ buyerPhone }}</p>
              <p v-if="buyerAccount?.email" class="text-slate-500">{{ buyerAccount.email }}</p>
            </div>

            <div class="space-y-1 border-l border-orange-500/20 pl-4">
              <div class="flex items-center gap-1.5 font-bold text-orange-600 mb-1">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span class="text-sm">Proveedor</span>
              </div>
              <p class="font-bold text-slate-900 text-sm">{{ providerData.company_name }}</p>
              <p class="text-slate-500">RUC: Próximamente</p>
              <p class="text-slate-500">Contacto: Próximamente</p>
              <p v-if="providerData.company_description" class="text-slate-500 line-clamp-2">
                {{ providerData.company_description }}
              </p>
            </div>

            <div class="space-y-1 border-l border-orange-500/20 pl-4">
              <div class="flex items-center gap-1.5 font-bold text-orange-600 mb-1">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span class="text-sm">Pedido</span>
              </div>
              <p class="font-bold text-slate-900 text-sm">#MC-{{ quoteData.quote.id.substring(0, 6) }}</p>
              <p class="text-slate-500">{{ formatDate(quoteData.quote.updated_at) }}</p>
              <p class="text-slate-500">
                Método de pago: {{ paymentMethodLabels[quoteData.quote.payment_preference] ?? quoteData.quote.payment_preference }}
              </p>
              <p class="text-slate-500">
                Estado: {{ statusLabels[quoteData.quote.status] ?? quoteData.quote.status }}
              </p>
            </div>
          </section>
        </template>

        <!-- Pages 2+ Compact Header -->
        <template v-else>
          <header class="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
            <div class="flex items-center gap-3">
              <img :src="mercantoLogo" alt="Mercanto" class="h-6 w-auto object-contain" />
              <span class="text-xs font-semibold text-slate-500">
                Factura #FAC-{{ quoteData.quote.id.substring(0, 8).toUpperCase() }}
              </span>
            </div>
            <span class="text-xs text-slate-400 font-medium">
              Página {{ index + 1 }} de {{ pages.length }}
            </span>
          </header>
        </template>

        <!-- Product Table Block -->
        <section :class="index === 0 ? 'mt-6' : ''" class="rounded-2xl border border-orange-500/40 p-4">
          <h2 class="text-sm font-bold text-slate-700 mb-3">
            Productos ({{ quoteData.items.length }})
          </h2>

          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-sky-950 text-white">
                <th class="py-2.5 px-4 font-semibold rounded-l-lg">Producto</th>
                <th class="py-2.5 px-4 font-semibold text-center w-24">Cantidad</th>
                <th class="py-2.5 px-4 font-semibold text-right w-28">Precio Unit.</th>
                <th class="py-2.5 px-4 font-semibold text-right w-28 rounded-r-lg">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="item in pageItems" :key="item.product_id" class="text-slate-700">
                <td class="py-3 px-4 font-medium text-slate-900">
                  {{ item.product_title_snapshot }}
                </td>
                <td class="py-3 px-4 text-center">{{ item.quantity }}</td>
                <td class="py-3 px-4 text-right">C$ {{ item.unit_price_snapshot.toFixed(2) }}</td>
                <td class="py-3 px-4 text-right font-semibold">
                  C$ {{ (item.quantity * item.unit_price_snapshot).toFixed(2) }}
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <!-- Page Footer & Totals on Last Page -->
      <footer class="pt-4 border-t border-slate-200">
        <div v-if="index === pages.length - 1" class="flex justify-end">
          <div class="w-64 space-y-2 text-xs">
            <div class="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>C$ {{ subtotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span>Envío:</span>
              <span>C$ 0.00</span>
            </div>
            <div class="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2">
              <span>Total:</span>
              <span class="text-orange-600">C$ {{ subtotal.toFixed(2) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="text-right text-xs text-slate-400">
          Continúa en la siguiente página...
        </div>
      </footer>
    </div>
  </div>
</template>
