<script setup lang="ts">
import imagotipoImg from "../../assets/1.1 Imagotipo variacion.png";
</script>

<template>
  <footer class="footer">
    <div class="container footer-content">
      <div class="footer-info">
        <img
          :src="imagotipoImg"
          alt="Mercanto"
          class="footer-logo"
        />
        <p><i class="fa-regular fa-envelope"></i> mercanto@gmail.com</p>
        <p><i class="fa-brands fa-whatsapp"></i> +505 88662233</p>
        <p><i class="fa-solid fa-location-dot"></i> Managua, Nicaragua</p>
      </div>

      <div class="footer-links">
        <a href="#">Política de privacidad</a>
        <router-link :to="{ name: 'home', hash: '#categorias' }">Categorías</router-link>
        <router-link :to="{ name: 'home', hash: '#proveedores' }">Proveedores</router-link>
        <router-link :to="{ name: 'home', hash: '#inicio' }">Productos</router-link>
        <router-link :to="{ name: 'home', hash: '#como-funciona' }">Cómo funciona la plataforma</router-link>
      </div>

      <div class="footer-cta">
        <h4>CONVIÉRTETE EN PROVEEDOR</h4>
        <p>¿Eres exportador o distribuidor mayorista?</p>
        <router-link :to="{ name: 'provider-register' }" class="btn-cta">
          Regístrate hoy
        </router-link>
      </div>
    </div>
    <div class="footer-bottom">
      <p>Mercanto S.A 2026. Todos los derechos reservados.</p>
    </div>
  </footer>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.footer {
  background-color: var(--primary-blue, #083c5a);
  color: #ffffff;
  padding: 3.5rem 0 1.5rem;
  width: 100%;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 2.5rem;
}

.footer-info {
  max-width: 320px;
}

.footer-logo {
  height: 48px;
  margin-bottom: 1.25rem;
}

.footer-info p {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.75rem;
  color: #cbd5e1;
  font-size: 0.9rem;
}

.footer-links {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.footer-links a {
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s ease;
}

.footer-links a:hover {
  color: var(--primary-orange, #ff6a00);
}

.footer-cta {
  text-align: center;
}

.footer-cta h4 {
  color: var(--primary-orange, #ff6a00);
  font-weight: 700;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.footer-cta p {
  color: #cbd5e1;
  margin-bottom: 1.25rem;
  font-size: 0.9rem;
}

.btn-cta {
  background-color: var(--primary-orange, #ff6a00);
  color: #ffffff;
  padding: 0.65rem 1.6rem;
  border-radius: 20px;
  text-decoration: none;
  font-weight: 600;
  display: inline-block;
  transition: background-color 0.2s ease;
}

.btn-cta:hover {
  background-color: var(--primary-orange-hover, #e66000);
}

.footer-bottom {
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding-top: 1.5rem;
  color: #94a3b8;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    text-align: center;
    gap: 2rem;
  }

  .footer-info p {
    justify-content: center;
  }
}
</style>
