<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { z } from "zod";
import { useProductApi } from "@/api/modules/catalog/product/useProductApi";
import { useProductImageApi } from "@/api/modules/catalog/product_image/useProductImageApi";
import { useInventoryApi } from "@/api/modules/catalog/inventory/useInventoryApi";
import { useCategoryApi } from "@/api/modules/catalog/category/useCategoryApi";
import { useUserContextStore } from "@/stores/auth";
import { useAlertStore } from "@/stores/ui";
import type {
  PatchProductRequest,
  ProductCategoryResponse,
  ShippingMethod,
  ProductResponse,
} from "@/api";

import ProductImage from "@/components/product/ProductImage.vue";
import OrganizationVerificationBanner from "@/components/organization/OrganizationVerificationBanner.vue";

interface StagedPhoto {
  file: File;
  previewUrl: string;
}

const props = defineProps<{
  id?: string;
}>();

const route = useRoute();
const router = useRouter();
const userContext = useUserContextStore();
const alertStore = useAlertStore();

const productApi = useProductApi();
const productImageApi = useProductImageApi();
const inventoryApi = useInventoryApi();
const categoryApi = useCategoryApi();

const productId = computed(() => props.id || (route.params.id as string));

// State
const isLoading = ref(true);
const isSubmitting = ref(false);
const isLoadingCategories = ref(false);

const originalProduct = ref<ProductResponse | null>(null);
const categories = ref<ProductCategoryResponse[]>([]);

// Form values
const productName = ref("");
const categoryId = ref("");
const description = ref("");
const price = ref<number | "">("");
const minQuantity = ref<number | "">(1);
const shippingMethods = ref<ShippingMethod[]>(["bus"]);
const stock = ref<number | "">(0);
const initialStock = ref<number>(0);

// Photos state
const existingImages = ref<string[]>([]);
const imagesToDelete = ref<string[]>([]);
const newPhotos = ref<StagedPhoto[]>([]);
const fileInputRef = ref<HTMLInputElement | null>(null);

const formErrors = ref<Record<string, string>>({});

// Validation Schema
const EditProductFormSchema = z.object({
  productName: z
    .string({ message: "El nombre del producto es obligatorio." })
    .trim()
    .min(1, "El nombre del producto es obligatorio.")
    .max(255, "El nombre no puede exceder los 255 caracteres."),
  categoryId: z
    .string({ message: "Debes seleccionar una categoría válida." })
    .uuid("Debes seleccionar una categoría válida."),
  description: z
    .string()
    .trim()
    .max(2000, "La descripción no puede exceder los 2000 caracteres.")
    .optional(),
  price: z
    .number({ message: "Ingresa un precio válido." })
    .positive("El precio por unidad debe ser mayor a 0."),
  minQuantity: z
    .number({ message: "Ingresa una cantidad mínima válida." })
    .int("La cantidad mínima debe ser un número entero.")
    .min(1, "El pedido mínimo debe ser de al menos 1 unidad."),
  shippingMethods: z
    .array(z.enum(["bus", "own_delivery"]))
    .min(1, "Selecciona al menos un método de envío disponible."),
  stock: z
    .number({ message: "Ingresa una cantidad de stock válida." })
    .int("El stock debe ser un número entero.")
    .min(0, "El stock no puede ser negativo."),
});

const totalPhotosCount = computed(
  () => existingImages.value.length + newPhotos.value.length
);

function clearFieldError(field: string) {
  if (formErrors.value[field]) {
    delete formErrors.value[field];
  }
}

