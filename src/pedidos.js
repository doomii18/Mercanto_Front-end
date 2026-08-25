document.addEventListener('DOMContentLoaded', () => {

    // --- Base de Datos de Pedidos (Mock Data) ---
    const ordersData = {
        'MC-2026-5': {
            code: 'MC-2026-5',
            createdDate: 'Realizado el 10 de junio de 2026',
            purchaseDate: '26 de junio de 2026',
            total: 'C$6,651.25',
            paymentMethod: 'Transferencia bancaria',
            productCount: '100 productos',
            status: 'received',
            statusLabel: 'Recibido',
            statusIcon: 'fa-solid fa-circle-check',
            provider: {
                name: 'E. Chamorro S.A',
                logo: './src/assets/ech-logo.png',
                stars: 4
            },
            address: {
                name: 'Héctor Raúl Hernández L.',
                street: 'Barrio El Recreo, de la rotonda 1c al lago, 2c al sur, 1 al oeste.',
                city: 'Granada - Granada',
                phone: 'Tel. 8730 9208'
            },
            products: [
                {
                    name: 'Jabón Marfil Explosion Frescur 3U - 960 g',
                    image: './src/assets/product1.png',
                    price: 'C$ 109.00',
                    qty: 'Ud. 34',
                    subtotal: 'C$3,706.00'
                },
                {
                    name: 'Lavaplatos Marfil Toronja Taza - 850 g',
                    image: './src/assets/product2.png',
                    price: 'C$ 49.25',
                    qty: 'Ud. 33',
                    subtotal: 'C$1,625.25'
                },
                {
                    name: 'Jabon Marfil Nat Explosion Fresc 320gr',
                    image: './src/assets/product1.png',
                    price: 'C$ 40.00',
                    qty: 'Ud. 33',
                    subtotal: 'C$1,320.00'
                }
            ]
        },
        'MC-2026-4': {
            code: 'MC-2026-4',
            createdDate: 'Realizado el 20 de junio de 2026',
            purchaseDate: '20 de junio de 2026',
            total: 'C$7,000.00',
            paymentMethod: 'Tarjeta de crédito',
            productCount: '50 productos',
            status: 'processing',
            statusLabel: 'En proceso',
            statusIcon: 'fa-regular fa-clock',
            provider: {
                name: 'Ron Flor de Caña',
                logo: './src/assets/flor-de-cana-logo.png',
                stars: 5
            },
            address: {
                name: 'Héctor Raúl Hernández L.',
                street: 'Barrio El Recreo, de la rotonda 1c al lago, 2c al sur, 1 al oeste.',
                city: 'Granada - Granada',
                phone: 'Tel. 8730 9208'
            },
            products: [
                {
                    name: 'Ron Flor de Caña 12 Años 750ml',
                    image: './src/assets/product3.png',
                    price: 'C$ 140.00',
                    qty: 'Ud. 25',
                    subtotal: 'C$3,500.00'
                },
                {
                    name: 'Ron Flor de Caña 7 Años Gran Reserva 750ml',
                    image: './src/assets/product4.png',
                    price: 'C$ 140.00',
                    qty: 'Ud. 25',
                    subtotal: 'C$3,500.00'
                }
            ]
        },
        'MC-2026-3': {
            code: 'MC-2026-3',
            createdDate: 'Realizado el 15 de junio de 2026',
            purchaseDate: '15 de junio de 2026',
            total: 'C$16,950.00',
            paymentMethod: 'Transferencia bancaria',
            productCount: '30 productos',
            status: 'shipped',
            statusLabel: 'Enviado',
            statusIcon: 'fa-solid fa-truck',
            provider: {
                name: 'Dicegsa',
                logo: './src/assets/dicegsa-logo.png',
                stars: 4
            },
            address: {
                name: 'Héctor Raúl Hernández L.',
                street: 'Barrio El Recreo, de la rotonda 1c al lago, 2c al sur, 1 al oeste.',
                city: 'Granada - Granada',
                phone: 'Tel. 8730 9208'
            },
            products: [
                {
                    name: 'Cereales CerealMix Fresa 500g',
                    image: './src/assets/producto5.png',
                    price: 'C$ 565.00',
                    qty: 'Ud. 15',
                    subtotal: 'C$8,475.00'
                },
                {
                    name: 'Detergente Multiuso Lavanda 1kg',
                    image: './src/assets/producto6.png',
                    price: 'C$ 565.00',
                    qty: 'Ud. 15',
                    subtotal: 'C$8,475.00'
                }
            ]
        },
        'MC-2026-2': {
            code: 'MC-2026-2',
            createdDate: 'Realizado el 10 de junio de 2026',
            purchaseDate: '10 de junio de 2026',
            total: 'C$2,450.00',
            paymentMethod: 'Efectivo contra entrega',
            productCount: '12 items',
            status: 'received',
            statusLabel: 'Recibido',
            statusIcon: 'fa-solid fa-circle-check',
            provider: {
                name: 'E. Chamorro S.A',
                logo: './src/assets/ech-logo.png',
                stars: 4
            },
            address: {
                name: 'Héctor Raúl Hernández L.',
                street: 'Barrio El Recreo, de la rotonda 1c al lago, 2c al sur, 1 al oeste.',
                city: 'Granada - Granada',
                phone: 'Tel. 8730 9208'
            },
            products: [
                {
                    name: 'Jabón Marfil Explosion Frescur 3U - 960 g',
                    image: './src/assets/product1.png',
                    price: 'C$ 109.00',
                    qty: 'Ud. 12',
                    subtotal: 'C$1,308.00'
                },
                {
                    name: 'Lavaplatos Marfil Toronja Taza - 850 g',
                    image: './src/assets/product2.png',
                    price: 'C$ 49.25',
                    qty: 'Ud. 23',
                    subtotal: 'C$1,142.00'
                }
            ]
        },
        'MC-2026-10': {
            code: 'MC-2026-10',
            createdDate: 'Realizado el 05 de junio de 2026',
            purchaseDate: '05 de junio de 2026',
            total: 'C$5,800.00',
            paymentMethod: 'Transferencia bancaria',
            productCount: '50 items',
            status: 'received',
            statusLabel: 'Recibido',
            statusIcon: 'fa-solid fa-circle-check',
            provider: {
                name: 'Dicegsa',
                logo: './src/assets/dicegsa-logo.png',
                stars: 4
            },
            address: {
                name: 'Héctor Raúl Hernández L.',
                street: 'Barrio El Recreo, de la rotonda 1c al lago, 2c al sur, 1 al oeste.',
                city: 'Granada - Granada',
                phone: 'Tel. 8730 9208'
            },
            products: [
                {
                    name: 'Detergente Multiuso Lavanda 1kg',
                    image: './src/assets/producto6.png',
                    price: 'C$ 116.00',
                    qty: 'Ud. 50',
                    subtotal: 'C$5,800.00'
                }
            ]
        },
        'MC-2026-7': {
            code: 'MC-2026-7',
            createdDate: 'Realizado el 01 de junio de 2026',
            purchaseDate: '01 de junio de 2026',
            total: 'C$3,200.00',
            paymentMethod: 'Tarjeta de débito',
            productCount: '20 items',
            status: 'received',
            statusLabel: 'Recibido',
            statusIcon: 'fa-solid fa-circle-check',
            provider: {
                name: 'Ron Flor de Caña',
                logo: './src/assets/flor-de-cana-logo.png',
                stars: 5
            },
            address: {
                name: 'Héctor Raúl Hernández L.',
                street: 'Barrio El Recreo, de la rotonda 1c al lago, 2c al sur, 1 al oeste.',
                city: 'Granada - Granada',
                phone: 'Tel. 8730 9208'
            },
            products: [
                {
                    name: 'Ron Flor de Caña 7 Años Gran Reserva 750ml',
                    image: './src/assets/product4.png',
                    price: 'C$ 160.00',
                    qty: 'Ud. 20',
                    subtotal: 'C$3,200.00'
                }
            ]
        }
    };

    // --- Elementos DOM ---
    const ordersListView = document.getElementById('orders-list-view');
    const orderDetailsView = document.getElementById('order-details-view');
    const btnBackToList = document.getElementById('btn-back-to-list');

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById("mobile-menu-btn");
    const sidebarMenu = document.getElementById("sidebar-menu");
    if (mobileMenuBtn && sidebarMenu) {
        mobileMenuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            sidebarMenu.classList.toggle("open");
        });
        document.addEventListener("click", (e) => {
            if (!sidebarMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                sidebarMenu.classList.remove("open");
            }
        });
    }

    // Buscador
    const ordersSearchInput = document.getElementById('orders-search-input');
    const searchDropdownMenu = document.getElementById('search-dropdown-menu');
    const dropdownSearchInput = document.getElementById('dropdown-search-input');
    const btnCloseDropdown = document.getElementById('btn-close-dropdown');
    const searchRecentBlock = document.getElementById('search-recent-block');
    const searchLiveResults = document.getElementById('search-live-results');
    const liveQueryTerm = document.getElementById('live-query-term');
    const resultsItemsList = document.getElementById('results-items-list');

    // Tabs y Tarjetas
    const tabButtons = document.querySelectorAll('.tab-btn');
    const orderCards = document.querySelectorAll('.order-card');

    // Detalles del pedido DOM
    const detailHeadingCode = document.getElementById('detail-heading-code');
    const detailHeadingDate = document.getElementById('detail-heading-date');
    const detailHeadingStatus = document.getElementById('detail-heading-status');
    const detailHeadingStatusText = document.getElementById('detail-heading-status-text');
    const summaryCardDate = document.getElementById('summary-card-date');
    const summaryCardTotal = document.getElementById('summary-card-total');
    const summaryCardPayment = document.getElementById('summary-card-payment');
    const summaryCardCount = document.getElementById('summary-card-count');
    const detailBoxProductsCount = document.getElementById('detail-box-products-count');
    const detailProductsTbody = document.getElementById('detail-products-tbody');
    const detailProductsBottomTotal = document.getElementById('detail-products-bottom-total');
    const sideCardProviderLogo = document.getElementById('side-card-provider-logo');
    const sideCardProviderName = document.getElementById('side-card-provider-name');
    const sideCardProviderStars = document.getElementById('side-card-provider-stars');

    // --- Función para Abrir Detalle del Pedido ---
    function openOrderDetails(orderId) {
        const order = ordersData[orderId] || ordersData['MC-2026-5'];
        
        detailHeadingCode.textContent = `Detalles del Pedido #${order.code}`;
        detailHeadingDate.textContent = order.createdDate;
        
        // Estado
        detailHeadingStatus.className = `status-badge ${order.status}`;
        detailHeadingStatusText.textContent = order.statusLabel;
        detailHeadingStatus.querySelector('i').className = order.statusIcon;

        // Resumen
        summaryCardDate.textContent = order.purchaseDate;
        summaryCardTotal.textContent = order.total;
        summaryCardPayment.textContent = order.paymentMethod;
        summaryCardCount.textContent = order.productCount;

        // Tabla de Productos
        detailBoxProductsCount.textContent = `Productos (${order.products.length})`;
        detailProductsTbody.innerHTML = '';

        order.products.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-product">
                    <div class="product-item-cell">
                        <img src="${p.image}" alt="${p.name}" class="table-prod-img" />
                        <span>${p.name}</span>
                    </div>
                </td>
                <td class="td-price">${p.price}</td>
                <td class="td-qty">${p.qty}</td>
                <td class="td-subtotal">${p.subtotal}</td>
            `;
            detailProductsTbody.appendChild(tr);
        });

        detailProductsBottomTotal.textContent = order.total;

        // Proveedor
        sideCardProviderName.textContent = order.provider.name;
        sideCardProviderLogo.src = order.provider.logo;
        
        // Estrellas
        sideCardProviderStars.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('i');
            if (i <= order.provider.stars) {
                star.className = 'fa-solid fa-star star-filled';
            } else {
                star.className = 'fa-regular fa-star star-empty';
            }
            sideCardProviderStars.appendChild(star);
        }

        // Cambiar vista
        ordersListView.style.display = 'none';
        orderDetailsView.style.display = 'flex';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Volver a la lista
    btnBackToList.addEventListener('click', () => {
        orderDetailsView.style.display = 'none';
        ordersListView.style.display = 'block';
    });

    // Botones "ver detalles" en las tarjetas
    document.querySelectorAll('.btn-view-details').forEach(btn => {
        btn.addEventListener('click', () => {
            const orderId = btn.getAttribute('data-order-id');
            openOrderDetails(orderId);
        });
    });

    // --- Lógica del Buscador y Dropdown Flotante ---
    function showDropdown() {
        searchDropdownMenu.style.display = 'block';
        dropdownSearchInput.focus();
    }

    function hideDropdown() {
        searchDropdownMenu.style.display = 'none';
    }

    ordersSearchInput.addEventListener('focus', () => {
        dropdownSearchInput.value = ordersSearchInput.value;
        showDropdown();
        handleSearchQuery(ordersSearchInput.value);
    });

    ordersSearchInput.addEventListener('input', (e) => {
        dropdownSearchInput.value = e.target.value;
        showDropdown();
        handleSearchQuery(e.target.value);
    });

    dropdownSearchInput.addEventListener('input', (e) => {
        ordersSearchInput.value = e.target.value;
        handleSearchQuery(e.target.value);
    });

    btnCloseDropdown.addEventListener('click', () => {
        ordersSearchInput.value = '';
        dropdownSearchInput.value = '';
        hideDropdown();
        filterOrderCards('');
    });

    // Cerrar al hacer clic fuera del buscador
    document.addEventListener('click', (e) => {
        const searchWrapper = document.querySelector('.search-wrapper-container');
        if (searchWrapper && !searchWrapper.contains(e.target)) {
            hideDropdown();
        }
    });

    // Clics en ítems de búsqueda reciente
    document.querySelectorAll('.dropdown-item-row').forEach(item => {
        item.addEventListener('click', () => {
            const orderId = item.getAttribute('data-order-id');
            hideDropdown();
            openOrderDetails(orderId);
        });
    });

    // Manejar consulta de búsqueda en vivo
    function handleSearchQuery(query) {
        const trimmed = query.trim().toLowerCase();
        
        if (!trimmed) {
            searchRecentBlock.style.display = 'block';
            searchLiveResults.style.display = 'none';
            filterOrderCards('');
            return;
        }

        searchRecentBlock.style.display = 'none';
        searchLiveResults.style.display = 'block';
        liveQueryTerm.textContent = query;

        // Buscar coincidencias
        const matchingOrders = [];
        for (const [id, order] of Object.entries(ordersData)) {
            const matchCode = id.toLowerCase().includes(trimmed);
            const matchProvider = order.provider.name.toLowerCase().includes(trimmed);
            const matchProduct = order.products.some(p => p.name.toLowerCase().includes(trimmed));

            if (matchCode || matchProvider || matchProduct) {
                matchingOrders.push(order);
            }
        }

        // Renderizar resultados en vivo
        resultsItemsList.innerHTML = '';

        if (matchingOrders.length === 0) {
            resultsItemsList.innerHTML = `<div class="no-results-msg">No se encontraron pedidos para "${query}"</div>`;
        } else {
            matchingOrders.forEach((order, index) => {
                const row = document.createElement('div');
                row.className = `live-result-row ${index === 0 ? 'selected' : ''}`;
                row.setAttribute('data-order-id', order.code);
                
                // Formato de fecha corta para la vista (e.g. 10 jun)
                const dateParts = order.purchaseDate.split(' ');
                const shortDate = dateParts.length >= 3 ? `${dateParts[0]} ${dateParts[2].slice(0, 3)}` : order.purchaseDate;

                row.innerHTML = `
                    <div class="item-left-info">
                        <i class="fa-solid fa-bag-shopping bag-icon"></i>
                        <div class="result-main-text">
                            <strong>${order.code}</strong>
                            <span>${order.provider.name}</span>
                        </div>
                    </div>
                    <span class="result-date-text">${shortDate}</span>
                `;

                row.addEventListener('click', () => {
                    hideDropdown();
                    openOrderDetails(order.code);
                });

                resultsItemsList.appendChild(row);
            });
        }

        // Filtrar tarjetas principales
        filterOrderCards(trimmed);
    }

    // Filtrar tarjetas en la lista principal
    function filterOrderCards(query) {
        orderCards.forEach(card => {
            const id = card.getAttribute('data-order-id')?.toLowerCase() || '';
            const provider = card.getAttribute('data-provider')?.toLowerCase() || '';
            
            if (!query || id.includes(query) || provider.includes(query)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // --- Filtrado por Pestañas (Tabs) ---
    tabButtons.forEach(tab => {
        tab.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tab.classList.add('active');

            const tabType = tab.getAttribute('data-tab');

            orderCards.forEach(card => {
                const cardStatus = card.getAttribute('data-status');

                if (tabType === 'all') {
                    card.style.display = 'flex';
                } else if (tabType === 'pending' && cardStatus === 'pending') {
                    card.style.display = 'flex';
                } else if (tabType === 'processing' && cardStatus === 'processing') {
                    card.style.display = 'flex';
                } else if (tabType === 'received' && (cardStatus === 'received' || cardStatus === 'shipped')) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

});
