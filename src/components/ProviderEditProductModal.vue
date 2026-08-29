<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  productId: number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

// Form data based on the design
const productName = ref('Audífonos Bluetooth Sony WH-CH520');
const brand = ref('Sony');
const category = ref('Artículos tecnológicos');
const description = ref('Audífonos inalámbricos con conexión Bluetooth, diseño ligero y cómodo, batería de larga duración y sonido nítido. Manos libres para llamadas y asistente de voz.');
const quality = ref('Original');
const price = ref('1850.00');
const minQuantity = ref('1');
const unit = ref('Unidad');
const prepTime = ref('1 - 2 días hábiles');
const shippingMethods = ref(['bus', 'pickup']);
const stock = ref('250');

function close() {
  emit('close');
}
</script>

<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal-card">
      <div class="modal-header">
        <h2 class="modal-title">Editar producto</h2>
        <button class="btn-close" @click="close">
          <i class="fa-regular fa-circle-xmark"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="form-columns">
          <!-- Left Column -->
          <div class="form-col">
            <h3 class="section-title">Información general</h3>
            
            <div class="form-group">
              <label>1. Nombre del producto *</label>
              <input type="text" v-model="productName" />
            </div>

            <div class="grid-row-2">
              <div class="form-group">
                <label>2. Marca *</label>
                <input type="text" v-model="brand" />
              </div>
              <div class="form-group">
                <label>3. Categoría *</label>
                <select v-model="category">
                  <option value="Artículos tecnológicos">Artículos tecnológicos</option>
                  <option value="Computación">Computación</option>
                </select>
              </div>
            </div>

            <div class="form-group mt-3">
              <label>4. Descripción del producto *</label>
              <div class="textarea-wrapper">
                <textarea v-model="description" maxlength="2000"></textarea>
                <span class="char-count">{{ description.length }}/2000</span>
              </div>
            </div>

            <div class="form-group mt-3">
              <label>5. Fotografías del producto *</label>
              <div class="photos-row">
                <div class="photo-thumb">
                  <span class="badge-principal">PRINCIPAL</span>
                  <div class="thumb-img-placeholder"><i class="fa-solid fa-headphones"></i></div>
                </div>
                <div class="photo-thumb">
                  <div class="thumb-img-placeholder"><i class="fa-solid fa-headset"></i></div>
                </div>
                <div class="photo-thumb">
                  <div class="thumb-img-placeholder"><i class="fa-solid fa-headphones-simple"></i></div>
                </div>
                <div class="photo-thumb">
                  <div class="thumb-img-placeholder"><i class="fa-solid fa-music"></i></div>
                </div>
                <button class="btn-add-photo">
                  <i class="fa-solid fa-plus"></i>
                  <span>Agregar</span>
                </button>
              </div>
              <p class="photo-hint">Formatos soportados: JPG, JPEG, PNG. Peso máximo: 5MB por imagen.</p>
            </div>
          </div>

          <!-- Right Column -->
          <div class="form-col">
            <h3 class="section-title">Detalles del producto</h3>
            
            <div class="grid-row-2">
              <div class="form-group">
                <label>6. Calidad *</label>
                <select v-model="quality">
                  <option value="Original">Original</option>
                  <option value="Genérico">Genérico</option>
                </select>
              </div>
              <div class="form-group">
                <label>7. Precio por unidad *</label>
                <div class="input-with-prefix">
                  <span class="prefix">C$</span>
                  <input type="text" v-model="price" />
                </div>
              </div>
            </div>

            <div class="grid-row-2 mt-3">
              <div class="form-group">
                <label>8. Cantidad mínima de compra *</label>
                <input type="text" v-model="minQuantity" />
              </div>
              <div class="form-group">
                <label>Unidad</label>
                <select v-model="unit">
                  <option value="Unidad">Unidad</option>
                  <option value="Caja">Caja</option>
                </select>
              </div>
            </div>

            <div class="form-group mt-3">
              <label>9. Tiempo estimado de preparación *</label>
              <select v-model="prepTime">
                <option value="1 - 2 días hábiles">1 - 2 días hábiles</option>
                <option value="3 - 5 días hábiles">3 - 5 días hábiles</option>
              </select>
            </div>

            <div class="form-group mt-3">
              <label class="bold-label">10. Tipo de envío disponible *</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" value="bus" v-model="shippingMethods" />
                  Bus interlocal
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" value="courier" v-model="shippingMethods" />
                  Empresas de paquetería
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" value="pickup" v-model="shippingMethods" />
                  Retiro en tienda
                </label>
              </div>
            </div>

            <div class="form-group mt-4">
              <label class="bold-label">11. Stock disponible *</label>
              <p class="sub-label">Gestiona el stock para este producto.</p>
              <input type="number" v-model="stock" />
              
              <div class="info-alert mt-2">
                <i class="fa-solid fa-circle-info"></i>
                <span>El stock se actualizará automáticamente cuando recibas nuevos pedidos.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="close">Cancelar</button>
        <div class="right-actions">
          <button class="btn-save">Guardar cambios</button>
          <button class="btn-update">Actualizar producto</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  box-sizing: border-box;
}

