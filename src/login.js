import { bootstrapSession, identityApi } from "./api";

document.addEventListener('DOMContentLoaded', async () => {
  await bootstrapSession();
  const loginForm = document.getElementById('login-form');

  if (!loginForm) {console.warn("No form"); return;}

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
    }
    catch (error) {
      alert(error);
    }
  });
})
