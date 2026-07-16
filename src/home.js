import { healthApi, identityApi } from "./api";

document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.getElementById('categories-carousel');
    const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');

  healthApi.getReadiness().finally(() => {
    console.log("The server is ready")
  });


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
