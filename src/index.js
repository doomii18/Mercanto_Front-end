import { bootstrapSession, geographyApi, healthApi } from "./api";

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
            // Scroll left by roughly one card width + gap (220px + 24px)
            carousel.scrollBy({ left: -244, behavior: 'smooth' });
        });

        nextBtn.addEventListener('click', () => {
            // Scroll right
            carousel.scrollBy({ left: 244, behavior: 'smooth' });
        });
    }
});
