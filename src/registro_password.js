function togglePass(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = "password";
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const p1 = document.getElementById('pass').value;
            const p2 = document.getElementById('pass-confirm').value;

            if (!p1 || !p2) {
                alert('Por favor completa ambas contraseñas.');
                return;
            }

            if (p1 !== p2) {
                alert('Las contraseñas no coinciden.');
                return;
            }

            alert('Contraseña guardada exitosamente. Redirigiendo al login...');
            window.location.href = 'login.html';
        });
    }
});
