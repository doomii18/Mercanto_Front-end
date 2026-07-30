// Toggle contraseña en la página de login
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggle-password-btn');
    const passwordInput = document.getElementById('password');

    if (!toggleBtn || !passwordInput) return;

    const icon = toggleBtn.querySelector('i');

    toggleBtn.addEventListener('click', () => {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    });
});
