<script setup lang="ts">
import { ref } from 'vue'
import { useQuoteApi } from '@/api/modules/commerce/quote/useQuoteApi'

interface Props {
  quoteId: string
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Descargar factura (PDF)',
})

const quoteApi = useQuoteApi()
const isDownloading = ref(false)
const errorMessage = ref<string | null>(null)

function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'factura.pdf'
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

async function handleDownload() {
  if (isDownloading.value || !props.quoteId) return

  isDownloading.value = true
  errorMessage.value = null

  try {
    const printRes = await quoteApi.printQuote(props.quoteId)
    triggerDownload(printRes.download_url, printRes.filename)
  } catch (err: any) {
    console.error('Failed to download invoice PDF:', err)
    errorMessage.value = err?.message || 'Error al generar la factura PDF'
  } finally {
    isDownloading.value = false
  }
}
</script>

<template>
  <button
    type="button"
    @click="handleDownload"
    :disabled="isDownloading || !quoteId"
    class="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-50"
    :title="errorMessage || undefined"
  >
    <i
      v-if="isDownloading"
      class="fa-solid fa-spinner fa-spin text-neutral-500 text-sm"
    ></i>
    <i
      v-else
      class="fa-solid fa-file-pdf text-red-500 text-sm"
    ></i>
    <span>{{ isDownloading ? 'Generando...' : label }}</span>
  </button>
</template>
