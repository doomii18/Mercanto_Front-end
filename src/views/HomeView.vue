<script setup lang="ts">
import { onMounted, ref } from "vue";
import { authManager } from "../modules/auth";
import { healthApi, categoryApi } from "../api";
import "../styles/home.css";

const navLinks = ref<HTMLElement | null>(null);
const authButtons = ref<HTMLElement | null>(null);
const menuIcon = ref<HTMLElement | null>(null);
const carousel = ref<HTMLElement | null>(null);

interface CategoryView {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  productCount: number; // TODO: wire to real data
}

const categories = ref<CategoryView[]>([]);

function handleMenuToggle() {
    if (!navLinks.value || !authButtons.value) return;
    const isOpen = navLinks.value.classList.toggle("open");
    authButtons.value.classList.toggle("open", isOpen);
    if (menuIcon.value) {
        menuIcon.value.className = isOpen
            ? "fa-solid fa-xmark"
            : "fa-solid fa-bars";
    }
}

function closeMenu() {
    if (!navLinks.value || !authButtons.value) return;
    navLinks.value.classList.remove("open");
    authButtons.value.classList.remove("open");
    if (menuIcon.value) {
        menuIcon.value.className = "fa-solid fa-bars";
    }
}

function handlePrevClick() {
    carousel.value?.scrollBy({ left: -244, behavior: "smooth" });
}

function handleNextClick() {
    carousel.value?.scrollBy({ left: 244, behavior: "smooth" });
}

onMounted(async () => {
    await authManager.initialize();
    await healthApi.getReadiness();

    try {
        const response = await categoryApi.getCategories({ limit: 50 });
        const loaded = await Promise.all(
            response.data.map(async (cat) => {
                let imageUrl: string | null = null;
                if (cat.image_blob_id) {
                    try {
                        imageUrl = await categoryApi.getCategoryImageBlobUrl(cat.image_blob_id);
                    } catch (e) {
                        console.warn(`Failed to load category image for ${cat.name}:`, e);
                    }
                }
                return {
                    id: cat.id,
                    name: cat.name,
                    description: cat.description,
                    imageUrl,
                    productCount: Math.floor(Math.random() * 600) + 50, // mock
                };
            })
        );
        categories.value = loaded;
    } catch (err) {
        console.error("Failed to load categories:", err);
    }
});
</script>

