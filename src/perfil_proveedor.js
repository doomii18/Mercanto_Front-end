document.addEventListener('DOMContentLoaded', () => {

    // --- Claves de LocalStorage ---
    const STORAGE_KEY_INFO = 'mercanto_provider_info';
    const STORAGE_KEY_LOGO = 'mercanto_provider_logo';

    // Valores por defecto
    const defaultData = {
        bio: 'Ofrecemos a las familias productos de la más alta calidad y prestamos un servicio al cliente destacado por su eficiencia, amabilidad y cortesía.',
        ruc: 'J0310000664348',
        negocioName: 'E. Chamorro Industrial S.A',
        tipoNegocio: 'Industria manufacturera',
        telNegocio: '8730 9208',
        direccion: 'Calle La Inmaculada en la ciudad de Granada, Nicaragua.',
        cedulaProp: '401-230900-5001F',
        nombreProp: 'Ernesto Chamorro',
        correoProp: 'echamorro@gmail.com',
        telProp: '8790 - 6723'
    };

    // --- Elementos DOM: Vista Perfil ---
    const viewProfile = document.getElementById('view-profile');
    const viewEdit   = document.getElementById('view-edit');

    const dispHeaderBusinessName = document.getElementById('display-header-business-name');
    const dispHeaderEmail        = document.getElementById('display-header-email');
    const dispProviderBio        = document.getElementById('display-provider-bio');
    const providerAvatarImg      = document.getElementById('provider-avatar-img');

    const dispRuc               = document.getElementById('disp-ruc');
    const dispNegocioName       = document.getElementById('disp-negocio-name');
    const dispTipoNegocio       = document.getElementById('disp-tipo-negocio');
    const dispTelefonoNegocio   = document.getElementById('disp-telefono-negocio');
    const dispDireccionNegocio  = document.getElementById('disp-direccion-negocio');
    const dispCedulaPropietario = document.getElementById('disp-cedula-propietario');
    const dispNombrePropietario = document.getElementById('disp-nombre-propietario');
    const dispCorreoPropietario = document.getElementById('disp-correo-propietario');
    const dispTelefonoPropietario = document.getElementById('disp-telefono-propietario');

    // --- Elementos DOM: Avatar dropdown (en vista perfil) ---
    const btnAvatarCamera  = document.getElementById('btn-avatar-camera');
    const avatarDropdown   = document.getElementById('avatar-dropdown');
    const btnViewPhoto     = document.getElementById('btn-view-photo');
    const btnUploadPhoto   = document.getElementById('btn-upload-photo');
    const btnDeletePhoto   = document.getElementById('btn-delete-photo');
    const providerFileInput = document.getElementById('provider-file-input');

    // --- Elementos DOM: Modal ver foto ---
    const viewPhotoModal = document.getElementById('view-photo-modal');
    const viewPhotoImg   = document.getElementById('view-photo-img');
    const closeViewPhoto = document.getElementById('close-view-photo');

    // --- Elementos DOM: Vista Editar ---
    const btnOpenEdit  = document.getElementById('btn-open-edit-provider');
    const btnEditBack  = document.getElementById('btn-edit-back');
    const btnInlineCancel = document.getElementById('btn-inline-cancel');
    const btnInlineSave   = document.getElementById('btn-inline-save');

    const editPreviewImg         = document.getElementById('edit-preview-img');
    const btnChangePhotoInline   = document.getElementById('btn-change-photo-inline');
    const editFileInput          = document.getElementById('edit-file-input');

    const inputRuc         = document.getElementById('input-ruc');
    const inputNegocioName = document.getElementById('input-negocio-name');
    const inputTipoNegocio = document.getElementById('input-tipo-negocio');
    const inputTelNegocio  = document.getElementById('input-tel-negocio');
    const inputDireccion   = document.getElementById('input-direccion');
    const inputCedulaProp  = document.getElementById('input-cedula-prop');
    const inputNombreProp  = document.getElementById('input-nombre-prop');
    const inputCorreoProp  = document.getElementById('input-correo-prop');
    const inputTelProp     = document.getElementById('input-tel-prop');

    // --- Mobile menu toggle ---
    const mobileMenuBtn = document.getElementById("mobile-menu-btn");
    const sidebarMenu   = document.getElementById("sidebar-menu");
    if (mobileMenuBtn && sidebarMenu) {
        mobileMenuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            sidebarMenu.classList.toggle("open");
        });
        document.addEventListener("click", (e) => {
            if (!sidebarMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                sidebarMenu.classList.remove("open");
            }
        });
    }

    // ============================================================
    // 1. CARGAR DATOS EN LA VISTA DE PERFIL
    // ============================================================
    function loadSavedData() {
        const raw  = localStorage.getItem(STORAGE_KEY_INFO);
        const data = raw ? JSON.parse(raw) : defaultData;

        dispHeaderBusinessName.textContent = data.negocioName  || defaultData.negocioName;
        dispHeaderEmail.textContent        = data.correoProp    || 'ecisa@echamorro.com';
        dispProviderBio.textContent        = data.bio           || defaultData.bio;

        dispRuc.textContent               = data.ruc            || defaultData.ruc;
        dispNegocioName.textContent       = data.negocioName    || defaultData.negocioName;
        dispTipoNegocio.textContent       = data.tipoNegocio    || defaultData.tipoNegocio;
        dispTelefonoNegocio.textContent   = data.telNegocio     || defaultData.telNegocio;
        dispDireccionNegocio.textContent  = data.direccion      || defaultData.direccion;
        dispCedulaPropietario.textContent = data.cedulaProp     || defaultData.cedulaProp;
        dispNombrePropietario.textContent = data.nombreProp     || defaultData.nombreProp;
        dispCorreoPropietario.textContent = data.correoProp     || defaultData.correoProp;
        dispTelefonoPropietario.textContent = data.telProp      || defaultData.telProp;

        // Logo
        const savedLogo = localStorage.getItem(STORAGE_KEY_LOGO);
        const logoSrc = savedLogo || './src/assets/ech-logo.png';
        providerAvatarImg.src = logoSrc;
        viewPhotoImg.src = logoSrc;
        editPreviewImg.src = logoSrc;
    }

    loadSavedData();

    // ============================================================
    // 2. CAMBIO ENTRE VISTAS PERFIL ↔ EDITAR
    // ============================================================
    function showEditView() {
        // Poblar los inputs con los valores actuales
        const raw  = localStorage.getItem(STORAGE_KEY_INFO);
        const data = raw ? JSON.parse(raw) : defaultData;

        inputRuc.value         = data.ruc          || defaultData.ruc;
        inputNegocioName.value = data.negocioName  || defaultData.negocioName;
        inputTipoNegocio.value = data.tipoNegocio  || defaultData.tipoNegocio;
        inputTelNegocio.value  = data.telNegocio   || defaultData.telNegocio;
        inputDireccion.value   = data.direccion    || defaultData.direccion;
        inputCedulaProp.value  = data.cedulaProp   || defaultData.cedulaProp;
        inputNombreProp.value  = data.nombreProp   || defaultData.nombreProp;
        inputCorreoProp.value  = data.correoProp   || defaultData.correoProp;
        inputTelProp.value     = data.telProp      || defaultData.telProp;

        // Sync foto
        const savedLogo = localStorage.getItem(STORAGE_KEY_LOGO);
        editPreviewImg.src = savedLogo || './src/assets/ech-logo.png';

        // Mostrar vista de edición, ocultar perfil
        viewProfile.style.display = 'none';
        viewEdit.style.display    = 'block';

        // Scroll al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showProfileView() {
        viewEdit.style.display    = 'none';
        viewProfile.style.display = 'flex';
        // provider-content-layout usa flex-direction: column, así que dejamos que el wrapper lo maneje
        viewProfile.style.display = 'contents';
    }

    // Botón "Editar" en la tarjeta de información
    btnOpenEdit.addEventListener('click', showEditView);

    // Botón flecha ← en la vista editar
    btnEditBack.addEventListener('click', () => {
        showProfileView();
    });

    // Botón "Cancelar" (naranja)
    btnInlineCancel.addEventListener('click', () => {
        showProfileView();
    });

    // ============================================================
    // 3. GUARDAR CAMBIOS
    // ============================================================
    btnInlineSave.addEventListener('click', () => {
        const updated = {
            ruc:         inputRuc.value.trim()         || defaultData.ruc,
            negocioName: inputNegocioName.value.trim() || defaultData.negocioName,
            tipoNegocio: inputTipoNegocio.value.trim() || defaultData.tipoNegocio,
            telNegocio:  inputTelNegocio.value.trim()  || defaultData.telNegocio,
            direccion:   inputDireccion.value.trim()   || defaultData.direccion,
            cedulaProp:  inputCedulaProp.value.trim()  || defaultData.cedulaProp,
            nombreProp:  inputNombreProp.value.trim()  || defaultData.nombreProp,
            correoProp:  inputCorreoProp.value.trim()  || defaultData.correoProp,
            telProp:     inputTelProp.value.trim()     || defaultData.telProp,
            bio:         defaultData.bio  // bio no se edita en este formulario
        };

        localStorage.setItem(STORAGE_KEY_INFO, JSON.stringify(updated));
        loadSavedData();
        showProfileView();
    });

    // ============================================================
    // 4. CAMBIAR FOTO DENTRO DE LA VISTA EDITAR
    // ============================================================
    btnChangePhotoInline.addEventListener('click', () => {
        editFileInput.click();
    });

    editFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.match('image/jpeg') && !file.type.match('image/png') && !file.type.match('image/jpg')) {
            alert('Por favor selecciona una imagen en formato JPG o PNG.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (evt) => {
            const dataUrl = evt.target.result;
            editPreviewImg.src   = dataUrl;
            providerAvatarImg.src = dataUrl;
            viewPhotoImg.src     = dataUrl;
            localStorage.setItem(STORAGE_KEY_LOGO, dataUrl);
        };
        reader.readAsDataURL(file);
    });

    // ============================================================
    // 5. AVATAR DROPDOWN (en vista perfil)
    // ============================================================
    btnAvatarCamera.addEventListener('click', (e) => {
        e.stopPropagation();
        avatarDropdown.style.display =
            (avatarDropdown.style.display === 'flex' || avatarDropdown.style.display === 'block')
            ? 'none' : 'flex';
    });

    document.addEventListener('click', (e) => {
        if (!avatarDropdown.contains(e.target) && e.target !== btnAvatarCamera) {
            avatarDropdown.style.display = 'none';
        }
    });

    // Ver logo
    btnViewPhoto.addEventListener('click', () => {
        avatarDropdown.style.display = 'none';
        viewPhotoModal.style.display = 'flex';
    });

    closeViewPhoto.addEventListener('click', () => {
        viewPhotoModal.style.display = 'none';
    });

    // Subir logo
    btnUploadPhoto.addEventListener('click', () => {
        avatarDropdown.style.display = 'none';
        providerFileInput.click();
    });

    providerFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.match('image/jpeg') && !file.type.match('image/png') && !file.type.match('image/jpg')) {
            alert('Por favor selecciona una imagen en formato JPG o PNG.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (evt) => {
            const dataUrl = evt.target.result;
            providerAvatarImg.src = dataUrl;
            viewPhotoImg.src      = dataUrl;
            editPreviewImg.src    = dataUrl;
            localStorage.setItem(STORAGE_KEY_LOGO, dataUrl);
        };
        reader.readAsDataURL(file);
    });

    // Eliminar logo
    btnDeletePhoto.addEventListener('click', () => {
        avatarDropdown.style.display = 'none';
        localStorage.removeItem(STORAGE_KEY_LOGO);
        const defaultSrc = './src/assets/ech-logo.png';
        providerAvatarImg.src = defaultSrc;
        viewPhotoImg.src      = defaultSrc;
        editPreviewImg.src    = defaultSrc;
    });

});
