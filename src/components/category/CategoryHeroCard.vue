<script setup lang="ts">
import audifonosImg from "../../assets/audifonos.png";

interface Props {
  title?: string;
  description?: string;
  productCount?: number;
  imageSrc?: string;
}

withDefaults(defineProps<Props>(), {
  title: "Artículos Tecnológicos",
  description: "Encuentra los mejores artículos tecnológicos al por mayor para tu negocio",
  productCount: 200,
  imageSrc: audifonosImg,
});
</script>

<template>
  <section class="category-hero">
    <div class="hero-left">
      <img :src="imageSrc" :alt="title" class="hero-image-main" />
    </div>
    <div class="hero-center">
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
      <div class="badge-products">
        <i class="fa-solid fa-bag-shopping"></i>
        <span>{{ productCount }} Productos disponibles</span>
      </div>
    </div>
    <div class="hero-right">
      <div class="circles-graphic">
        <div class="circle circle-teal"></div>
        <div class="circle circle-orange"></div>
        <div class="circle circle-darkblue"></div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.category-hero {
  background-color: #ffffff;
  border: 1px solid #dcdcdc;
  border-radius: 20px;
  padding: 2.5rem;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  align-items: center;
  gap: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
}

.hero-left {
  display: flex;
  justify-content: center;
}

.hero-image-main {
  max-height: 150px;
  object-fit: contain;
}

.hero-center h1 {
  font-size: 2.2rem;
  color: #023859;
  margin-bottom: 0.8rem;
  font-weight: 700;
}

.hero-center p {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.badge-products {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #e2f4f2;
  color: #00a896;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.hero-right {
  display: flex;
  justify-content: flex-end;
}

.circles-graphic {
  position: relative;
  width: 120px;
  height: 120px;
}

.circle {
  position: absolute;
  width: 50px;
  height: 50px;
  border-radius: 50%;
}

.circle-teal {
  background-color: #00a896;
  top: 25px;
  left: 10px;
  z-index: 2;
}

.circle-orange {
  background-color: #ff6a00;
  top: 5px;
  left: 45px;
  z-index: 1;
}

.circle-darkblue {
  background-color: #023859;
  top: 50px;
  left: 45px;
  z-index: 3;
}
</style>