.modal-card {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 1100px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 1.4rem;
  color: #083c5a;
  font-weight: 700;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #083c5a;
  cursor: pointer;
  padding: 0;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.form-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.5rem;
}

.form-col {
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #083c5a;
  margin-top: 0;
  margin-bottom: 1.25rem;
}

/* Form styling */
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

.bold-label {
  font-size: 0.95rem !important;
  color: #1a1a1a !important;
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
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #333;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
}

input:focus, select:focus, textarea:focus {
  border-color: #189c94;
}

textarea {
  resize: vertical;
  min-height: 80px;
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

.grid-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.mt-3 {
  margin-top: 1rem;
}
.mt-4 {
  margin-top: 1.5rem;
}
.mt-2 {
  margin-top: 0.5rem;
}

/* Photos */
.photos-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.photo-thumb {
  width: 70px;
  height: 70px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #f9f9f9;
}

.badge-principal {
  position: absolute;
  top: 0;
  left: 0;
  background: #189c94;
  color: #fff;
  font-size: 0.5rem;
  font-weight: 700;
  padding: 0.15rem 0.3rem;
  border-bottom-right-radius: 6px;
  z-index: 2;
}

.thumb-img-placeholder {
  font-size: 1.8rem;
  color: #333;
  opacity: 0.8;
}

.btn-add-photo {
  width: 70px;
  height: 70px;
  border: 1px dashed #d0d0d0;
  border-radius: 8px;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  color: #888;
  cursor: pointer;
  font-size: 0.75rem;
}

.btn-add-photo i {
  font-size: 1rem;
}

.photo-hint {
  font-size: 0.75rem;
  color: #888;
  margin-top: 0.5rem;
}

/* Details specific */
.input-with-prefix {
  display: flex;
  align-items: stretch;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.input-with-prefix:focus-within {
  border-color: #189c94;
}

.input-with-prefix .prefix {
  background: #fdfdfd;
  padding: 0 0.8rem;
  display: flex;
  align-items: center;
  color: #333;
  font-size: 0.9rem;
  border-right: 1px solid #e0e0e0;
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

.info-alert {
  background: #effaf9;
  border: 1px solid #d3f0ed;
  border-radius: 6px;
  padding: 0.6rem 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #189c94;
  font-size: 0.8rem;
}

/* Footer */
.modal-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
}

.btn-cancel {
  padding: 0.5rem 1.5rem;
  border: 1px solid #e0e0e0;
  background: #fff;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #555;
  cursor: pointer;
}

.right-actions {
  display: flex;
  gap: 1rem;
}

.btn-save {
  padding: 0.5rem 1.5rem;
  border: 1px solid #189c94;
  color: #189c94;
  background: #fff;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-update {
  padding: 0.5rem 1.5rem;
  border: none;
  color: #fff;
  background: #ff6a00;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

@media (max-width: 768px) {
  .form-columns {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>
