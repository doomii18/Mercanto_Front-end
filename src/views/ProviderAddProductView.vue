<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { z } from "zod";
import { productApi, categoryApi } from "@/api";
import { useUserContextStore } from "@/stores/userContextStore";
import { useAlertStore } from "@/stores/alertStore";
import type { CreateProductRequest, UnitOfMeasure } from "@/api/services/product/types";
import type { ProductCategoryResponse } from "@/api/services/category/types";

import BaseFileDropZone from "@/components/common/BaseFileDropZone.vue";
import type { ShippingMethod } from "@/api/services/quote/types";

const router = useRouter();
const userContext = useUserContextStore();
const alertStore = useAlertStore();


const productName = ref("");
const brand = ref("");
const categoryId = ref("");
const description = ref("");
const quality = ref("new");
const price = ref<number | "">("");
const minQuantity = ref<number | "">(1);
const unit = ref<UnitOfMeasure>("piece");
const shippingMethods = ref<ShippingMethod[]>(["bus"]);
const stock = ref<number | "">("");
const productPhotos = ref<File[]>([]);


const categories = ref<ProductCategoryResponse[]>([]);
const isSubmitting = ref(false);
const isLoadingCategories = ref(false);
const formErrors = ref<Record<string, string>>({});


const AddProductFormSchema = z.object({
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
  unit: z.enum(
    [
      "piece",
      "box",
      "roll",
      "pallet",
      "lot",
      "package",
      "set",
      "system",
      "service",
      "contract",
    ],
    { message: "Selecciona una unidad de medida válida." }
  ),
  shippingMethods: z
    .array(z.enum(["bus", "own_delivery"]))
    .min(1, "Selecciona al menos un método de envío disponible."),
});

const activeOrgId = computed(() => userContext.activeOrganizationId);

async function loadCategories() {
  isLoadingCategories.value = true;
  try {
    const res = await categoryApi.getCategories({ limit: 100 });
    categories.value = res.data;
  } catch (err: any) {
    alertStore.showError(err.message || "Error al cargar las categorías.");
  } finally {
    isLoadingCategories.value = false;
  }
}

function clearFieldError(field: string) {
  if (formErrors.value[field]) {
    delete formErrors.value[field];
  }
}

