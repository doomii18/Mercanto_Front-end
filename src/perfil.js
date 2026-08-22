import { authManager } from "./modules/auth";
import { bootstrapGeo, getGeoManager } from "./modules/geo";
import { userProfileApi } from "./api";

document.addEventListener("DOMContentLoaded", async () => {

  let account;
  try {
    account = await authManager.requireAuth();
  } catch {
    return;
  }


  const logoutBtn = document.querySelector(".logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await authManager.logout();
    });
  }

  // =============================================
  // ELEMENT REFERENCES
  // =============================================
  const editAvatarBtn = document.querySelector(".edit-avatar");
  const avatarDropdown = document.getElementById("avatar-dropdown");
  const avatarDiv = document.querySelector(".avatar");

  // Photo modals
  const photoModal = document.getElementById("photo-modal");
  const deleteModal = document.getElementById("delete-modal");
  const viewPhotoModal = document.getElementById("view-photo-modal");

  const closeModalTop = document.getElementById("close-modal-top");
  const closeModalBtn = document.getElementById("close-modal-btn");

  // Views inside photo-modal
  const choiceView = document.getElementById("choice-view");
  const uploadView = document.getElementById("upload-view");
  const cameraView = document.getElementById("camera-view");
  const adjustView = document.getElementById("adjust-view");
  const modalTitle = document.getElementById("modal-title");

  // Dropdown items
  const btnMenuView = document.getElementById("btn-menu-view");
  const btnMenuTake = document.getElementById("btn-menu-take");
  const btnMenuUpload = document.getElementById("btn-menu-upload");
  const btnMenuDelete = document.getElementById("btn-menu-delete");

  // Choice view
  const btnChoiceUpload = document.getElementById("btn-choice-upload");
  const btnChoiceCamera = document.getElementById("btn-choice-camera");
  const btnCancelChoice = document.getElementById("btn-cancel-choice");

  // Upload view
  const dragDropZone = document.getElementById("drag-drop-zone");
  const btnBrowseFile = document.getElementById("btn-browse-file");
  const btnCancelUpload = document.getElementById("btn-cancel-upload");
  const btnContinueUpload = document.getElementById("btn-continue-upload");

  // Camera
  const videoElement = document.getElementById("camera-stream");
  const cameraMessage = document.getElementById("camera-message");
  const btnCancelCamera = document.getElementById("btn-cancel-camera");
  const btnShutter = document.getElementById("btn-shutter");
  const btnUploadFile = document.getElementById("btn-upload-file");
  const fileInput = document.getElementById("profile-file-input");

  // Adjust
  const photoCanvas = document.getElementById("photo-canvas");
  const ctx = photoCanvas.getContext("2d");
  const btnCancelAdjust = document.getElementById("btn-cancel-adjust");
  const btnSavePhoto = document.getElementById("btn-save-photo");
  const btnRetake = document.getElementById("btn-retake");

  // Delete
  const btnCancelDelete = document.getElementById("btn-cancel-delete");
  const btnConfirmDelete = document.getElementById("btn-confirm-delete");

  // View Photo
  const viewPhotoImg = document.getElementById("view-photo-img");
  const closeViewPhoto = document.getElementById("close-view-photo");

  // Edit Profile Modal
  const editProfileModal = document.getElementById("edit-profile-modal");
  const btnOpenEditProfile = document.getElementById("btn-open-edit-profile");
  const closeEditProfile = document.getElementById("close-edit-profile");
  const btnCancelEditProfile = document.getElementById(
    "btn-cancel-edit-profile",
  );
  const btnSaveEditProfile = document.getElementById("btn-save-edit-profile");
  const editPhotoPreview = document.getElementById("edit-photo-preview");
  const btnChangePhotoInEdit = document.getElementById(
    "btn-change-photo-in-edit",
  );

  // Edit form inputs
  const inputNombres = document.getElementById("input-nombres");
  const inputApellidos = document.getElementById("input-apellidos");
  const inputTelefono = document.getElementById("input-telefono");
  const inputCedula = document.getElementById("input-cedula");
  const inputMunicipio = document.getElementById("input-municipio");
  // Display spans
  const displayNombres = document.getElementById("display-nombres");
  const displayApellidos = document.getElementById("display-apellidos");
  const displayCorreo = document.getElementById("display-correo");
  const displayTelefono = document.getElementById("display-telefono");
  const displayCedula = document.getElementById("display-cedula");
  const displayMunicipio = document.getElementById("display-municipio");
  // Header displays
  const displayFullname = document.getElementById("display-fullname");
  const displayCorreoHeader = document.getElementById("display-correo-header");
  const displayMiembroDesde = document.getElementById("display-miembro-desde");

  let stream = null;
  let currentImage = null;
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let currentAvatarBlobId = null;
  let currentAvatarViewUrl = null;
  let currentProfile = null;

  // =============================================
  // GEO SETUP
  // =============================================
  await bootstrapGeo();
  const geoManager = getGeoManager();

  if (geoManager && inputMunicipio) {
    const departments = geoManager.getDepartments();
    departments.forEach((dept) => {
      const optgroup = document.createElement("optgroup");
      optgroup.label = dept.name;
      dept.municipalities.forEach((mun) => {
        const option = document.createElement("option");
        option.value = mun.id;
        option.textContent = mun.name;
        optgroup.appendChild(option);
      });
      inputMunicipio.appendChild(optgroup);
    });
  }

  // =============================================
  // LOAD PROFILE DATA FROM API
  // =============================================
  async function loadProfile() {
    try {
      const profile = await userProfileApi.getMyProfile();
      currentProfile = profile;

      // Render Account data (from verified session proof)
      if (displayCorreo) displayCorreo.textContent = account.email;
      if (displayCorreoHeader) displayCorreoHeader.textContent = account.email;
      if (displayMiembroDesde) {
        const localizedDate = new Date(account.created_at).toLocaleString();
        displayMiembroDesde.textContent = `Miembro desde ${localizedDate}`;
      }

      // Render UserProfile data
      if (displayNombres) displayNombres.textContent = profile.first_name ?? "";
      if (displayApellidos)
        displayApellidos.textContent = profile.last_name ?? "";
      if (displayCedula) displayCedula.textContent = profile.national_id ?? "—";
      if (displayTelefono)
        displayTelefono.textContent = profile.phone_number ?? "—";
      if (displayFullname)
        displayFullname.textContent =
          `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();

      if (displayMunicipio && profile.municipality_id && geoManager) {
        const mun = geoManager.getMunicipalityById(profile.municipality_id);
        displayMunicipio.textContent = mun ? mun.name : profile.municipality_id;
      } else if (displayMunicipio) {
        displayMunicipio.textContent = "—";
      }

      // Render Avatar
      if (profile.avatar_blob_id) {
        currentAvatarBlobId = profile.avatar_blob_id;
        const blobUrl = await userProfileApi.getProfilePictureBlobUrl(
          profile.avatar_blob_id,
        );
        currentAvatarViewUrl = blobUrl;
        setAvatarImage(blobUrl);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  }

  function setAvatarImage(dataUrl) {
    avatarDiv.innerHTML = "";
    avatarDiv.style.backgroundImage = `url(${dataUrl})`;
    avatarDiv.style.backgroundSize = "cover";
    avatarDiv.style.backgroundPosition = "center";
  }

  await loadProfile();

  // =============================================
  // DROPDOWN MENU
  // =============================================
  editAvatarBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    avatarDropdown.style.display =
      avatarDropdown.style.display === "none" ? "block" : "none";
  });

  document.addEventListener("click", (e) => {
    if (
      !editAvatarBtn.contains(e.target) &&
      !avatarDropdown.contains(e.target)
    ) {
      avatarDropdown.style.display = "none";
    }
  });

  // =============================================
  // DROPDOWN ACTIONS
  // =============================================
  btnMenuView.addEventListener("click", async () => {
    avatarDropdown.style.display = "none";
    if (currentAvatarViewUrl) {
      viewPhotoImg.src = currentAvatarViewUrl;
      viewPhotoModal.style.display = "flex";
    } else if (currentAvatarBlobId) {
      try {
        const blobUrl =
          await userProfileApi.getProfilePictureBlobUrl(currentAvatarBlobId);
        currentAvatarViewUrl = blobUrl;
        viewPhotoImg.src = blobUrl;
        viewPhotoModal.style.display = "flex";
      } catch (error) {
        alert("No se pudo cargar la foto de perfil.");
      }
    } else {
      alert("No tienes una foto de perfil guardada.");
    }
  });

  closeViewPhoto.addEventListener("click", () => {
    viewPhotoModal.style.display = "none";
  });

  viewPhotoModal.addEventListener("click", (e) => {
    if (e.target === viewPhotoModal) viewPhotoModal.style.display = "none";
  });

  btnMenuTake.addEventListener("click", () => {
    avatarDropdown.style.display = "none";
    photoModal.style.display = "flex";
    showCameraView();
  });

  btnMenuUpload.addEventListener("click", () => {
    avatarDropdown.style.display = "none";
    photoModal.style.display = "flex";
    showUploadView();
  });

  btnMenuDelete.addEventListener("click", () => {
    avatarDropdown.style.display = "none";
    deleteModal.style.display = "flex";
  });

  // =============================================
  // DELETE PHOTO
  // =============================================
  btnCancelDelete.addEventListener("click", () => {
    deleteModal.style.display = "none";
  });

  btnConfirmDelete.addEventListener("click", async () => {
    if (currentAvatarBlobId) {
      try {
        await userProfileApi.deleteProfilePicture(currentAvatarBlobId);
      } catch (error) {
        console.error("Failed to delete avatar:", error);
      }
    }
    currentAvatarBlobId = null;
    currentAvatarViewUrl = null;
    avatarDiv.style.backgroundImage = "none";
    avatarDiv.innerHTML = '<i class="fa-solid fa-user"></i>';
    deleteModal.style.display = "none";
  });

  // =============================================
  // EDIT PROFILE FORM — VALIDATION & FILTERING
  // =============================================
  function onlyLetters(e) {
    const allowed = /^[a-zA-Z\u00C0-\u024F\s]$/;
    if (
      !allowed.test(e.key) &&
      !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
    ) {
      e.preventDefault();
    }
  }

  function onlyDigits(e) {
    if (
      !/^[0-9]$/.test(e.key) &&
      !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
    ) {
      e.preventDefault();
    }
  }

  inputNombres.addEventListener("keydown", onlyLetters);
  inputApellidos.addEventListener("keydown", onlyLetters);
  inputTelefono.addEventListener("keydown", onlyDigits);

  function showError(wrapId, errId, msg) {
    document.getElementById(wrapId).classList.add("error");
    document.getElementById(errId).textContent = msg;
  }

  function clearError(wrapId, errId) {
    document.getElementById(wrapId).classList.remove("error");
    document.getElementById(errId).textContent = "";
  }

  function clearAllErrors() {
    clearError("wrap-nombres", "err-nombres");
    clearError("wrap-apellidos", "err-apellidos");
    clearError("wrap-telefono", "err-telefono");
    clearError("wrap-cedula", "err-cedula");
  }

  function validateForm() {
    let valid = true;
    const lettersOnly = /^[a-zA-Z\u00C0-\u024F\s]+$/;
    const digitsOnly = /^[0-9]+$/;

    clearAllErrors();

    const n = inputNombres.value.trim();
    if (!n) {
      showError("wrap-nombres", "err-nombres", "El nombre es requerido.");
      valid = false;
    } else if (!lettersOnly.test(n)) {
      showError("wrap-nombres", "err-nombres", "Solo se permiten letras.");
      valid = false;
    }

    const a = inputApellidos.value.trim();
    if (!a) {
      showError("wrap-apellidos", "err-apellidos", "El apellido es requerido.");
      valid = false;
    } else if (!lettersOnly.test(a)) {
      showError("wrap-apellidos", "err-apellidos", "Solo se permiten letras.");
      valid = false;
    }

    const t = inputTelefono.value.trim();
    if (t && !digitsOnly.test(t)) {
      showError("wrap-telefono", "err-telefono", "Solo se permiten números.");
      valid = false;
    }

    return valid;
  }

  btnOpenEditProfile.addEventListener("click", async () => {
    clearAllErrors();

    if (!currentProfile) {
      try {
        currentProfile = await userProfileApi.getMyProfile();
      } catch (e) {
        console.error(e);
        return;
      }
    }

    inputNombres.value = currentProfile.first_name ?? "";
    inputApellidos.value = currentProfile.last_name ?? "";
    inputTelefono.value = currentProfile.phone_number ?? "";
    inputCedula.value = currentProfile.national_id ?? "";
    inputMunicipio.value = currentProfile.municipality_id ?? "";

    if (currentAvatarViewUrl) {
      editPhotoPreview.innerHTML = "";
      editPhotoPreview.style.backgroundImage = `url(${currentAvatarViewUrl})`;
      editPhotoPreview.style.backgroundSize = "cover";
      editPhotoPreview.style.backgroundPosition = "center";
    } else {
      editPhotoPreview.style.backgroundImage = "none";
      editPhotoPreview.innerHTML = '<i class="fa-solid fa-user"></i>';
    }

    editProfileModal.style.display = "flex";
  });

  function closeEditProfileModal() {
    editProfileModal.style.display = "none";
    clearAllErrors();
  }

  closeEditProfile.addEventListener("click", closeEditProfileModal);
  btnCancelEditProfile.addEventListener("click", closeEditProfileModal);

  btnSaveEditProfile.addEventListener("click", async () => {
    if (!validateForm()) return;

    const originalBtnContent = btnSaveEditProfile.innerHTML;
    btnSaveEditProfile.disabled = true;
    btnSaveEditProfile.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    const payload = {
      first_name: inputNombres.value.trim(),
      last_name: inputApellidos.value.trim(),
      phone_number: inputTelefono.value.trim() || null,
      national_id: inputCedula.value.trim() || null,
      municipality_id: inputMunicipio.value || null,
    };

    try {
      const updatedProfile = await userProfileApi.updateMyProfile(payload);
      currentProfile = updatedProfile;

      if (displayNombres)
        displayNombres.textContent = updatedProfile.first_name ?? "";
      if (displayApellidos)
        displayApellidos.textContent = updatedProfile.last_name ?? "";
      if (displayFullname)
        displayFullname.textContent =
          `${updatedProfile.first_name ?? ""} ${updatedProfile.last_name ?? ""}`.trim();
      if (displayTelefono)
        displayTelefono.textContent = updatedProfile.phone_number ?? "—";
      if (displayCedula)
        displayCedula.textContent = updatedProfile.national_id ?? "—";
      if (displayMunicipio && geoManager) {
        const selectedMun = geoManager.getMunicipalityById(
          updatedProfile.municipality_id,
        );
        displayMunicipio.textContent = selectedMun
          ? selectedMun.name
          : (updatedProfile.municipality_id ?? "—");
      }

      closeEditProfileModal();
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert(
        error.message || "No se pudo actualizar el perfil. Inténtalo de nuevo.",
      );
    } finally {
      btnSaveEditProfile.disabled = false;
      btnSaveEditProfile.innerHTML = originalBtnContent;
    }
  });

  btnChangePhotoInEdit.addEventListener("click", () => {
    closeEditProfileModal();
    photoModal.style.display = "flex";
    showChoiceView();
  });

  // =============================================
  // PHOTO MODAL VIEWS
  // =============================================
  function hideAllViews() {
    choiceView.style.display = "none";
    uploadView.style.display = "none";
    cameraView.style.display = "none";
    adjustView.style.display = "none";
  }

  function closeAndStop() {
    photoModal.style.display = "none";
    hideAllViews();
    stopCamera();
  }

  closeModalTop.addEventListener("click", closeAndStop);
  closeModalBtn.addEventListener("click", closeAndStop);

  function showChoiceView() {
    hideAllViews();
    choiceView.style.display = "block";
    modalTitle.textContent = "Cambiar foto de Perfil";
  }

  function showUploadView() {
    hideAllViews();
    uploadView.style.display = "block";
    modalTitle.textContent = "Seleccionar imagen";
    stopCamera();
  }

  function showCameraView() {
    hideAllViews();
    cameraView.style.display = "block";
    modalTitle.textContent = "Tomar foto";
    startCamera();
  }

  function showAdjustView() {
    hideAllViews();
    adjustView.style.display = "block";
    modalTitle.textContent = "Ajustar foto";
    stopCamera();

    photoCanvas.width = photoCanvas.clientWidth;
    photoCanvas.height = photoCanvas.clientHeight;
    scale = 1;
    offsetX = 0;
    offsetY = 0;
    drawImageToCanvas();
  }

  btnChoiceCamera.addEventListener("click", showCameraView);
  btnChoiceUpload.addEventListener("click", showUploadView);
  btnCancelChoice.addEventListener("click", closeAndStop);

  // =============================================
  // UPLOAD / DRAG & DROP
  // =============================================
  btnCancelUpload.addEventListener("click", () => showChoiceView());
  btnBrowseFile.addEventListener("click", () => fileInput.click());

  dragDropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dragDropZone.classList.add("dragover");
  });
  dragDropZone.addEventListener("dragleave", () =>
    dragDropZone.classList.remove("dragover"),
  );
  dragDropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dragDropZone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0)
      handleFile(e.dataTransfer.files[0]);
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0)
      handleFile(e.target.files[0]);
  });

  function handleFile(file) {
    if (!file || (file.type !== "image/jpeg" && file.type !== "image/png"))
      return;
    if (file.size > 3 * 1024 * 1024) {
      alert("El archivo excede 3MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      currentImage = new Image();
      currentImage.onload = () => showAdjustView();
      currentImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  btnContinueUpload.addEventListener("click", () => {
    if (currentImage) showAdjustView();
  });

  btnUploadFile.addEventListener("click", () => fileInput.click());

  // =============================================
  // CAMERA
  // =============================================
  btnCancelCamera.addEventListener("click", () => showChoiceView());

  async function startCamera() {
    try {
      cameraMessage.style.display = "none";
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      videoElement.srcObject = stream;
      videoElement.play();
    } catch (err) {
      cameraMessage.style.display = "block";
      cameraMessage.innerHTML =
        '<i class="fa-solid fa-camera"></i><p>Se necesita acceso a la cámara<br>para tomar la foto de perfil.</p>';
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
  }

  btnShutter.addEventListener("click", () => {
    if (!stream) return;
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = videoElement.videoWidth;
    tmpCanvas.height = videoElement.videoHeight;
    tmpCanvas.getContext("2d").drawImage(videoElement, 0, 0);
    currentImage = new Image();
    currentImage.onload = () => showAdjustView();
    currentImage.src = tmpCanvas.toDataURL("image/jpeg");
  });

  btnRetake.addEventListener("click", () => showCameraView());

  // =============================================
  // ADJUST / CANVAS
  // =============================================
  btnCancelAdjust.addEventListener("click", () => {
    currentImage = null;
    showChoiceView();
  });

  function drawImageToCanvas() {
    if (!currentImage) return;
    ctx.clearRect(0, 0, photoCanvas.width, photoCanvas.height);
    const sx = photoCanvas.width / currentImage.width;
    const sy = photoCanvas.height / currentImage.height;
    const base = Math.max(sx, sy) * scale;
    const dw = currentImage.width * base;
    const dh = currentImage.height * base;
    const dx = (photoCanvas.width - dw) / 2 + offsetX;
    const dy = (photoCanvas.height - dh) / 2 + offsetY;
    ctx.drawImage(currentImage, dx, dy, dw, dh);
  }

  const btnZoomOut = document.querySelector(".fa-minus").parentElement;
  const btnZoomIn = document.querySelector(".fa-plus").parentElement;
  btnZoomIn.addEventListener("click", () => {
    scale += 0.1;
    drawImageToCanvas();
  });
  btnZoomOut.addEventListener("click", () => {
    if (scale > 0.5) {
      scale -= 0.1;
      drawImageToCanvas();
    }
  });

  // =============================================
  // DRAG / PAN
  // =============================================
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartOffsetX = 0;
  let dragStartOffsetY = 0;

  photoCanvas.addEventListener("mousedown", (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartOffsetX = offsetX;
    dragStartOffsetY = offsetY;
    photoCanvas.style.cursor = "grabbing";
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    offsetX = dragStartOffsetX + dx;
    offsetY = dragStartOffsetY + dy;
    drawImageToCanvas();
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
    photoCanvas.style.cursor = "grab";
  });

  photoCanvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      isDragging = true;
      dragStartX = e.touches[0].clientX;
      dragStartY = e.touches[0].clientY;
      dragStartOffsetX = offsetX;
      dragStartOffsetY = offsetY;
    },
    { passive: false },
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      if (!isDragging) return;
      if (e.touches.length !== 1) return;
      e.preventDefault();
      const dx = e.touches[0].clientX - dragStartX;
      const dy = e.touches[0].clientY - dragStartY;
      offsetX = dragStartOffsetX + dx;
      offsetY = dragStartOffsetY + dy;
      drawImageToCanvas();
    },
    { passive: false },
  );

  window.addEventListener("touchend", () => {
    isDragging = false;
  });

  // =============================================
  // SAVE PHOTO
  // =============================================
  btnSavePhoto.addEventListener("click", () => {
    const size = Math.min(photoCanvas.width, photoCanvas.height);
    const x = (photoCanvas.width - size) / 2;
    const y = (photoCanvas.height - size) / 2;
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = size;
    finalCanvas.height = size;
    finalCanvas
      .getContext("2d")
      .drawImage(photoCanvas, x, y, size, size, 0, 0, size, size);

    finalCanvas.toBlob(
      async (blob) => {
        if (!blob) return;
        const file = new File([blob], "profile-picture.jpg", {
          type: "image/jpeg",
        });

        try {
          await userProfileApi.changeProfilePicture(file);

          const dataUrl = finalCanvas.toDataURL("image/jpeg");
          currentAvatarViewUrl = dataUrl;
          setAvatarImage(dataUrl);

          const profile = await userProfileApi.getMyProfile();
          currentAvatarBlobId = profile.avatar_blob_id || null;

          closeAndStop();
        } catch (error) {
          alert(error.message || "Failed to upload profile picture.");
        }
      },
      "image/jpeg",
      0.9,
    );
  });
});
