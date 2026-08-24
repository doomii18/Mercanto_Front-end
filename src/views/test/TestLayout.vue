<template>
    <div class="test-layout">
        <header class="top-header">
            <div class="logo">
                <router-link :to="{ name: 'home' }">
                    <img
                        src="../assets/logo.png"
                        alt="Mercanto"
                        class="logo-icon"
                    />
                </router-link>
            </div>
            <h2>Test Views</h2>
        </header>

        <main class="test-container">
            <div class="test-menu">
                <router-link
                    :to="{ name: 'test-chat' }"
                    class="menu-item"
                    active-class="active"
                >
                    <i class="fa-regular fa-comments"></i> Chat WS
                </router-link>
                <router-link
                    :to="{ name: 'test-events' }"
                    class="menu-item"
                    active-class="active"
                >
                    <i class="fa-solid fa-bolt"></i> Global Events
                </router-link>
                <router-link
                    :to="{ name: 'test-image-search' }"
                    class="menu-item"
                    active-class="active"
                >
                    <i class="fa-solid fa-camera"></i> Image Search
                </router-link>
            </div>

            <div class="test-content">
                <router-view />
            </div>
        </main>
    </div>
</template>

<style scoped>
.test-layout {
    min-height: 100vh;
    background-color: var(--bg-gray);
    color: var(--primary-blue);
}

.top-header {
    background-color: #ffffff;
    padding: 1rem 2.5rem;
    border-bottom: 1px solid var(--border-gray);
    display: flex;
    align-items: center;
    gap: 2rem;
}

.logo-icon {
    height: 40px;
}

.test-container {
    display: flex;
    max-width: 1200px;
    margin: 2rem auto;
    gap: 2rem;
    padding: 0 1.5rem;
}

.test-menu {
    width: 250px;
    background: #ffffff;
    border-radius: 12px;
    padding: 1rem;
    border: 1px solid var(--border-gray);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.menu-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.8rem 1rem;
    text-decoration: none;
    color: var(--primary-blue);
    font-weight: 600;
    border-radius: 8px;
    transition: background-color 0.2s;
}

.menu-item i {
    width: 20px;
    text-align: center;
    color: var(--light-teal);
}

.menu-item:hover,
.menu-item.active {
    background-color: var(--bg-gray);
}

.test-content {
    flex: 1;
    background: #ffffff;
    border-radius: 12px;
    padding: 2rem;
    border: 1px solid var(--border-gray);
    min-height: 600px;
}
</style>
