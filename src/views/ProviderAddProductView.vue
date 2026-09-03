<script setup lang="ts">
import { ref } from "vue";
import { useAlertStore } from "@/stores/alertStore";
import BaseFileDropZone from "@/components/common/BaseFileDropZone.vue";

const alertStore = useAlertStore();

const productName = ref("");
const brand = ref("");
const category = ref("");
const description = ref("");
const quality = ref("");
const price = ref("");
const minQuantity = ref("");
const unit = ref("");
const shippingMethods = ref(["bus"]);
const stock = ref("");
const productPhotos = ref<File[]>([]);
</script>

<template>
  <div class="add-product-page">
    <div class="breadcrumb">
      <router-link to="/dashboard/provider-products">Mis Productos</router-link>
      <span class="separator">&gt;</span>
      <span class="current">Agregar nuevo producto</span>
    </div>

    <h1 class="page-title">Agregar nuevo producto</h1>

    <div class="form-container">
      <!-- Section 1 -->
      <div class="form-section">
        <div class="grid-row-3">
          <div class="form-group col-span-2">
            <label>1. Nombre del producto *</label>
            <input
              type="text"
              v-model="productName"
              placeholder="Ej. Audífonos Bluetooth Sony WH-CH520"
            />
          </div>
          <div class="form-group">
            <label>2. Marca *</label>
            <input
              type="text"
              v-model="brand"
              placeholder="Escribe la marca"
            />
          </div>
          <div class="form-group">
            <label>3. Categoría *</label>
            <select v-model="category">
              <option value="" disabled>Selecciona una categoría</option>
              <option value="electronics">Electrónica</option>
              <option value="clothing">Ropa</option>
              <option value="home">Hogar</option>
            </select>
          </div>
        </div>

        <div class="form-group mt-4">
          <label>4. Descripción del producto *</label>
          <div class="textarea-wrapper">
            <textarea
              v-model="description"
              placeholder="Describe tu producto, sus características y beneficios..."
              maxlength="2000"
            ></textarea>
            <span class="char-count">{{ description.length }}/2000</span>
          </div>
        </div>
      </div>

      <!-- Section 2: Photos -->
      <div class="form-section">
        <h3 class="section-title">5. Fotografías del producto *</h3>
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
                <i class="fa-regular fa-circle-check"></i> Usa imágenes nítidas
                y bien iluminadas
              </li>
              <li>
                <i class="fa-regular fa-circle-check"></i> Fondo claro y
                sencillo
              </li>
              <li>
                <i class="fa-regular fa-circle-check"></i> Muestra el producto
                desde varios ángulos
              </li>
              <li>
                <i class="fa-regular fa-circle-check"></i> Formato recomendado:
                JPG, PNG o WebP
              </li>
              <li>
                <i class="fa-regular fa-circle-check"></i> Tamaño máximo: 5MB
                por imagen
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Section 3: Details -->
      <div class="form-section">
        <h3 class="section-title">Detalles del producto</h3>
        <div class="details-grid">
          <!-- Left Column -->
          <div class="details-col">
            <div class="form-group">
              <label>6. Calidad *</label>
              <select v-model="quality">
                <option value="" disabled>Selecciona la calidad</option>
                <option value="new">Nuevo</option>
                <option value="used">Usado</option>
              </select>
            </div>
            <div class="form-group">
              <label>7. Precio por unidad *</label>
              <div class="input-with-prefix">
                <span class="prefix">C$</span>
                <input
                  type="number"
                  v-model="price"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div class="grid-row-2">
              <div class="form-group">
                <label>8. Cantidad mínima de compra *</label>
                <input
                  type="text"
                  v-model="minQuantity"
                  placeholder="Ej. 1, 6, 12..."
                />
              </div>
              <div class="form-group">
                <label>9. Unidad</label>
                <select v-model="unit">
                  <option value="" disabled>Seleccionar</option>
                  <option value="unit">Unidad</option>
                  <option value="box">Caja</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="details-col">
            <div class="form-group">
              <label>10. Tipo de envío disponible *</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    value="bus"
                    v-model="shippingMethods"
                  />
                  Bus interlocal
                </label>
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    value="courier"
                    v-model="shippingMethods"
                  />
                  Empresas de paquetería
                </label>
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    value="pickup"
                    v-model="shippingMethods"
                  />
                  Retiro en tienda
                </label>
              </div>
            </div>
            <div class="form-group mt-3">
              <label>11. Stock disponible *</label>
              <p class="sub-label">Gestiona el stock para este producto.</p>
              <div class="input-with-prefix">
                <span class="prefix">Und</span>
                <input
                  type="number"
                  v-model="stock"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions Footer -->
    <div class="form-actions">
      <router-link
        to="/dashboard/provider-products"
        class="btn-cancel"
      >
        Cancelar
      </router-link>
      <div class="right-actions">
        <button class="btn-draft">Guardar borrador</button>
        <button class="btn-publish">Publicar producto</button>
      </div>
    </div>
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

/* Form inputs styling */
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

/* Grids */
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

/* Photos Section */
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

/* Details Section */
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

/* Footer Actions */
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

.btn-draft {
  padding: 0.6rem 1.25rem;
  border: 1px solid #d0d0d0;
  color: #555;
  background: #fff;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s;
  cursor: pointer;
}

.btn-draft:hover {
  background: #f5f5f5;
  border-color: #bbb;
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
}

.btn-publish:hover {
  background: #e05e00;
}

/* Responsive */
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
