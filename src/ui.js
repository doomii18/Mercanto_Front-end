export function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const authButtons = document.querySelector('.auth-buttons');
    const menuIcon = document.getElementById('menu-icon');

    if (!menuBtn || !navLinks || !authButtons) return;

    menuBtn.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        authButtons.classList.toggle('open', isOpen);
        
        if (menuIcon) {
            menuIcon.className = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
        }
    });

    // Cerrar el menú al hacer clic en cualquier enlace
    const navAnchors = navLinks.querySelectorAll('a');
    navAnchors.forEach(anchor => {
        anchor.addEventListener('click', () => {
            navLinks.classList.remove('open');
            authButtons.classList.remove('open');
            if (menuIcon) {
                menuIcon.className = 'fa-solid fa-bars';
            }
        });
    });
}

// Inicializar automáticamente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initMobileMenu);
