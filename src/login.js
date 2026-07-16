import { identityApi } from "./api";

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(loginForm));
    try {
      await identityApi.login(data);
      window.location.assign('/perfil.html');
    }
    catch (error) {
      alert(error);
    }
  });
})
