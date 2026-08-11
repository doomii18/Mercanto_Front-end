import { bootstrapSession, userProfileApi } from "./api";

document.addEventListener('DOMContentLoaded', async () => {
    await bootstrapSession();

    // =============================================
    // ELEMENT REFERENCES
    // =============================================
    const editAvatarBtn = document.querySelector('.edit-avatar');
    const avatarDropdown = document.getElementById('avatar-dropdown');
    const avatarDiv = document.querySelector('.avatar');

    // Photo modals
    const photoModal = document.getElementById('photo-modal');
    const deleteModal = document.getElementById('delete-modal');
    const viewPhotoModal = document.getElementById('view-photo-modal');

    const closeModalTop = document.getElementById('close-modal-top');
    const closeModalBtn = document.getElementById('close-modal-btn');

    // Views inside photo-modal
    const choiceView = document.getElementById('choice-view');
    const uploadView = document.getElementById('upload-view');
    const cameraView = document.getElementById('camera-view');
    const adjustView = document.getElementById('adjust-view');
    const modalTitle = document.getElementById('modal-title');

    // Dropdown items
    const btnMenuView = document.getElementById('btn-menu-view');
    const btnMenuTake = document.getElementById('btn-menu-take');
    const btnMenuUpload = document.getElementById('btn-menu-upload');
    const btnMenuDelete = document.getElementById('btn-menu-delete');

    // Choice view
    const btnChoiceUpload = document.getElementById('btn-choice-upload');
    const btnChoiceCamera = document.getElementById('btn-choice-camera');
    const btnCancelChoice = document.getElementById('btn-cancel-choice');

    // Upload view
    const dragDropZone = document.getElementById('drag-drop-zone');
    const btnBrowseFile = document.getElementById('btn-browse-file');
    const btnCancelUpload = document.getElementById('btn-cancel-upload');
    const btnContinueUpload = document.getElementById('btn-continue-upload');

    // Camera
    const videoElement = document.getElementById('camera-stream');
    const cameraMessage = document.getElementById('camera-message');
    const btnCancelCamera = document.getElementById('btn-cancel-camera');
    const btnShutter = document.getElementById('btn-shutter');
    const btnUploadFile = document.getElementById('btn-upload-file');
    const fileInput = document.getElementById('profile-file-input');

    // Adjust
    const photoCanvas = document.getElementById('photo-canvas');
    const ctx = photoCanvas.getContext('2d');
    const btnCancelAdjust = document.getElementById('btn-cancel-adjust');
    const btnSavePhoto = document.getElementById('btn-save-photo');
    const btnRetake = document.getElementById('btn-retake');

    // Delete
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');

    // View Photo
    const viewPhotoImg = document.getElementById('view-photo-img');
    const closeViewPhoto = document.getElementById('close-view-photo');

    // Edit Profile Modal
    const editProfileModal = document.getElementById('edit-profile-modal');
    const btnOpenEditProfile = document.getElementById('btn-open-edit-profile');
    const closeEditProfile = document.getElementById('close-edit-profile');
    const btnCancelEditProfile = document.getElementById('btn-cancel-edit-profile');
    const btnSaveEditProfile = document.getElementById('btn-save-edit-profile');
    const editPhotoPreview = document.getElementById('edit-photo-preview');
    const btnChangePhotoInEdit = document.getElementById('btn-change-photo-in-edit');

    // Edit form inputs
    const inputNombres = document.getElementById('input-nombres');
    const inputApellidos = document.getElementById('input-apellidos');
    const inputCorreo = document.getElementById('input-correo');
    const inputTelefono = document.getElementById('input-telefono');
    const inputCedula = document.getElementById('input-cedula');
    const inputDepartamento = document.getElementById('input-departamento');

    // Display spans
    const displayNombres = document.getElementById('display-nombres');
    const displayApellidos = document.getElementById('display-apellidos');
    const displayCorreo = document.getElementById('display-correo');
    const displayTelefono = document.getElementById('display-telefono');
    const displayCedula = document.getElementById('display-cedula');
    const displayDepartamento = document.getElementById('display-departamento');
    // Header displays
    const displayFullname = document.getElementById('display-fullname');
    const displayCorreoHeader = document.getElementById('display-correo-header');

    let stream = null;
    let currentImage = null;
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let currentAvatarBlobId = null;
    let currentAvatarViewUrl = null;

    // =============================================
    // LOAD SAVED DATA FROM LOCALSTORAGE
    // =============================================
    function loadSavedData() {
        // Profile info
        const savedInfo = JSON.parse(localStorage.getItem('mercanto_profile_info') || '{}');
        if (savedInfo.nombres) displayNombres.textContent = savedInfo.nombres;
        if (savedInfo.apellidos) displayApellidos.textContent = savedInfo.apellidos;
        if (savedInfo.correo) displayCorreo.textContent = savedInfo.correo;
        if (savedInfo.telefono) displayTelefono.textContent = savedInfo.telefono;
        if (savedInfo.cedula) displayCedula.textContent = savedInfo.cedula;
        if (savedInfo.departamento) displayDepartamento.textContent = savedInfo.departamento;

        // Restore header name and email
        if (savedInfo.nombres && savedInfo.apellidos && displayFullname) {
            displayFullname.textContent = `${savedInfo.nombres} ${savedInfo.apellidos}`;
        }
        if (savedInfo.correo && displayCorreoHeader) {
            displayCorreoHeader.textContent = savedInfo.correo;
        }
    }

    async function loadAvatarFromServer() {
        try {
            const profile = await userProfileApi.getMyProfile();
            if (profile.avatar_blob_id) {
                currentAvatarBlobId = profile.avatar_blob_id;
                const blobUrl = await userProfileApi.getProfilePictureBlobUrl(profile.avatar_blob_id);
                currentAvatarViewUrl = blobUrl;
                setAvatarImage(blobUrl);
            }
        } catch (error) {
            console.error("Failed to load avatar from server:", error);
        }
    }

    function setAvatarImage(dataUrl) {
        avatarDiv.innerHTML = '';
        avatarDiv.style.backgroundImage = `url(${dataUrl})`;
        avatarDiv.style.backgroundSize = 'cover';
        avatarDiv.style.backgroundPosition = 'center';
    }

    loadSavedData();
    await loadAvatarFromServer();

    // =============================================
    // DROPDOWN MENU
    // =============================================
    editAvatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        avatarDropdown.style.display = avatarDropdown.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', (e) => {
        if (!editAvatarBtn.contains(e.target) && !avatarDropdown.contains(e.target)) {
            avatarDropdown.style.display = 'none';
        }
    });

    // =============================================
    // DROPDOWN ACTIONS
    // =============================================
    btnMenuView.addEventListener('click', async () => {
        avatarDropdown.style.display = 'none';
        if (currentAvatarViewUrl) {
            viewPhotoImg.src = currentAvatarViewUrl;
            viewPhotoModal.style.display = 'flex';
        } else if (currentAvatarBlobId) {
            try {
                const blobUrl = await userProfileApi.getProfilePictureBlobUrl(currentAvatarBlobId);
                currentAvatarViewUrl = blobUrl;
                viewPhotoImg.src = blobUrl;
                viewPhotoModal.style.display = 'flex';
            } catch (error) {
                alert('No se pudo cargar la foto de perfil.');
            }
        } else {
            alert('No tienes una foto de perfil guardada.');
        }
    });

    closeViewPhoto.addEventListener('click', () => {
        viewPhotoModal.style.display = 'none';
    });

    viewPhotoModal.addEventListener('click', (e) => {
        if (e.target === viewPhotoModal) viewPhotoModal.style.display = 'none';
    });

    btnMenuTake.addEventListener('click', () => {
        avatarDropdown.style.display = 'none';
        photoModal.style.display = 'flex';
        showCameraView();
    });

    btnMenuUpload.addEventListener('click', () => {
        avatarDropdown.style.display = 'none';
        photoModal.style.display = 'flex';
        showUploadView();
    });

    btnMenuDelete.addEventListener('click', () => {
        avatarDropdown.style.display = 'none';
        deleteModal.style.display = 'flex';
    });

    // =============================================
    // DELETE PHOTO
    // =============================================
    btnCancelDelete.addEventListener('click', () => {
        deleteModal.style.display = 'none';
    });

    btnConfirmDelete.addEventListener('click', async () => {
        if (currentAvatarBlobId) {
            try {
                await userProfileApi.deleteProfilePicture(currentAvatarBlobId);
            } catch (error) {
                console.error("Failed to delete avatar:", error);
            }
        }
        currentAvatarBlobId = null;
        currentAvatarViewUrl = null;
        avatarDiv.style.backgroundImage = 'none';
        avatarDiv.innerHTML = '<i class="fa-solid fa-user"></i>';
        deleteModal.style.display = 'none';
    });

    // =============================================
    // EDIT PROFILE FORM — VALIDATION & FILTERING
    // =============================================

    // Real-time: only letters and spaces for names
    function onlyLetters(e) {
        const allowed = /^[a-zA-Z\u00C0-\u024F\s]$/;
        if (!allowed.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(e.key)) {
            e.preventDefault();
        }
    }
    // Real-time: only digits for phone
    function onlyDigits(e) {
        if (!/^[0-9]$/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(e.key)) {
            e.preventDefault();
        }
    }

    inputNombres.addEventListener('keydown', onlyLetters);
    inputApellidos.addEventListener('keydown', onlyLetters);
    inputTelefono.addEventListener('keydown', onlyDigits);

    // Validation helpers
    function showError(wrapId, errId, msg) {
        document.getElementById(wrapId).classList.add('error');
        document.getElementById(errId).textContent = msg;
    }
    function clearError(wrapId, errId) {
        document.getElementById(wrapId).classList.remove('error');
        document.getElementById(errId).textContent = '';
    }
    function clearAllErrors() {
        clearError('wrap-nombres',   'err-nombres');
        clearError('wrap-apellidos', 'err-apellidos');
        clearError('wrap-correo',    'err-correo');
        clearError('wrap-telefono',  'err-telefono');
        clearError('wrap-cedula',    'err-cedula');
    }

    function validateForm() {
        let valid = true;
        const lettersOnly = /^[a-zA-Z\u00C0-\u024F\s]+$/;
        const emailReg    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const digitsOnly  = /^[0-9]+$/;

        clearAllErrors();

        const n = inputNombres.value.trim();
        if (!n) {
            showError('wrap-nombres','err-nombres','El nombre es requerido.'); valid = false;
        } else if (!lettersOnly.test(n)) {
            showError('wrap-nombres','err-nombres','Solo se permiten letras.'); valid = false;
        }

        const a = inputApellidos.value.trim();
        if (!a) {
            showError('wrap-apellidos','err-apellidos','El apellido es requerido.'); valid = false;
        } else if (!lettersOnly.test(a)) {
            showError('wrap-apellidos','err-apellidos','Solo se permiten letras.'); valid = false;
        }

        const c = inputCorreo.value.trim();
        if (!c) {
            showError('wrap-correo','err-correo','El correo es requerido.'); valid = false;
        } else if (!emailReg.test(c)) {
            showError('wrap-correo','err-correo','Formato de correo incorrecto.'); valid = false;
        }

        const t = inputTelefono.value.trim();
        if (t && !digitsOnly.test(t)) {
            showError('wrap-telefono','err-telefono','Solo se permiten números.'); valid = false;
        }

        return valid;
    }

    btnOpenEditProfile.addEventListener('click', async () => {
        clearAllErrors();
        // Pre-fill form with current data
        const savedInfo = JSON.parse(localStorage.getItem('mercanto_profile_info') || '{}');
        inputNombres.value = savedInfo.nombres || displayNombres.textContent;
        inputApellidos.value = savedInfo.apellidos || displayApellidos.textContent;
        inputCorreo.value = savedInfo.correo || displayCorreo.textContent;
        inputTelefono.value = savedInfo.telefono || displayTelefono.textContent;
        inputCedula.value = savedInfo.cedula || displayCedula.textContent;
        inputDepartamento.value = savedInfo.departamento || displayDepartamento.textContent;

        // Pre-fill photo preview in edit modal
        if (currentAvatarViewUrl) {
            editPhotoPreview.innerHTML = '';
            editPhotoPreview.style.backgroundImage = `url(${currentAvatarViewUrl})`;
            editPhotoPreview.style.backgroundSize = 'cover';
            editPhotoPreview.style.backgroundPosition = 'center';
        } else {
            editPhotoPreview.style.backgroundImage = 'none';
            editPhotoPreview.innerHTML = '<i class="fa-solid fa-user"></i>';
        }

        editProfileModal.style.display = 'flex';
    });

    function closeEditProfileModal() {
        editProfileModal.style.display = 'none';
        clearAllErrors();
    }

    closeEditProfile.addEventListener('click', closeEditProfileModal);
    btnCancelEditProfile.addEventListener('click', closeEditProfileModal);

    btnSaveEditProfile.addEventListener('click', () => {
        if (!validateForm()) return;

        const info = {
            nombres: inputNombres.value.trim(),
            apellidos: inputApellidos.value.trim(),
            correo: inputCorreo.value.trim(),
            telefono: inputTelefono.value.trim(),
            cedula: inputCedula.value.trim(),
            departamento: inputDepartamento.value.trim(),
        };

        // Save to localStorage
        localStorage.setItem('mercanto_profile_info', JSON.stringify(info));

        // Update info card
        if (info.nombres) displayNombres.textContent = info.nombres;
        if (info.apellidos) displayApellidos.textContent = info.apellidos;
        if (info.correo) displayCorreo.textContent = info.correo;
        if (info.telefono) displayTelefono.textContent = info.telefono;
        if (info.cedula) displayCedula.textContent = info.cedula;
        if (info.departamento) displayDepartamento.textContent = info.departamento;

        // Update profile header (name + email next to avatar)
        if (displayFullname) displayFullname.textContent = `${info.nombres} ${info.apellidos}`;
        if (displayCorreoHeader) displayCorreoHeader.textContent = info.correo;

        closeEditProfileModal();
    });


    btnChangePhotoInEdit.addEventListener('click', () => {
        closeEditProfileModal();
        photoModal.style.display = 'flex';
        showChoiceView();
    });

    // =============================================
    // PHOTO MODAL VIEWS
    // =============================================
    function hideAllViews() {
        choiceView.style.display = 'none';
        uploadView.style.display = 'none';
        cameraView.style.display = 'none';
        adjustView.style.display = 'none';
    }

    function closeAndStop() {
        photoModal.style.display = 'none';
        hideAllViews();
        stopCamera();
    }

    closeModalTop.addEventListener('click', closeAndStop);
    closeModalBtn.addEventListener('click', closeAndStop);

    function showChoiceView() {
        hideAllViews();
        choiceView.style.display = 'block';
        modalTitle.textContent = 'Cambiar foto de Perfil';
    }

    function showUploadView() {
        hideAllViews();
        uploadView.style.display = 'block';
        modalTitle.textContent = 'Seleccionar imagen';
        stopCamera();
    }

    function showCameraView() {
        hideAllViews();
        cameraView.style.display = 'block';
        modalTitle.textContent = 'Tomar foto';
        startCamera();
    }

    function showAdjustView() {
        hideAllViews();
        adjustView.style.display = 'block';
        modalTitle.textContent = 'Ajustar foto';
        stopCamera();

        // Square canvas: resolution matches the rendered CSS size
        const container = photoCanvas.parentElement;
        const rect = container.getBoundingClientRect();
        const size = Math.max(Math.round(rect.width), 1);
        photoCanvas.width = size;
        photoCanvas.height = size;

        scale = 1;
        offsetX = 0;
        offsetY = 0;
        drawImageToCanvas();
    }

    // Choice view
    btnChoiceCamera.addEventListener('click', showCameraView);
    btnChoiceUpload.addEventListener('click', showUploadView);
    btnCancelChoice.addEventListener('click', closeAndStop);

    // =============================================
    // UPLOAD / DRAG & DROP
    // =============================================
    btnCancelUpload.addEventListener('click', () => showChoiceView());
    btnBrowseFile.addEventListener('click', () => fileInput.click());

    dragDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dragDropZone.classList.add('dragover');
    });
    dragDropZone.addEventListener('dragleave', () => dragDropZone.classList.remove('dragover'));
    dragDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dragDropZone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) handleFile(e.target.files[0]);
    });

    function handleFile(file) {
        if (!file || (file.type !== 'image/jpeg' && file.type !== 'image/png')) return;
        if (file.size > 3 * 1024 * 1024) { alert('El archivo excede 3MB.'); return; }
        const reader = new FileReader();
        reader.onload = (event) => {
            currentImage = new Image();
            currentImage.onload = () => showAdjustView();
            currentImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    btnContinueUpload.addEventListener('click', () => {
        if (currentImage) showAdjustView();
    });

    btnUploadFile.addEventListener('click', () => fileInput.click());

    // =============================================
    // CAMERA
    // =============================================
    btnCancelCamera.addEventListener('click', () => showChoiceView());

    async function startCamera() {
        try {
            cameraMessage.style.display = 'none';
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            videoElement.srcObject = stream;
            videoElement.play();
        } catch (err) {
            cameraMessage.style.display = 'block';
            cameraMessage.innerHTML = '<i class="fa-solid fa-camera"></i><p>Se necesita acceso a la cámara<br>para tomar la foto de perfil.</p>';
        }
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            stream = null;
        }
    }

    btnShutter.addEventListener('click', () => {
        if (!stream) return;
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = videoElement.videoWidth;
        tmpCanvas.height = videoElement.videoHeight;
        tmpCanvas.getContext('2d').drawImage(videoElement, 0, 0);
        currentImage = new Image();
        currentImage.onload = () => showAdjustView();
        currentImage.src = tmpCanvas.toDataURL('image/jpeg');
    });

    btnRetake.addEventListener('click', () => showCameraView());

    // =============================================
    // ADJUST / CANVAS
    // =============================================
    btnCancelAdjust.addEventListener('click', () => {
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

        // Constrain pan so the image always covers the square canvas
        if (dw > photoCanvas.width) {
            const minOffsetX = (photoCanvas.width - dw) / 2;
            const maxOffsetX = (dw - photoCanvas.width) / 2;
            offsetX = Math.max(minOffsetX, Math.min(offsetX, maxOffsetX));
        } else {
            offsetX = 0;
        }

        if (dh > photoCanvas.height) {
            const minOffsetY = (photoCanvas.height - dh) / 2;
            const maxOffsetY = (dh - photoCanvas.height) / 2;
            offsetY = Math.max(minOffsetY, Math.min(offsetY, maxOffsetY));
        } else {
            offsetY = 0;
        }

        const dx = (photoCanvas.width - dw) / 2 + offsetX;
        const dy = (photoCanvas.height - dh) / 2 + offsetY;
        ctx.drawImage(currentImage, dx, dy, dw, dh);
    }

    const btnZoomOut = document.querySelector('.fa-minus').parentElement;
    const btnZoomIn = document.querySelector('.fa-plus').parentElement;
    btnZoomIn.addEventListener('click', () => { scale += 0.1; drawImageToCanvas(); });
    btnZoomOut.addEventListener('click', () => { if (scale > 0.5) { scale -= 0.1; drawImageToCanvas(); } });

    // --- Drag / Pan ---
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;

    photoCanvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragStartX = e.clientX - offsetX;
        dragStartY = e.clientY - offsetY;
        photoCanvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        offsetX = e.clientX - dragStartX;
        offsetY = e.clientY - dragStartY;
        drawImageToCanvas();
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
        photoCanvas.style.cursor = 'grab';
    });

    photoCanvas.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        isDragging = true;
        const t = e.touches[0];
        dragStartX = t.clientX - offsetX;
        dragStartY = t.clientY - offsetY;
    }, { passive: false });

    photoCanvas.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        e.preventDefault();
        const t = e.touches[0];
        offsetX = t.clientX - dragStartX;
        offsetY = t.clientY - dragStartY;
        drawImageToCanvas();
    }, { passive: false });

    photoCanvas.addEventListener('touchend', () => {
        isDragging = false;
    });

    // =============================================
    // SAVE PHOTO
    // =============================================
    btnSavePhoto.addEventListener('click', () => {
        // The canvas is already 1:1 and represents the exact crop area
        photoCanvas.toBlob(async (blob) => {
            if (!blob) return;

            if (blob.size > 3 * 1024 * 1024) {
                alert('La imagen recortada excede 3MB. Intenta reducir el zoom o usar una imagen más pequeña.');
                return;
            }

            const file = new File([blob], "profile-picture.jpg", { type: "image/jpeg" });

            try {
                await userProfileApi.changeProfilePicture(file);

                // Show immediate local preview
                const dataUrl = photoCanvas.toDataURL('image/jpeg');
                currentAvatarViewUrl = dataUrl;
                setAvatarImage(dataUrl);

                // Refresh blob ID from server so delete/view work
                const profile = await userProfileApi.getMyProfile();
                currentAvatarBlobId = profile.avatar_blob_id || null;

                closeAndStop();
            } catch (error) {
                alert(error.message || 'Failed to upload profile picture.');
            }
        }, 'image/jpeg', 0.9);
    });
});