async function loadData() {
  if (!productId.value) {
    alertStore.showError("Identificador de producto no proporcionado.");
    router.push({ name: "provider-products" });
    return;
  }

  isLoading.value = true;
  isLoadingCategories.value = true;

  try {
    const [catRes, prod, shippingRes] = await Promise.all([
      categoryApi.getCategories({ limit: 100 }).catch(() => ({ data: [] })),
      productApi.getProduct(productId.value),
      productApi.getProductShipping(productId.value).catch(() => [] as ShippingMethod[]),
    ]);

    categories.value = catRes.data;
    originalProduct.value = prod;

    // Populate product form fields
    productName.value = prod.title;
    categoryId.value = prod.category_id;
    description.value = prod.description || "";
    price.value = Number(prod.base_price);
    
    if (prod.spec && "Physical" in prod.spec) {
      minQuantity.value = prod.spec.Physical.min_order_quantity;
    } else {
      minQuantity.value = 1;
    }

    if (shippingRes && shippingRes.length > 0) {
      shippingMethods.value = shippingRes;
    } else if (prod.shipping_methods && prod.shipping_methods.length > 0) {
      shippingMethods.value = prod.shipping_methods;
    } else {
      shippingMethods.value = ["bus"];
    }

    existingImages.value = prod.image_blob_ids ? [...prod.image_blob_ids] : [];

    // Fetch stock
    try {
      const invDetails = await inventoryApi.getInventoryDetails(productId.value);
      stock.value = invDetails.available_stock;
      initialStock.value = invDetails.available_stock;
    } catch {
      stock.value = 0;
      initialStock.value = 0;
    }
  } catch (err: any) {
    alertStore.showError(err.message || "Error al cargar la información del producto.");
    router.push({ name: "provider-products" });
  } finally {
    isLoading.value = false;
    isLoadingCategories.value = false;
  }
}

// Photos handlers
function triggerAddPhoto() {
  if (totalPhotosCount.value >= 5) {
    alertStore.showWarning("Puedes subir un máximo de 5 fotografías por producto.", "Límite alcanzado");
    return;
  }
  fileInputRef.value?.click();
}

function handleFileInputChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) return;

  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxBytes = 5 * 1024 * 1024; // 5MB

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (totalPhotosCount.value >= 5) {
      alertStore.showWarning("Has alcanzado el límite máximo de 5 fotos.", "Límite de fotos");
      break;
    }

    if (!validTypes.includes(file.type)) {
      alertStore.showError(`"${file.name}" no es un formato válido (JPG, PNG o WebP).`);
      continue;
    }

    if (file.size > maxBytes) {
      alertStore.showError(`"${file.name}" supera el tamaño máximo permitido de 5MB.`);
      continue;
    }

    const previewUrl = URL.createObjectURL(file);
    newPhotos.value.push({ file, previewUrl });
  }

  // Reset file input
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
}

function removeExistingImage(blobId: string) {
  existingImages.value = existingImages.value.filter((id) => id !== blobId);
  imagesToDelete.value.push(blobId);
}

function removeNewPhoto(index: number) {
  const removed = newPhotos.value.splice(index, 1);
  if (removed[0]) {
    URL.revokeObjectURL(removed[0].previewUrl);
  }
}

