<script setup lang="ts">

</script>

<template>
  <section id="inicio" class="hero">
    <div class="hero-text">
      <h1>
        Encuentra los<br />mejores<br />
        <span class="highlight">distribuidores<br />mayoristas</span><br />
        para tu negocio
      </h1>
      <p>
        Compra al por mayor de manera fácil, segura y confiable.<br />
        Conecta con proveedores verificados y haz crecer tu negocio hoy.
      </p>
      <div class="search-bar">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input
          type="text"
          placeholder="¿Qué producto estás buscando?"
        />
        <button class="btn-primary">Buscar productos</button>
      </div>
    </div>

    <div class="hero-image-wrapper">
      <div class="hero-tag">
        <i class="fa-solid fa-bag-shopping"></i> Plataforma de comercio #1 en Nicaragua
      </div>
      <img
        src="@/assets/hero.png"
        alt="Distribución mayorista"
        class="hero-img"
      />
    </div>
  </section>
</template>

<style scoped>
.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  gap: 2rem;
  box-sizing: border-box;
}

.hero-text {
  flex: 1.1;
  max-width: 600px;
  position: relative;
}

.hero-text h1 {
  font-size: 3.2rem;
  line-height: 1.15;
  color: var(--primary-blue);
  margin-bottom: 1.2rem;
}

.hero-text h1 .highlight {
  color: var(--primary-orange);
}

.hero-text p {
  font-size: 1.05rem;
  color: #4a5568;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.search-bar {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid var(--border-gray);
  border-radius: 30px;
  padding: 0.4rem 0.4rem 0.4rem 1.2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.search-bar i {
  color: #a0aec0;
  margin-right: 0.75rem;
}

.search-bar input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.95rem;
  color: var(--text-dark);
}

.btn-primary {
  background-color: var(--primary-orange);
  color: #ffffff;
  padding: 0.65rem 1.4rem;
  border-radius: 20px;
  text-decoration: none;
  font-weight: 600;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.btn-primary:hover {
  background-color: var(--primary-orange-hover, #e66000);
  transform: translateY(-2px);
}

.hero-image-wrapper {
  flex: 0.9;
  position: relative;
  display: flex;
  justify-content: center;
}

.hero-tag {
  position: absolute;
  top: -15px;
  right: 10px;
  background-color: var(--light-teal);
  color: var(--primary-blue);
  padding: 0.45rem 1rem;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  z-index: 2;
}

.hero-img {
  max-width: 100%;
  height: auto;
  border-radius: 20px;
  object-fit: cover;
}

@media (max-width: 1024px) {
  .hero-text h1 {
    font-size: 2.6rem;
  }
}

@media (max-width: 768px) {
  .hero {
    flex-direction: column-reverse;
    justify-content: center;
    text-align: center;
    padding: 4rem 1rem;
  }

  .search-bar {
    flex-direction: column;
    border-radius: 16px;
    padding: 0.75rem;
    gap: 0.5rem;
  }

  .search-bar input {
    width: 100%;
  }

  .search-bar .btn-primary {
    width: 100%;
    border-radius: 10px;
  }
}

@media (max-width: 480px) {
  .hero-text h1 {
    font-size: 1.8rem;
  }
}
</style>
