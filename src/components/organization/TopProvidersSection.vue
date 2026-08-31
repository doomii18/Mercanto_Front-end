<script setup lang="ts">
import { ref, onMounted } from "vue";
import { organizationApi } from "../../api";
import { getGeoManager, bootstrapGeo } from "../../modules/geo";
import ProviderLogo from "./ProviderLogo.vue";

interface TopProviderItem {
    id: string;
    name: string;
    logoBlobId: string | null;
    rating: number;
    reviewCount: number;
    locationText: string;
    isVerified: boolean;
}

const providers = ref<TopProviderItem[]>([]);
const isLoading = ref(true);

function resolveLocationText(municipalityId?: string): string {
    if (!municipalityId) return "Nicaragua";
    const geo = getGeoManager();
    if (!geo) return "Nicaragua";

    const municipality = geo.getMunicipalityById(municipalityId);
    if (!municipality) return "Nicaragua";

    const department = geo.getDepartmentById(municipality.departmentId);
    return department
        ? `${municipality.name}, ${department.name}`
        : municipality.name;
}

async function loadTopProviders() {
    isLoading.value = true;
    try {
        const res = await organizationApi.getOrganizations({
            limit: 3,
            offset: 0,
            sort_by: "score",
            sort_dir: "desc",
        });
        providers.value = res.data.map((prov) => ({
            id: prov.id,
            name: prov.company_name,
            logoBlobId: prov.logo_blob_id ?? null,
            rating: prov.rating?.average_score ?? 0,
            reviewCount: prov.rating?.review_count ?? 0,
            locationText: resolveLocationText(prov.municipality_id),
            isVerified:
                (prov as any).is_verified ?? prov.rating?.review_count > 0,
        }));
    } catch (err) {
        console.error("Failed to load top providers:", err);
    } finally {
        isLoading.value = false;
    }
}

onMounted(async () => {
    try {
        if (!getGeoManager()) {
            await bootstrapGeo();
        }
    } catch (err) {
        console.error("Failed to bootstrap geo cache:", err);
    }

    await loadTopProviders();
});
</script>

<template>
    <section id="proveedores" class="top-providers container">
        <h2>
            Nuestros proveedores más <span class="highlight-orange">TOP</span>
        </h2>

        <div v-if="isLoading" class="providers-grid">
            <div
                v-for="n in 3"
                :key="n"
                class="provider-card skeleton-card"
                aria-hidden="true"
            >
                <div class="skeleton-avatar skeleton-pulse"></div>
                <div class="skeleton-text skeleton-title skeleton-pulse"></div>
                <div class="skeleton-text skeleton-sub skeleton-pulse"></div>
                <div class="skeleton-text skeleton-rating skeleton-pulse"></div>
                <div class="skeleton-btn skeleton-pulse"></div>
            </div>
        </div>

        <div v-else class="providers-grid">
            <div
                v-for="provider in providers"
                :key="provider.id"
                class="provider-card"
            >
                <div class="provider-avatar">
                    <ProviderLogo
                        :blob-id="provider.logoBlobId"
                        :alt="provider.name"
                    />
                </div>

                <h4 :title="provider.name">{{ provider.name }}</h4>

                <div v-if="provider.isVerified" class="verified-icon">
                    <i class="fa-solid fa-certificate"></i>
                </div>
                <p class="provider-status">
                    {{
                        provider.isVerified
                            ? "Proveedor verificado"
                            : "Proveedor registrado"
                    }}
                </p>

                <div
                    class="provider-rating"
                    :title="`${provider.reviewCount} valoraciones`"
                >
                    <span class="score">
                        {{
                            provider.rating > 0
                                ? provider.rating.toFixed(1)
                                : "0.0"
                        }}
                    </span>
                    <i class="fa-solid fa-star"></i>
                </div>

                <p class="provider-location" :title="provider.locationText">
                    {{ provider.locationText }}
                </p>

                <router-link
                    :to="{
                        name: 'category',
                        query: { provider_id: provider.id },
                    }"
                    class="btn-orange"
                >
                    Ver catálogo
                </router-link>
            </div>
        </div>

        <div class="view-all-wrapper">
            <router-link :to="{ name: 'category' }" class="btn-outline">
                Ver todos <i class="fa-solid fa-arrow-right"></i>
            </router-link>
        </div>
    </section>
</template>

<style scoped>
.top-providers {
    text-align: center;
    margin-bottom: 5rem;
}

.top-providers h2 {
    font-size: 2.2rem;
    color: var(--primary-blue);
    margin-bottom: 2.5rem;
}

.highlight-orange {
    color: var(--primary-orange);
}

.providers-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
}

.provider-card {
    background: #ffffff;
    border: 2px solid var(--primary-orange);
    border-radius: 24px;
    padding: 2rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
    min-width: 0;
}

.provider-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(255, 106, 0, 0.12);
}

.provider-avatar {
    width: 72px;
    height: 72px;
    background-color: #f1f5f9;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.8rem;
    color: #64748b;
    margin-bottom: 1rem;
    overflow: hidden;
    border: 1px solid var(--border-gray);
}

.provider-card h4 {
    font-size: 1.15rem;
    color: var(--primary-blue);
    margin-bottom: 0.4rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
}

.verified-icon {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    font-size: 1.5rem;
    color: #0284c7;
}

.provider-status {
    font-size: 0.85rem;
    color: #64748b;
    margin-bottom: 0.6rem;
}

.provider-rating {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary-blue);
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.6rem;
}

.provider-rating i {
    color: var(--primary-orange);
    font-size: 1.2rem;
}

.provider-location {
    font-size: 0.85rem;
    color: #64748b;
    margin-bottom: 1.2rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
}

.btn-orange {
    background-color: var(--primary-orange);
    color: #ffffff;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 24px;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    text-decoration: none;
    display: inline-block;
    box-sizing: border-box;
    transition: background-color 0.2s ease;
}

.btn-orange:hover {
    background-color: var(--primary-orange-hover);
}

.view-all-wrapper {
    text-align: right;
}

.btn-outline {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--light-teal);
    border: 2px solid var(--light-teal);
    padding: 0.5rem 1.4rem;
    border-radius: 20px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s ease;
}

.btn-outline:hover {
    background-color: var(--light-teal);
    color: #ffffff;
}

/* Skeleton Loading */
.skeleton-card {
    pointer-events: none;
    border-color: var(--border-gray);
}

.skeleton-pulse {
    background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-avatar {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    margin-bottom: 1rem;
}

.skeleton-text {
    border-radius: 6px;
    margin-bottom: 0.6rem;
}

.skeleton-title {
    width: 70%;
    height: 1.2rem;
}

.skeleton-sub {
    width: 50%;
    height: 0.85rem;
}

.skeleton-rating {
    width: 35%;
    height: 1.4rem;
}

.skeleton-btn {
    width: 100%;
    height: 42px;
    border-radius: 24px;
    margin-top: 0.6rem;
}

@keyframes shimmer {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}

@media (max-width: 1024px) {
    .providers-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 768px) {
    .providers-grid {
        grid-template-columns: 1fr;
    }

    .view-all-wrapper {
        text-align: center;
    }
}
</style>