// Submit handler
async function handleUpdateProduct() {
  formErrors.value = {};

  if (!productId.value) return;

  const parseResult = EditProductFormSchema.safeParse({
    productName: productName.value,
    categoryId: categoryId.value,
    description: description.value || undefined,
    price: price.value === "" ? undefined : Number(price.value),
    minQuantity: minQuantity.value === "" ? undefined : Number(minQuantity.value),
    shippingMethods: shippingMethods.value,
    stock: stock.value === "" ? undefined : Number(stock.value),
  });

  if (!parseResult.success) {
    const mapped: Record<string, string> = {};
    for (const issue of parseResult.error.issues) {
      const key = String(issue.path[0]);
      if (!mapped[key]) mapped[key] = issue.message;
    }
    formErrors.value = mapped;
    alertStore.showError("Por favor revisa los campos requeridos en el formulario.");
    return;
  }

  isSubmitting.value = true;

  try {
    // 1. Update Core Product Details
    const patchPayload: PatchProductRequest = {
      title: productName.value.trim(),
      category_id: categoryId.value,
      description: description.value.trim() || null,
      base_price: Number(price.value),
      shipping_methods: shippingMethods.value,
      spec: {
        Physical: {
          min_order_quantity: Number(minQuantity.value),
        },
      },
    };

    await productApi.updateProduct(productId.value, patchPayload);

    // 2. Adjust Stock if changed
    const targetStock = Number(stock.value);
    if (targetStock !== initialStock.value) {
      const delta = targetStock - initialStock.value;
      await inventoryApi.updateInventory(productId.value, {
        available_stock_delta: delta,
      });
      initialStock.value = targetStock;
    }

    // 3. Delete removed images
    if (imagesToDelete.value.length > 0) {
      for (const blobId of imagesToDelete.value) {
        try {
          await productImageApi.deleteProductImage(productId.value, blobId);
        } catch (imgErr) {
          console.warn("Failed to delete product image:", blobId, imgErr);
        }
      }
      imagesToDelete.value = [];
    }

    // 4. Upload new staged images
    if (newPhotos.value.length > 0) {
      for (const photo of newPhotos.value) {
        await productImageApi.uploadProductImage(productId.value, photo.file);
      }
      // Clean up object URLs
      newPhotos.value.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      newPhotos.value = [];
    }

    alertStore.spawnAlert({
      title: "Producto actualizado",
      message: `"${productName.value.trim()}" ha sido actualizado con éxito.`,
      iconVariant: "teal",
      icon: "fa-solid fa-circle-check",
      confirmText: "Volver a mis productos",
      onConfirm: () => {
        router.push({ name: "provider-products" });
      },
    });
  } catch (err: any) {
    alertStore.showError(err.message || "Error al actualizar el producto.");
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(async () => {
  if (!userContext.isInitialized) {
    await userContext.initialize().catch(console.warn);
  }
  await loadData();
});

onUnmounted(() => {
  newPhotos.value.forEach((p) => URL.revokeObjectURL(p.previewUrl));
});
</script>

<template>
  <div class="edit-product-page">
    <div class="max-w-[1100px] mx-auto pb-12">
      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <router-link :to="{ name: 'provider-products' }">Mis Productos</router-link>
        <span class="separator">&gt;</span>
        <span class="current">Editar producto</span>
      </div>

      <!-- Roadblock State when unverified -->
      <div v-if="!userContext.canPublishProducts" class="flex flex-col gap-4 max-w-4xl mx-auto my-6">
        <OrganizationVerificationBanner />
      </div>

      <!-- Loading Skeleton -->
      <div v-if="isLoading" class="mt-6 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
        <div class="h-8 w-64 bg-slate-100 rounded-lg animate-pulse mb-8"></div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="space-y-4">
            <div class="h-10 bg-slate-100 rounded-xl animate-pulse"></div>
            <div class="h-10 bg-slate-100 rounded-xl animate-pulse"></div>
            <div class="h-32 bg-slate-100 rounded-xl animate-pulse"></div>
          </div>
          <div class="space-y-4">
            <div class="h-10 bg-slate-100 rounded-xl animate-pulse"></div>
            <div class="h-10 bg-slate-100 rounded-xl animate-pulse"></div>
            <div class="h-20 bg-slate-100 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>

      <!-- Main Edit Card -->
      <div v-else class="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs mt-4">
        <!-- Card Header -->
        <div class="pb-6 border-b border-slate-100">
          <h1 class="text-xl sm:text-2xl font-bold text-[#023859]">
            Editar producto
          </h1>
        </div>

        <form @submit.prevent="handleUpdateProduct" class="mt-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <!-- Left Column: Información general -->
            <div class="space-y-6">
              <h2 class="text-base font-bold text-[#023859]">
                Información general
              </h2>

              <!-- Nombre del producto -->
              <div class="form-group">
                <label class="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nombre del producto <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  v-model="productName"
                  placeholder="Ej. Audífonos Bluetooth Sony WHCH520"
                  class="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:border-[#00a896] focus:ring-1 focus:ring-[#00a896] focus:outline-none transition-colors"
                  :class="{ 'border-red-400 ring-1 ring-red-400': formErrors.productName }"
                  @input="clearFieldError('productName')"
                />
                <span v-if="formErrors.productName" class="text-xs text-red-500 mt-1 block">
                  {{ formErrors.productName }}
                </span>
              </div>

              <!-- Categoría -->
              <div class="form-group">
                <label class="block text-xs font-semibold text-slate-700 mb-1.5">
                  Categoría <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="categoryId"
                  :disabled="isLoadingCategories"
                  class="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:border-[#00a896] focus:ring-1 focus:ring-[#00a896] focus:outline-none transition-colors"
                  :class="{ 'border-red-400 ring-1 ring-red-400': formErrors.categoryId }"
                  @change="clearFieldError('categoryId')"
                >
                  <option value="" disabled>Selecciona una categoría</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                    {{ cat.name }}
                  </option>
                </select>
                <span v-if="formErrors.categoryId" class="text-xs text-red-500 mt-1 block">
                  {{ formErrors.categoryId }}
                </span>
              </div>

              <!-- Descripción del producto -->
              <div class="form-group">
                <label class="block text-xs font-semibold text-slate-700 mb-1.5">
                  Descripción del producto
                </label>
                <div class="relative">
                  <textarea
                    v-model="description"
                    placeholder="Describe las características y detalles de tu producto..."
                    maxlength="2000"
                    rows="4"
                    class="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:border-[#00a896] focus:ring-1 focus:ring-[#00a896] focus:outline-none transition-colors resize-y min-h-[100px]"
                    :class="{ 'border-red-400 ring-1 ring-red-400': formErrors.description }"
                    @input="clearFieldError('description')"
                  ></textarea>
                  <span class="absolute bottom-2.5 right-3 text-[11px] text-slate-400 bg-white/80 px-1 rounded">
                    {{ description.length }}/2000
                  </span>
                </div>
                <span v-if="formErrors.description" class="text-xs text-red-500 mt-1 block">
                  {{ formErrors.description }}
                </span>
              </div>

              <!-- Fotografías del producto -->
              <div class="form-group">
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-xs font-semibold text-slate-700">
                    Fotografías del producto <span class="text-slate-400 font-normal">({{ totalPhotosCount }}/5)</span>
                  </label>
                </div>

                <div class="flex flex-wrap items-center gap-3">
                  <!-- Existing Images -->
                  <div
                    v-for="(blobId, idx) in existingImages"
                    :key="blobId"
                    class="relative w-20 h-20 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 group shadow-2xs"
                  >
                    <!-- Principal badge on first image -->
                    <span
                      v-if="idx === 0"
                      class="absolute top-0 left-0 right-0 bg-[#00a896] text-white text-[9px] font-bold text-center py-0.5 tracking-wider uppercase z-10"
                    >
                      Principal
                    </span>
                    <ProductImage
                      :blob-id="blobId"
                      :alt="productName || 'Producto'"
                      class="w-full h-full object-cover"
                    />
                    <!-- Delete button -->
                    <button
                      type="button"
                      class="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-900/70 hover:bg-red-600 text-white flex items-center justify-center transition-colors opacity-90 hover:opacity-100 z-20 cursor-pointer shadow-xs"
                      title="Eliminar imagen"
                      @click="removeExistingImage(blobId)"
                    >
                      <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                  </div>

                  <!-- Staged New Photos -->
                  <div
                    v-for="(photo, idx) in newPhotos"
                    :key="idx"
                    class="relative w-20 h-20 rounded-xl border border-teal-300 overflow-hidden bg-slate-50 group shadow-2xs"
                  >
                    <span
                      v-if="existingImages.length === 0 && idx === 0"
                      class="absolute top-0 left-0 right-0 bg-[#00a896] text-white text-[9px] font-bold text-center py-0.5 tracking-wider uppercase z-10"
                    >
                      Principal
                    </span>
                    <img
                      :src="photo.previewUrl"
                      alt="Nueva foto"
                      class="w-full h-full object-cover"
                    />
                    <!-- Delete staged button -->
                    <button
                      type="button"
                      class="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-900/70 hover:bg-red-600 text-white flex items-center justify-center transition-colors opacity-90 hover:opacity-100 z-20 cursor-pointer shadow-xs"
                      title="Eliminar imagen"
                      @click="removeNewPhoto(idx)"
                    >
                      <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                  </div>

                  <!-- Add Photo Button -->
                  <button
                    v-if="totalPhotosCount < 5"
                    type="button"
                    class="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#00a896] hover:bg-teal-50/40 text-slate-500 hover:text-[#00a896] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                    title="Agregar fotografía"
                    @click="triggerAddPhoto"
                  >
                    <i class="fa-solid fa-plus text-base"></i>
                    <span class="text-[11px] font-semibold">Agregar</span>
                  </button>
                </div>

                <!-- Hidden file input -->
                <input
                  ref="fileInputRef"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  class="hidden"
                  @change="handleFileInputChange"
                />

                <p class="text-[11px] text-slate-400 mt-2">
                  Formatos soportados: JPG, JPEG, PNG, WebP. Peso máximo: 5MB por imagen.
                </p>
              </div>
            </div>

            <!-- Right Column: Detalles del producto -->
            <div class="space-y-6">
              <h2 class="text-base font-bold text-[#023859]">
                Detalles del producto
              </h2>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Precio por unidad -->
                <div class="form-group sm:col-span-1">
                  <label class="block text-xs font-semibold text-slate-700 mb-1.5">
                    Precio por unidad <span class="text-red-500">*</span>
                  </label>
                  <div
                    class="flex items-center border border-slate-300 rounded-xl overflow-hidden focus-within:border-[#00a896] focus-within:ring-1 focus-within:ring-[#00a896] transition-colors"
                    :class="{ 'border-red-400 ring-1 ring-red-400': formErrors.price }"
                  >
                    <span class="px-3.5 py-2.5 bg-slate-50 text-slate-500 text-sm font-semibold border-r border-slate-200">
                      C$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      v-model.number="price"
                      placeholder="0.00"
                      class="w-full px-3 py-2 text-sm bg-white focus:outline-none"
                      @input="clearFieldError('price')"
                    />
                  </div>
                  <span v-if="formErrors.price" class="text-xs text-red-500 mt-1 block">
                    {{ formErrors.price }}
                  </span>
                </div>

                <!-- Cantidad mínima de compra -->
                <div class="form-group sm:col-span-1">
                  <label class="block text-xs font-semibold text-slate-700 mb-1.5">
                    Cantidad mínima de compra <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    v-model.number="minQuantity"
                    placeholder="1"
                    class="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:border-[#00a896] focus:ring-1 focus:ring-[#00a896] focus:outline-none transition-colors"
                    :class="{ 'border-red-400 ring-1 ring-red-400': formErrors.minQuantity }"
                    @input="clearFieldError('minQuantity')"
                  />
                  <span v-if="formErrors.minQuantity" class="text-xs text-red-500 mt-1 block">
                    {{ formErrors.minQuantity }}
                  </span>
                </div>
              </div>

              <!-- Tipo de envío disponible -->
              <div class="form-group">
                <label class="block text-xs font-semibold text-slate-700 mb-2">
                  Tipo de envío disponible <span class="text-red-500">*</span>
                </label>
                <div class="space-y-2.5">
                  <label class="flex items-center gap-3 text-sm text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      value="bus"
                      v-model="shippingMethods"
                      class="h-4 w-4 rounded border-slate-300 text-[#00a896] focus:ring-[#00a896] cursor-pointer"
                      @change="clearFieldError('shippingMethods')"
                    />
                    <span>Bus interlocal</span>
                  </label>

                  <label class="flex items-center gap-3 text-sm text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      value="own_delivery"
                      v-model="shippingMethods"
                      class="h-4 w-4 rounded border-slate-300 text-[#00a896] focus:ring-[#00a896] cursor-pointer"
                      @change="clearFieldError('shippingMethods')"
                    />
                    <span>Empresas de paquetería / Entrega propia</span>
                  </label>
                </div>
                <span v-if="formErrors.shippingMethods" class="text-xs text-red-500 mt-1.5 block">
                  {{ formErrors.shippingMethods }}
                </span>
              </div>

              <!-- Stock disponible -->
              <div class="form-group">
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Stock disponible <span class="text-red-500">*</span>
                </label>
                <p class="text-xs text-slate-400 mb-2">Gestiona el stock para este producto.</p>
                <input
                  type="number"
                  min="0"
                  v-model.number="stock"
                  placeholder="0"
                  class="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:border-[#00a896] focus:ring-1 focus:ring-[#00a896] focus:outline-none transition-colors"
                  :class="{ 'border-red-400 ring-1 ring-red-400': formErrors.stock }"
                  @input="clearFieldError('stock')"
                />
                <span v-if="formErrors.stock" class="text-xs text-red-500 mt-1 block">
                  {{ formErrors.stock }}
                </span>

                <!-- Info callout box -->
                <div class="mt-3 flex items-start gap-2.5 p-3 bg-teal-50/70 border border-teal-200/60 rounded-xl text-teal-800 text-xs">
                  <i class="fa-solid fa-circle-info text-teal-600 mt-0.5 shrink-0"></i>
                  <span>El stock se actualizará automáticamente cuando recibas nuevos pedidos.</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Actions -->
          <div class="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
            <router-link
              :to="{ name: 'provider-products' }"
              class="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </router-link>

            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-6 py-2.5 bg-[#f97316] hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <i v-if="isSubmitting" class="fa-solid fa-spinner fa-spin"></i>
              <span>{{ isSubmitting ? "Guardando cambios..." : "Actualizar producto" }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.edit-product-page {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1.5rem;
  background-color: #f8fafc;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.breadcrumb a {
  color: #00a896;
  text-decoration: none;
  font-weight: 500;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.breadcrumb .separator {
  color: #cbd5e1;
}

.breadcrumb .current {
  color: #334155;
  font-weight: 600;
}
</style>
