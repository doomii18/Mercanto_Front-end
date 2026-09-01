<script setup lang="ts">

</script>

<template>
  <main class="privacy-page">
    <section id="politicas" class="policies-section">
      <div class="container">
        <div class="policies-header">
          <div class="policies-text">
            <h2>
              Políticas de<br />
              <span class="highlight">privacidad</span>
              <div class="bubbles-decoration">
                <div class="bubble b-orange"></div>
                <div class="bubble b-teal"></div>
                <div class="bubble b-light"></div>
                <div class="bubble b-dark"></div>
              </div>
            </h2>
            <p>
              En Mercanto protegemos tu información, tus compras y tu negocio con medidas de
              seguridad diseñadas para ofrecerte una experiencia segura, confiable y transparente.
            </p>
          </div>
          <div class="policies-image">
            <img src="@/assets/security_illustration.png" alt="Seguridad Mercanto" class="sec-img" />
          </div>
        </div>

        <div class="commitments">
          <h3>Nuestros compromisos</h3>
          <div class="cards-grid cols-4">
            <div class="policy-card">
              <div class="card-icon"><i class="fa-solid fa-shield"></i></div>
              <p>Tu información personal y empresarial se almacena de forma segura y nunca se comparte con terceros sin tu autorización.</p>
            </div>
            <div class="policy-card">
              <div class="card-icon"><i class="fa-solid fa-lock"></i></div>
              <p>Las transacciones se realizan mediante pasarelas certificadas y con protocolos de seguridad avanzados.</p>
            </div>
            <div class="policy-card">
              <div class="card-icon stacked-icon">
                <i class="fa-solid fa-certificate badge-bg"></i>
                <i class="fa-solid fa-check badge-check"></i>
              </div>
              <p>
                Validamos el<br />
                RUC y los datos<br />
                de cada<br />
                proveedor para<br />
                garantizar<br />
                negocios<br />
                confiables.
              </p>
            </div>
            <div class="policy-card">
              <div class="card-icon"><i class="fa-solid fa-credit-card"></i></div>
              <p>Tus cuentas cuentan con autenticación segura y protección de sesiones para evitar accesos no autorizados.</p>
            </div>
          </div>
        </div>

        <div class="recommendations">
          <h3>Recomendaciones para los usuarios</h3>
          <div class="cards-grid cols-3">
            <div class="policy-card rec-card">
              <div class="card-icon blue-icon"><i class="fa-solid fa-display"></i></div>
              <p>No compartas tu contraseña con nadie y cámbiala periódicamente.</p>
            </div>
            <div class="policy-card rec-card">
              <div class="card-icon blue-icon"><i class="fa-regular fa-message"></i></div>
              <p>Comunícate solo desde Mercanto mediante nuestro chat interno para conversaciones.</p>
            </div>
            <div class="policy-card rec-card">
              <div class="card-icon blue-icon"><i class="fa-solid fa-box-open"></i></div>
              <p>Confirma la recepción de tus pedidos dentro de la plataforma.</p>
            </div>
          </div>
        </div>

        <div class="trust-banner">
          <div class="trust-content">
            <div class="trust-icon"><i class="fa-solid fa-shield"></i></div>
            <div class="trust-text">
              <h4>Compra con confianza</h4>
              <p>Nuestro compromiso es ofrecer una plataforma segura para proveedores y comerciantes de toda Nicaragua</p>
            </div>
            <router-link :to="{ name: 'home' }" class="btn-trust">Ver proveedores</router-link>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.privacy-page {
  width: 100%;
  min-height: calc(100vh - 80px);
  overflow-x: hidden;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.policies-section {
  display: flex;
  flex-direction: column;
  background-color: #f6f3eb;
  padding: 4rem 0;
}

.policies-section .container {
  display: flex;
  flex-direction: column;
  gap: 4rem;
}

.policies-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.policies-text {
  flex: 1;
}

.policies-text h2 {
  font-size: 2.8rem;
  color: var(--primary-blue);
  line-height: 1.1;
  margin-bottom: 1rem;
  position: relative;
  display: inline-block;
}

.policies-text .highlight {
  color: var(--primary-orange);
}

.bubbles-decoration {
  position: absolute;
  right: -80px;
  top: 10px;
  width: 100px;
  height: 100px;
  pointer-events: none;
}

.bubble {
  position: absolute;
  border-radius: 50%;
}

.b-orange {
  width: 60px;
  height: 60px;
  background-color: var(--primary-orange);
  bottom: 0;
  left: 20px;
  z-index: 2;
}

.b-teal {
  width: 45px;
  height: 45px;
  background-color: var(--light-teal, #189c94);
  top: 15px;
  right: 0;
  z-index: 1;
}

.b-light {
  width: 25px;
  height: 25px;
  background-color: #8cc6c1;
  top: 0;
  left: 30px;
}

.b-dark {
  width: 25px;
  height: 25px;
  background-color: var(--primary-blue);
  bottom: -5px;
  right: 15px;
  z-index: 3;
}

.policies-text p {
  font-size: 1.05rem;
  color: #4a5568;
  line-height: 1.6;
  max-width: 500px;
}

.policies-image {
  flex: 1;
  display: flex;
  justify-content: center;
}

.sec-img {
  max-width: 100%;
  height: auto;
}

.commitments h3,
.recommendations h3 {
  text-align: center;
  font-size: 1.8rem;
  color: var(--primary-blue);
  margin-bottom: 2rem;
}

.cards-grid {
  display: grid;
  gap: 1.5rem;
}

.cards-grid.cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

.cards-grid.cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

.policy-card {
  background: transparent;
  border: 2px solid var(--light-teal, #189c94);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.rec-card {
  border-color: var(--primary-orange);
  flex-direction: row;
  text-align: left;
  align-items: flex-start;
  gap: 1rem;
}

.card-icon {
  font-size: 2rem;
  color: var(--primary-orange);
  margin-bottom: 1rem;
}

.stacked-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
}

.stacked-icon .badge-bg {
  font-size: 2.5rem;
  color: var(--primary-orange);
  position: absolute;
}

.stacked-icon .badge-check {
  font-size: 1.2rem;
  color: #ffffff;
  position: relative;
  z-index: 2;
}

.rec-card .card-icon {
  margin-bottom: 0;
  font-size: 2.2rem;
}

.rec-card .blue-icon {
  color: var(--light-teal, #189c94);
}

.policy-card p {
  font-size: 0.9rem;
  color: var(--primary-blue);
  font-weight: 500;
  line-height: 1.4;
  margin: 0;
}

.trust-banner {
  background: var(--light-teal, #6cc4bc);
  border-radius: 16px;
  padding: 2rem;
  margin-top: 2rem;
  position: relative;
}

.trust-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  color: var(--text-dark, #333);
}

.trust-icon {
  font-size: 4rem;
  color: var(--primary-orange);
}

.trust-text {
  flex: 1;
}

.trust-text h4 {
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  color: var(--primary-blue);
}

.trust-text p {
  margin: 0;
  font-size: 1.05rem;
  color: var(--primary-blue);
}

.btn-trust {
  background: var(--primary-orange);
  color: #fff;
  text-decoration: none;
  padding: 0.75rem 1.5rem;
  border-radius: 20px;
  font-weight: 600;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-trust:hover {
  background: #e66000;
}

@media (max-width: 1024px) {
  .cards-grid.cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
  .policies-header {
    flex-direction: column;
    text-align: center;
  }
  .policies-text p {
    margin: 0 auto;
  }
}

@media (max-width: 768px) {
  .cards-grid.cols-3 {
    grid-template-columns: 1fr;
  }
  .trust-content {
    flex-direction: column;
    text-align: center;
  }
}
</style>
