import { bootstrapSession, productApi } from "./api";

document.addEventListener("DOMContentLoaded", async () => {
  await bootstrapSession();

  const fileInput = document.getElementById("file-input");
  const searchButton = document.getElementById("search-button");
  const previewImage = document.getElementById("preview-image");
  const searchStatus = document.getElementById("search-status");
  const resultsContainer = document.getElementById("results-container");

  let currentFile = null;


  fileInput.addEventListener("change", () => {
    if (fileInput.files.length !== 1) {
      previewImage.classList.remove("visible");
      searchButton.classList.remove("visible");
      currentFile = null;
      searchStatus.textContent = "";
      resultsContainer.innerHTML = "";
      return;
    }

    const file = fileInput.files[0];
    currentFile = file;

    const blobUrl = URL.createObjectURL(file);
    previewImage.src = blobUrl;
    previewImage.classList.add("visible");
    searchButton.classList.add("visible");
    searchStatus.textContent = `Imagen lista: ${file.name}`;
    resultsContainer.innerHTML = "";
  });


  async function buildProductCard(hit) {
    const { product, distance } = hit;
    const card = document.createElement("div");
    card.className = "product-card";

    const scoreEl = document.createElement("div");
    scoreEl.className = "similarity-score";
    // Cosine distance: 0 = identical. Convert to a 0-100% similarity scale.
    const similarityPct = Math.max(0, (1 - distance) * 100);
    scoreEl.textContent = `Similitud: ${similarityPct.toFixed(1)}%`;

    const idEl = document.createElement("div");
    idEl.className = "product-id";
    idEl.textContent = product.id;

    const titleEl = document.createElement("h4");
    titleEl.className = "product-title";
    titleEl.textContent = product.title;

    const imagesContainer = document.createElement("div");
    imagesContainer.className = "product-images";

    if (product.image_blob_ids && product.image_blob_ids.length > 0) {
      const imageUrls = await Promise.all(
        product.image_blob_ids.map((blobId) =>
          productApi.getProductImageBlobUrl(blobId).catch((err) => {
            console.warn(`Failed to load image ${blobId}:`, err);
            return null;
          }),
        ),
      );

      imageUrls.forEach((url) => {
        if (!url) return;
        const img = document.createElement("img");
        img.src = url;
        img.alt = product.title;
        imagesContainer.appendChild(img);
      });
    } else {
      const noImg = document.createElement("span");
      noImg.className = "no-images";
      noImg.textContent = "Sin imágenes";
      imagesContainer.appendChild(noImg);
    }

    card.appendChild(scoreEl);
    card.appendChild(idEl);
    card.appendChild(titleEl);
    card.appendChild(imagesContainer);
    return card;
  }

  searchButton.addEventListener("click", async () => {
    if (!currentFile) {
      alert("Por favor selecciona una imagen primero.");
      return;
    }

    searchButton.disabled = true;
    searchStatus.textContent = "Buscando productos similares...";
    resultsContainer.innerHTML = "";

    try {
      const result = await productApi.searchProductsByImage(currentFile);

      console.log("Image search result:", result);

      if (!result.data || result.data.length === 0) {
        searchStatus.textContent = "No se encontraron productos similares.";
        return;
      }


      const sortedData = result.data
        .slice()
        .sort((a, b) => a.distance - b.distance);

      searchStatus.textContent = `${result.total} producto(s) encontrado(s).`;

      const cards = await Promise.all(sortedData.map(buildProductCard));
      cards.forEach((card) => resultsContainer.appendChild(card));
    } catch (error) {
      console.error("Image search failed:", error);
      searchStatus.textContent = "Error en la búsqueda. Revisa la consola.";
      alert(error.message || "Error al buscar productos por imagen.");
    } finally {
      searchButton.disabled = false;
    }
  });
});
