import { bootstrapSession, identityApi } from "./api";

document.addEventListener('DOMContentLoaded', async () => {
  await bootstrapSession();

  const loginForm = document.getElementById('login-form');
  const toggleBtn = document.getElementById('toggle-password-btn');
  const passwordInput = document.getElementById('password');

  if (toggleBtn && passwordInput) {
    const icon = toggleBtn.querySelector('i');
    toggleBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      icon.className = isPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    });
  }

  if (!loginForm) {
    console.warn("No form");
    return;
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(loginForm));
    const payload = {
      email: data.email,
      password: data.password,
    };

    try {
      await identityApi.login(payload);
      window.location.assign('/perfil.html');
    } catch (error) {
      alert(error);
    }
  });
});
