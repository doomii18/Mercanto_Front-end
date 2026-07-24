import { bootstrapSession, geographyApi, healthApi } from "./api";

// Carga asíncrona de datos de la API
document.addEventListener('DOMContentLoaded', async () => {
  await bootstrapSession();

  const carousel = document.getElementById('categories-carousel');
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');

  await healthApi.getReadiness();
  const categories = await geographyApi.getGeographyTree({ country_iso: "NIC" });
  console.log(categories);

  if (carousel && prevBtn && nextBtn) {
      prevBtn.addEventListener('click', () => {
          carousel.scrollBy({ left: -244, behavior: 'smooth' });
      });
      nextBtn.addEventListener('click', () => {
          carousel.scrollBy({ left: 244, behavior: 'smooth' });
      });
  }

});
