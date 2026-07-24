import { bootstrapSession, categoryApi } from "./api";

document.addEventListener('DOMContentLoaded', async () => {
  await bootstrapSession();
  const list = document.getElementById('list');

  const response = await categoryApi.getCategories();

  response.data.forEach(async(category) => {
    const item = document.createElement('div');

    item.textContent = category.name;
    list.appendChild(item);

    if (category.image_blob_id) {
      const image = document.createElement('img');
      const imageUrl = await categoryApi.getCategoryImageBlobUrl(category.image_blob_id);
      image.src = imageUrl;
      item.appendChild(image);
    }

  });


});
