import { authManager } from "./modules/auth";
import { geographyApi, healthApi } from "./api";

document.addEventListener("DOMContentLoaded", async () => {
  await authManager.initialize();

  const carousel = document.getElementById("categories-carousel");
  const prevBtn = document.querySelector(".prev-btn");
  const nextBtn = document.querySelector(".next-btn");

  await healthApi.getReadiness();

  if (carousel && prevBtn && nextBtn) {
    prevBtn.addEventListener("click", () => {
      carousel.scrollBy({ left: -244, behavior: "smooth" });
    });
    nextBtn.addEventListener("click", () => {
      carousel.scrollBy({ left: 244, behavior: "smooth" });
    });
  }
});
