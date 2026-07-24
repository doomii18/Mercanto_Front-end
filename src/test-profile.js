import { bootstrapSession, userProfileApi } from "./api";

document.addEventListener('DOMContentLoaded', async () => {
  await bootstrapSession();
  const fileInput = document.getElementById('file-input');
  const uploadButton = document.getElementById('upload-button');
  const profilePicture = document.getElementById('profile-picture');

  uploadButton.addEventListener('click', async () => {
    if (fileInput.files.length !== 1) {
      alert('Please select exactly one file to upload.');
      return;
    }

    // Obtain the File object
    const file = fileInput.files[0];

    try {
      await userProfileApi.changeProfilePicture(file);
      const blobUrl = URL.createObjectURL(file);
      profilePicture.src = blobUrl;
    }catch (error) {
          alert(error.message || 'Failed to upload profile picture.');
        }
  });

  // fetch data
  const profile = await userProfileApi.getMyProfile();

  if (profile.avatar_blob_id) {
    profilePicture.src = await userProfileApi.getProfilePictureBlobUrl(profile.avatar_blob_id);
  }
});