async function handlePublishProduct() {
  formErrors.value = {};

  if (!activeOrgId.value) {
    alertStore.showError("No se encontró una organización activa para publicar el producto.");
    return;
  }

  const parseResult = AddProductFormSchema.safeParse({
    productName: productName.value,
    categoryId: categoryId.value,
    description: description.value || undefined,
    price: price.value === "" ? undefined : Number(price.value),
    minQuantity: minQuantity.value === "" ? undefined : Number(minQuantity.value),
    unit: unit.value,
    shippingMethods: shippingMethods.value,
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
    const payload: CreateProductRequest = {
      provider_id: activeOrgId.value,
      category_id: categoryId.value,
      title: productName.value.trim(),
      description: description.value.trim() || null,
      base_price: Number(price.value),
      unit_of_measure: unit.value,
      shipping_methods: shippingMethods.value,
      spec: {
        Physical: {
          min_order_quantity: Number(minQuantity.value),
        },
      },
    };

    const createdProduct = await productApi.createProduct(payload);

    if (productPhotos.value.length > 0) {
      for (const photo of productPhotos.value) {
        await productApi.uploadProductImage(createdProduct.id, photo);
      }
    }

    alertStore.spawnAlert({
      title: "Producto publicado",
      message: `"${createdProduct.title}" ha sido creado y publicado con éxito.`,
      iconVariant: "teal",
      icon: "fa-solid fa-circle-check",
      confirmText: "Ver mis productos",
      onConfirm: () => {
        router.push("/dashboard/provider-products");
      },
    });
  } catch (err: any) {
    alertStore.showError(err.message || "Error al crear y publicar el producto.");
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(async () => {
  if (!userContext.isInitialized) {
    await userContext.initialize().catch(console.warn);
  }
  await loadCategories();
});
</script>

<template>
  <div class="add-product-page">
    <div class="breadcrumb">
      <router-link to="/dashboard/provider-products">Mis Productos</router-link>
      <span class="separator">&gt;</span>
      <span class="current">Agregar nuevo producto</span>
    </div>

    <h1 class="page-title">Agregar nuevo producto</h1>

    <form @submit.prevent="handlePublishProduct" class="form-container">
      <!-- Section 1: General Info -->
      <div class="form-section">
        <div class="grid-row-3">
          <div class="form-group col-span-2">
            <label>Nombre del producto <span class="required">*</span></label>
            <input
              type="text"
              v-model="productName"
              placeholder="Ej. Audífonos Bluetooth Sony WH-CH520"
              :class="{ 'input-error': formErrors.productName }"
              @input="clearFieldError('productName')"
            />
            <span v-if="formErrors.productName" class="field-error-msg">{{ formErrors.productName }}</span>
          </div>

          <div class="form-group">
            <label>Marca</label>
            <input
              type="text"
              v-model="brand"
              placeholder="Escribe la marca (opcional)"
            />
          </div>

          <div class="form-group">
            <label>Categoría <span class="required">*</span></label>
            <select
              v-model="categoryId"
              :disabled="isLoadingCategories"
              :class="{ 'input-error': formErrors.categoryId }"
              @change="clearFieldError('categoryId')"
            >
              <option value="" disabled>Selecciona una categoría</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
            <span v-if="formErrors.categoryId" class="field-error-msg">{{ formErrors.categoryId }}</span>
          </div>
        </div>

        <div class="form-group mt-4">
          <label>Descripción del producto</label>
          <div class="textarea-wrapper">
            <textarea
              v-model="description"
              placeholder="Describe tu producto, sus características y especificaciones técnicas..."
              maxlength="2000"
              :class="{ 'input-error': formErrors.description }"
              @input="clearFieldError('description')"
            ></textarea>
            <span class="char-count">{{ description.length }}/2000</span>
          </div>
          <span v-if="formErrors.description" class="field-error-msg">{{ formErrors.description }}</span>
        </div>
      </div>

      <!-- Section 2: Photos -->
      <div class="form-section">
        <h3 class="section-title">Fotografías del producto</h3>
        <div class="photos-container">
          <div class="dropzone-wrapper">
            <BaseFileDropZone
              v-model="productPhotos"
              :multiple="true"
              :max-files="5"
              :max-size-mb="5"
              accept="image/png, image/jpeg, image/webp"
              title="Arrastra tus imágenes aquí"
              button-text="Seleccionar archivo"
              hint="Puedes subir hasta 5 imágenes (JPG, PNG, WebP). Tamaño máx.: 5MB por imagen."
              @error="(msg) => alertStore.showError(msg)"
            />
          </div>

          <div class="tips-box">
            <h4>Consejos para tus fotos</h4>
            <ul>
              <li>
                <i class="fa-regular fa-circle-check"></i> Usa imágenes nítidas y con buena iluminación.
              </li>
              <li>
                <i class="fa-regular fa-circle-check"></i> Utiliza fondos claros y limpios.
              </li>
              <li>
                <i class="fa-regular fa-circle-check"></i> Muestra el producto desde varios ángulos.
              </li>
              <li>
                <i class="fa-regular fa-circle-check"></i> Formatos aceptados: JPG, PNG o WebP.
              </li>
              <li>
                <i class="fa-regular fa-circle-check"></i> Máximo 5MB por archivo.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Section 3: Details & Specs -->
      <div class="form-section">
        <h3 class="section-title">Detalles comerciales y envío</h3>
        <div class="details-grid">
          <!-- Left Column -->
          <div class="details-col">
            <div class="form-group">
              <label>Calidad del producto</label>
              <select v-model="quality">
                <option value="new">Nuevo / Original</option>
                <option value="used">Genérico / Reacondicionado</option>
              </select>
            </div>

            <div class="form-group">
              <label>Precio base unitario <span class="required">*</span></label>
              <div class="input-with-prefix" :class="{ 'input-error': formErrors.price }">
                <span class="prefix">C$</span>
                <input
                  type="number"
                  step="0.01"
                  v-model.number="price"
                  placeholder="0.00"
                  @input="clearFieldError('price')"
                />
              </div>
              <span v-if="formErrors.price" class="field-error-msg">{{ formErrors.price }}</span>
            </div>

            <div class="grid-row-2">
              <div class="form-group">
                <label>Cantidad mínima de compra <span class="required">*</span></label>
                <input
                  type="number"
                  min="1"
                  v-model.number="minQuantity"
                  placeholder="Ej. 1, 6, 12..."
                  :class="{ 'input-error': formErrors.minQuantity }"
                  @input="clearFieldError('minQuantity')"
                />
                <span v-if="formErrors.minQuantity" class="field-error-msg">{{ formErrors.minQuantity }}</span>
              </div>

              <div class="form-group">
                <label>Unidad de medida <span class="required">*</span></label>
                <select v-model="unit" :class="{ 'input-error': formErrors.unit }">
                  <option value="piece">Pieza / Unidad</option>
                  <option value="box">Caja</option>
                  <option value="package">Paquete</option>
                  <option value="lot">Lote</option>
                  <option value="pallet">Pallet</option>
                  <option value="set">Juego / Set</option>
                  <option value="roll">Rollo</option>
                  <option value="system">Sistema</option>
                  <option value="service">Servicio</option>
                  <option value="contract">Contrato</option>
                </select>
                <span v-if="formErrors.unit" class="field-error-msg">{{ formErrors.unit }}</span>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="details-col">
            <div class="form-group">
              <label>Métodos de envío disponibles <span class="required">*</span></label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    value="bus"
                    v-model="shippingMethods"
                    @change="clearFieldError('shippingMethods')"
                  />
                  Bus interlocal
                </label>
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    value="own_delivery"
                    v-model="shippingMethods"
                    @change="clearFieldError('shippingMethods')"
                  />
                  Entrega propia / Paquetería
                </label>
              </div>
              <span v-if="formErrors.shippingMethods" class="field-error-msg">{{ formErrors.shippingMethods }}</span>
            </div>

            <div class="form-group mt-3">
              <label>Stock referencial inicial</label>
              <p class="sub-label">Cantidad estimada disponible en bodega.</p>
              <div class="input-with-prefix">
                <span class="prefix">Und</span>
                <input
                  type="number"
                  v-model.number="stock"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="form-actions">
        <router-link
          to="/dashboard/provider-products"
          class="btn-cancel"
        >
          Cancelar
        </router-link>
        <div class="right-actions">
          <button
            type="submit"
            class="btn-publish"
            :disabled="isSubmitting"
          >
            <i v-if="isSubmitting" class="fa-solid fa-spinner fa-spin"></i>
            <span>{{ isSubmitting ? "Publicando producto..." : "Publicar producto" }}</span>
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
.add-product-page {
  max-width: 1100px;
  margin: 0 auto;
  color: #333;
}

.breadcrumb {
  font-size: 0.85rem;
  color: #189c94;
  margin-bottom: 0.5rem;
}

.breadcrumb a {
  color: #888;
  text-decoration: none;
}

.breadcrumb .separator {
  margin: 0 0.5rem;
  color: #888;
}

.breadcrumb .current {
  color: #189c94;
  font-weight: 500;
}

.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #083c5a;
  margin-bottom: 1.5rem;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 1.5rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #083c5a;
  margin-top: 0;
  margin-bottom: 1.2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
}

.required {
  color: var(--primary-orange, #ff6a00);
}

.sub-label {
  font-size: 0.75rem;
  color: #888;
  margin: -0.2rem 0 0.2rem 0;
}

input[type="text"],
input[type="number"],
select,
textarea {
  width: 100%;
  padding: 0.65rem 1rem;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #333;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #189c94;
}

.input-error {
  border-color: #ef4444 !important;
  background-color: #fffafb;
}

.field-error-msg {
  color: #ef4444;
  font-size: 0.78rem;
  font-weight: 500;
  margin-top: 0.15rem;
}

textarea {
  resize: vertical;
  min-height: 120px;
}

.textarea-wrapper {
  position: relative;
}

.char-count {
  position: absolute;
  bottom: 0.5rem;
  right: 0.8rem;
  font-size: 0.75rem;
  color: #aaa;
}

.grid-row-3 {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 1.5rem;
}

.grid-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.col-span-2 {
  grid-column: span 2;
}

.mt-4 {
  margin-top: 1rem;
}
.mt-3 {
  margin-top: 0.75rem;
}

.photos-container {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.dropzone-wrapper {
  flex: 1;
  min-width: 0;
}

.tips-box {
  width: 300px;
  background: #f2f9f8;
  border-radius: 8px;
  padding: 1.25rem;
  flex-shrink: 0;
}

.tips-box h4 {
  color: #189c94;
  font-size: 0.9rem;
  margin-top: 0;
  margin-bottom: 1rem;
}

.tips-box ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.tips-box li {
  font-size: 0.8rem;
  color: #444;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.tips-box li i {
  color: #189c94;
  margin-top: 0.15rem;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
}

.details-col {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.input-with-prefix {
  display: flex;
  align-items: stretch;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  overflow: hidden;
}

.input-with-prefix:focus-within {
  border-color: #189c94;
}

.input-with-prefix .prefix {
  background: #f5f5f5;
  padding: 0 0.8rem;
  display: flex;
  align-items: center;
  color: #666;
  font-size: 0.9rem;
  border-right: 1px solid #d0d0d0;
}

.input-with-prefix input {
  border: none;
  border-radius: 0;
  flex: 1;
}

.input-with-prefix input:focus {
  border: none;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 0.25rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal !important;
  font-size: 0.9rem !important;
  color: #333 !important;
  cursor: pointer;
}

.checkbox-label input {
  accent-color: #189c94;
  width: 16px;
  height: 16px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  margin-bottom: 2rem;
}

.btn-cancel {
  padding: 0.6rem 1.25rem;
  border: 1px solid #e14e4e;
  color: #e14e4e;
  background: transparent;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #fdf2f2;
}

.right-actions {
  display: flex;
  gap: 1rem;
}

.btn-publish {
  padding: 0.6rem 1.5rem;
  border: none;
  color: #fff;
  background: #ff6a00;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-publish:hover:not(:disabled) {
  background: #e05e00;
}

.btn-publish:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .grid-row-3 {
    grid-template-columns: 1fr;
  }
  .col-span-2 {
    grid-column: span 1;
  }
  .photos-container {
    flex-direction: column;
  }
  .tips-box {
    width: 100%;
    box-sizing: border-box;
  }
  .details-grid {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
}
</style>
