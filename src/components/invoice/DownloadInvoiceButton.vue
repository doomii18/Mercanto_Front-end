<script setup lang="ts">
import { ref } from 'vue'
import type FacturaTemplate from './FacturaTemplate.vue'

interface Props {
  templateRef: InstanceType<typeof FacturaTemplate> | null
  filename?: string
}

const props = withDefaults(defineProps<Props>(), {
  filename: 'factura.pdf',
})

const isExporting = ref(false)

async function handleDownload() {
  if (
    !props.templateRef ||
    !props.templateRef.pageRefs ||
    props.templateRef.pageRefs.length === 0 ||
    isExporting.value
  ) {
    return;
  }

  isExporting.value = true;
  const pages = props.templateRef.pageRefs;

  try {
    // Dynamic import to isolate heavy libs into separate on-demand chunks
    const [{ toPng }, { jsPDF }] = await Promise.all([
      import('html-to-image'),
      import('jspdf'),
    ]);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pages.length; i++) {
      const pageElement = pages[i];
      if (!pageElement) continue;

      const dataUrl = await toPng(pageElement, {
        quality: 0.98,
        pixelRatio: 2,
      });

      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
    }

    pdf.save(props.filename);
  } catch (err) {
    console.error('Failed to generate multi-page PDF:', err);
  } finally {
    isExporting.value = false;
  }
}
</script>

<template>
  <button
    type="button"
    @click="handleDownload"
    :disabled="isExporting || !templateRef?.isReady"
    class="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-50"
  >
    <i
      v-if="isExporting"
      class="fa-solid fa-spinner fa-spin text-neutral-500 text-sm"
    ></i>
    <i
      v-else
      class="fa-solid fa-file-invoice text-neutral-500 text-sm"
    ></i>
    <span>{{ isExporting ? 'Generando...' : 'Descargar factura' }}</span>
  </button>
</template>