<template>
    <header class="header">
        <div class="container header-content">
            <div class="logo">
                <img
                    src="../assets/logo.png"
                    style="height: 45px"
                    alt="Mercanto"
                />
            </div>
            <button
                class="mobile-menu-btn"
                aria-label="Abrir menú"
                @click="handleMenuToggle"
            >
                <i ref="menuIcon" class="fa-solid fa-bars" id="menu-icon"></i>
            </button>
            <nav ref="navLinks" class="nav-links">
                <a href="#inicio" @click="closeMenu">Inicio</a>
                <a href="#categorias" @click="closeMenu">Categorías</a>
                <a href="#proveedores" @click="closeMenu">Proveedores</a>
                <a href="#como-funciona" @click="closeMenu">Como funciona</a>
            </nav>
            <div ref="authButtons" class="auth-buttons">
                <a href="login.html" class="login">Iniciar sesión</a>
                <a href="registro.html" class="btn-primary">Registrarse</a>
            </div>
        </div>
    </header>

    <main>
        <section id="inicio" class="hero container">
            <div class="hero-text">
                <h1>
                    Encuentra los<br />mejores<br />
                    <span class="highlight">distribuidores<br />mayoristas</span
                    ><br />
                    para tu negocio
                </h1>
                <div class="shield-icon">
                    <i class="fa-solid fa-shield-check"></i>
                </div>
                <p>
                    Compra al por mayor de manera fácil, segura y confiable.<br />
                    Conecta con proveedores verificados y haz crecer tu negocio
                    hoy.
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
                <div class="tag">
                    <i class="fa-solid fa-bag-shopping"></i> Plataforma de
                    comercio #1 en Nicaragua
                </div>
                <img
                    src="../assets/hero.png"
                    alt="Delivery con cajas"
                    class="hero-img"
                />
            </div>
        </section>

        <section class="features container">
            <div class="feature">
                <div class="icon-circle">
                    <i class="fa-solid fa-shield-halved"></i>
                </div>
                <span>Proveedores verificados</span>
            </div>
            <div class="divider"></div>
            <div class="feature">
                <span>Precios competitivos</span>
            </div>
            <div class="divider"></div>
            <div class="feature">
                <i class="fa-solid fa-truck"></i>
                <span>Envíos a todo el país</span>
            </div>
            <div class="divider"></div>
            <div class="feature">
                <i class="fa-solid fa-bus"></i>
                <span>Ahorraté el viaje</span>
            </div>
        </section>

        <section id="categorias" class="categories container">
            <div class="categories-header">
                <h2>Categorías</h2>
                <p>Explora todas nuestras categorías de productos para ti</p>
            </div>
            <div class="carousel-wrapper">
                <button class="carousel-btn prev" @click="handlePrevClick" aria-label="Anterior">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>

                <div ref="carousel" class="categories-box">
                    <div
                        v-for="cat in categories"
                        :key="cat.id"
                        class="category-card"
                    >
                        <img
                            v-if="cat.imageUrl"
                            :src="cat.imageUrl"
                            :alt="cat.name"
                        />
                        <div
                            v-else
                            class="category-fallback"
                        >
                            <i class="fa-solid fa-image"></i>
                        </div>
                        <p>{{ cat.name }}</p>
                        <span class="product-count">{{ cat.productCount }} Productos</span>
                    </div>
                </div>

                <button class="carousel-btn next" @click="handleNextClick" aria-label="Siguiente">
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>
        </section>

        <section class="top-sellers container">
            <div class="top-sellers-header">
                <div class="top-sellers-title">
                    <span class="badge-orange"
                        ><i class="fa-solid fa-fire"></i> Los más vendidos</span
                    >
                    <h2>
                        Los productos<br /><span class="highlight-orange"
                            >más exitosos</span
                        ><br />del moment<span class="highlight-orange"
                            >ooo</span
                        >!!!
                    </h2>
                    <p>Invierte en los productos más solicitados</p>
                    <div class="benefits-badges">
                        <div class="benefit-badge teal">
                            <i class="fa-solid fa-store"></i> Productos con<br />excelente
                            rotación<br />y aceptación
                        </div>
                        <div class="benefit-badge light-orange">
                            <i class="fa-solid fa-chart-simple"></i> Productos
                            con<br />mayor volumen de<br />ventas
                        </div>
                    </div>
                </div>
                <div class="top-sellers-image">
                    <img
                        src="../assets/top-sellers-hero.png"
                        alt="Trophy and Bag"
                        style="max-height: 400px; object-fit: contain"
                    />
                </div>
            </div>

            <div class="products-grid">
                <div class="product-card">
                    <span class="badge-orange small"
                        ><i class="fa-solid fa-fire"></i> Los más vendidos</span
                    >
                    <img src="../assets/mochila.png" alt="Mochila Adventure" />
                    <p class="category">Bolsos & Maletas</p>
                    <div class="product-info">
                        <h4>Mochila Adventure</h4>
                        <span class="price">C$ 350</span>
                    </div>
                    <p class="min-order">Pedido min. 12 und</p>
                    <div class="provider-info">
                        <i
                            class="fa-solid fa-certificate"
                            style="color: #00a8ff"
                        ></i>
                        Megaboutique S.A
                        <i
                            class="fa-regular fa-circle-user"
                            style="margin-left: 5px"
                        ></i>
                        <span class="rating"
                            >4.5 <i class="fa-regular fa-star"></i
                        ></span>
                    </div>
                    <div class="ranking-bubble orange">1</div>
                </div>
                <div class="product-card">
                    <span class="badge-orange small"
                        ><i class="fa-solid fa-fire"></i> Los más vendidos</span
                    >
                    <img
                        src="../assets/utensilios.png"
                        alt="Set de ollas 9 piezas"
                    />
                    <p class="category">Cocina</p>
                    <div class="product-info">
                        <h4>Set de ollas 9 piezas</h4>
                        <span class="price">C$ 350</span>
                    </div>
                    <p class="min-order">Pedido min. 12 und</p>
                    <div class="provider-info">
                        <i
                            class="fa-solid fa-certificate"
                            style="color: #00a8ff"
                        ></i>
                        Megaboutique S.A
                        <i
                            class="fa-regular fa-circle-user"
                            style="margin-left: 5px"
                        ></i>
                        <span class="rating"
                            >4.5 <i class="fa-regular fa-star"></i
                        ></span>
                    </div>
                    <div class="ranking-bubble teal">2</div>
                </div>
                <div class="product-card">
                    <span class="badge-orange small"
                        ><i class="fa-solid fa-fire"></i> Los más vendidos</span
                    >
                    <img src="../assets/tableta.png" alt="Tablet para niños" />
                    <p class="category">Artículos tecnológicos</p>
                    <div class="product-info">
                        <h4>Tablet para niños</h4>
                        <span class="price">C$ 950</span>
                    </div>
                    <p class="min-order">Pedido min. 12 und</p>
                    <div class="provider-info">
                        <i
                            class="fa-solid fa-certificate"
                            style="color: #00a8ff"
                        ></i>
                        Megaboutique S.A
                        <i
                            class="fa-regular fa-circle-user"
                            style="margin-left: 5px"
                        ></i>
                        <span class="rating"
                            >4.5 <i class="fa-regular fa-star"></i
                        ></span>
                    </div>
                    <div class="ranking-bubble dark-blue">3</div>
                </div>
                <div class="product-card">
                    <span class="badge-orange small"
                        ><i class="fa-solid fa-fire"></i> Los más vendidos</span
                    >
                    <img src="../assets/paleta.png" alt="Paleta de sombras" />
                    <p class="category">Makeup & Cuidado personal</p>
                    <div class="product-info">
                        <h4>Paleta de sombras</h4>
                        <span class="price">C$ 350</span>
                    </div>
                    <p class="min-order">Pedido min. 12 und</p>
                    <div class="provider-info">
                        <i
                            class="fa-solid fa-certificate"
                            style="color: #00a8ff"
                        ></i>
                        Megaboutique S.A
                        <i
                            class="fa-regular fa-circle-user"
                            style="margin-left: 5px"
                        ></i>
                        <span class="rating"
                            >4.5 <i class="fa-regular fa-star"></i
                        ></span>
                    </div>
                    <div class="ranking-bubble grey">4</div>
                </div>
            </div>
        </section>

        <section id="proveedores" class="top-providers container">
            <h2>
                Nuestros proveedores más
                <span class="highlight-orange">TOP</span>
            </h2>
            <div class="providers-grid">
                <div class="provider-card">
                    <div class="provider-avatar">
                        <i class="fa-solid fa-user"></i>
                    </div>
                    <h4>Megaboutique S.A.R</h4>
                    <div class="verified-badge">
                        <i
                            class="fa-solid fa-certificate"
                            style="color: #00a8ff"
                        ></i>
                    </div>
                    <p class="status">Proveedor verificado</p>
                    <div class="provider-rating">
                        <span class="score">4.5</span>
                        <i class="fa-solid fa-star star-icon"></i>
                    </div>
                    <p class="location">San Ramón, Matagalpa</p>
                    <button class="btn-orange">Ver catalogo</button>
                </div>
                <div class="provider-card">
                    <div class="provider-avatar">
                        <i class="fa-solid fa-user"></i>
                    </div>
                    <h4>Global Textiles Ltd</h4>
                    <div class="verified-badge">
                        <i
                            class="fa-solid fa-certificate"
                            style="color: #00a8ff"
                        ></i>
                    </div>
                    <p class="status">Proveedor verificado</p>
                    <div class="provider-rating">
                        <span class="score">4.2</span>
                        <i class="fa-solid fa-star star-icon"></i>
                    </div>
                    <p class="location">San Ramón, Matagalpa</p>
                    <button class="btn-orange">Ver catalogo</button>
                </div>
                <div class="provider-card">
                    <div class="provider-avatar">
                        <i class="fa-solid fa-user"></i>
                    </div>
                    <h4>Nacional Textiles Ltd</h4>
                    <div class="verified-badge">
                        <i
                            class="fa-solid fa-certificate"
                            style="color: #00a8ff"
                        ></i>
                    </div>
                    <p class="status">Proveedor verificado</p>
                    <div class="provider-rating">
                        <span class="score">4.0</span>
                        <i class="fa-solid fa-star star-icon"></i>
                    </div>
                    <p class="location">San Ramón, Matagalpa</p>
                    <button class="btn-orange">Ver catalogo</button>
                </div>
            </div>
            <div class="view-all">
                <a href="#" class="btn-outline"
                    >Ver todos <i class="fa-solid fa-arrow-right"></i
                ></a>
            </div>
        </section>

        <section id="como-funciona" class="how-it-works container">
            <h2>¿Comó funciona la plataforma?</h2>
            <div class="steps-grid">
                <div class="step">
                    <div class="step-number">1</div>
                    <p>
                        Explora miles de productos al por mayor de proveedores
                        verificados.
                    </p>
                </div>
                <div class="step">
                    <div class="step-number">2</div>
                    <p>
                        Revisa calificaciones, precios y plazos de entrega en
                        cada proveedor.
                    </p>
                </div>
                <div class="step">
                    <div class="step-number">3</div>
                    <p>
                        Haz pedidos al por mayor de forma segura para tu
                        negocio.
                    </p>
                </div>
                <div class="step">
                    <div class="step-number">4</div>
                    <p>
                        Obtén un envío rápido y confiable directo a la ubicación
                        de que tú eligas.
                    </p>
                </div>
            </div>
        </section>
    </main>
    <footer class="footer">
        <div class="container footer-content">
            <div class="footer-info">
                <div class="footer-logo">
                    <img
                        src="../assets/1.1 Imagotipo variacion.png"
                        alt="Mercanto"
                        style="height: 45px"
                    />
                </div>
                <p><i class="fa-regular fa-envelope"></i> mercanto@gmail.com</p>
                <p><i class="fa-brands fa-whatsapp"></i> +505 88662233</p>
                <p>
                    <i class="fa-solid fa-location-dot"></i> Managua, Nicaragua
                </p>
            </div>

            <div class="footer-links">
                <a href="#">Política de privacidad</a>
                <a href="#">Categorías</a>
                <a href="#">Proveedores</a>
                <a href="#">Productos</a>
                <a href="#">Como funciona la plataforma</a>
            </div>
            <div class="footer-cta">
                <h4 class="orange-text">CONVIERTE EN PROVEEDOR</h4>
                <p>¿Eres exportador o distribuidor mayorista?</p>
                <button
                    class="btn-primary"
                    style="
                        background-color: var(--primary-orange);
                        color: white;
                    "
                >
                    Registrate hoy
                </button>
            </div>
        </div>
        <div class="footer-bottom">
            <p>Mercanto S.A 2026. Todos los derechos reservados</p>
        </div>
    </footer>
</template>
