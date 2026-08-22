document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---

    // Steps containers
    const step1Content = document.getElementById('step1-content');
    const step2Content = document.getElementById('step2-content');
    const step3Content = document.getElementById('step3-content');

    // Stepper indicators
    const indStep1 = document.getElementById('indicator-step1');
    const indStep2 = document.getElementById('indicator-step2');
    const indStep3 = document.getElementById('indicator-step3');
    const line1 = document.getElementById('line-1');
    const line2 = document.getElementById('line-2');

    // Buttons
    const btnNextTo2 = document.getElementById('btn-next-to-2');
    const btnBackTo1 = document.getElementById('btn-back-to-1');
    const btnNextTo3 = document.getElementById('btn-next-to-3');
    const btnBackTo2 = document.getElementById('btn-back-to-2');
    const btnSubmit = document.getElementById('btn-submit');
    const btnCancelar = document.getElementById('btn-cancelar');
    const btnMapa = document.getElementById('btn-mapa');

    // Checkbox
    const confirmCheck = document.getElementById('confirm-check');

    // Drag & drop logo
    const dragDropLogo = document.getElementById('drag-drop-logo');
    const btnBrowseLogo = document.getElementById('btn-browse-logo');
    const fileLogo = document.getElementById('file-logo');
    const logoPreviewContainer = document.getElementById('logo-preview-container');
    const logoPreview = document.getElementById('logo-preview');
    const btnRemoveLogo = document.getElementById('btn-remove-logo');
    let logoDataUrl = null;

    // Cedula upload
    const btnSubirCedula = document.getElementById('btn-subir-cedula');
    const fileCedula = document.getElementById('file-cedula');
    const cedulaFilename = document.getElementById('cedula-filename');

    // Actions for step 3
    const step3Actions = document.getElementById('step3-actions');

    // --- Navigation Logic ---

    function showStep(step) {
        step1Content.style.display = 'none';
        step2Content.style.display = 'none';
        step3Content.style.display = 'none';
        step3Actions.style.display = 'none';

        if (step === 1) {
            step1Content.style.display = 'block';
            
            indStep1.classList.add('active');
            indStep1.classList.remove('completed');
            line1.classList.remove('active');
            
            indStep2.classList.remove('active');
            indStep2.classList.remove('completed');
            line2.classList.remove('active');
            
            indStep3.classList.remove('active');
            indStep3.classList.remove('completed');

        } else if (step === 2) {
            step2Content.style.display = 'block';
            
            indStep1.classList.add('completed');
            line1.classList.add('active');
            
            indStep2.classList.add('active');
            indStep2.classList.remove('completed');
            line2.classList.remove('active');
            
            indStep3.classList.remove('active');
            indStep3.classList.remove('completed');
            
        } else if (step === 3) {
            step3Content.style.display = 'block';
            step3Actions.style.display = 'flex';
            populateReview();
            
            indStep1.classList.add('completed');
            line1.classList.add('active');
            indStep2.classList.add('completed');
            line2.classList.add('active');
            indStep3.classList.add('active');
        }
    }

    btnNextTo2.addEventListener('click', () => showStep(2));
    btnBackTo1.addEventListener('click', () => showStep(1));
    btnNextTo3.addEventListener('click', () => showStep(3));
    btnBackTo2.addEventListener('click', () => showStep(2));
    
    btnCancelar.addEventListener('click', () => {
        window.location.href = 'registro.html';
    });

    if (btnMapa) {
        btnMapa.addEventListener('click', () => {
            btnMapa.classList.add('used');
        });
    }

    confirmCheck.addEventListener('change', (e) => {
        btnSubmit.disabled = !e.target.checked;
    });

    // Modals
    const modalConfirm = document.getElementById('modal-confirm');
    const modalSuccess = document.getElementById('modal-success');
    const btnCloseConfirm = document.getElementById('btn-close-confirm');
    const btnCancelModal = document.getElementById('btn-cancel-modal');
    const btnConfirmSend = document.getElementById('btn-confirm-send');
    const btnContinueSuccess = document.getElementById('btn-continue-success');

    btnSubmit.addEventListener('click', () => {
        modalConfirm.style.display = 'flex';
    });

    const closeModal = () => modalConfirm.style.display = 'none';
    btnCloseConfirm.addEventListener('click', closeModal);
    btnCancelModal.addEventListener('click', closeModal);

    btnConfirmSend.addEventListener('click', () => {
        modalConfirm.style.display = 'none';
        modalSuccess.style.display = 'flex';
    });

    btnContinueSuccess.addEventListener('click', () => {
        // Redirigir a la pantalla de crear contraseña
        window.location.href = 'registro_password.html';
    });

    // --- Logo Upload Logic (Drag & Drop) ---

    function handleLogoFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            if (!file.type.startsWith('image/')) {
                alert('Solo se permiten imágenes.');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                logoDataUrl = e.target.result;
                logoPreview.src = logoDataUrl;
                logoPreviewContainer.style.display = 'flex';
                dragDropLogo.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    }

    btnBrowseLogo.addEventListener('click', () => fileLogo.click());
    
    fileLogo.addEventListener('change', (e) => {
        handleLogoFiles(e.target.files);
    });

    dragDropLogo.addEventListener('dragover', (e) => {
        e.preventDefault();
        dragDropLogo.classList.add('dragover');
    });

    dragDropLogo.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragDropLogo.classList.remove('dragover');
    });

    dragDropLogo.addEventListener('drop', (e) => {
        e.preventDefault();
        dragDropLogo.classList.remove('dragover');
        handleLogoFiles(e.dataTransfer.files);
    });

    btnRemoveLogo.addEventListener('click', () => {
        logoDataUrl = null;
        logoPreview.src = '';
        fileLogo.value = '';
        logoPreviewContainer.style.display = 'none';
        dragDropLogo.style.display = 'block';
    });


    // --- Cedula Upload Logic ---

    btnSubirCedula.addEventListener('click', () => fileCedula.click());

    fileCedula.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            cedulaFilename.textContent = e.target.files[0].name;
            btnSubirCedula.innerHTML = 'Documento seleccionado <i class="fa-solid fa-check"></i>';
            btnSubirCedula.style.color = '#00a896';
            btnSubirCedula.style.borderColor = '#00a896';
        } else {
            cedulaFilename.textContent = '';
            btnSubirCedula.innerHTML = 'Subir documento <i class="fa-regular fa-file-image"></i>';
        }
    });

    // --- Populate Review Step ---

    function populateReview() {
        // Negocio
        document.getElementById('res-ruc').textContent = document.getElementById('negocio-ruc').value || '-';
        document.getElementById('res-negocio').textContent = document.getElementById('negocio-nombre').value || '-';
        document.getElementById('res-tipo').textContent = document.getElementById('negocio-tipo').value || '-';
        document.getElementById('res-tel-negocio').textContent = document.getElementById('negocio-telefono').value || '-';
        document.getElementById('res-direccion').textContent = document.getElementById('negocio-direccion').value || '-';

        // Propietario
        document.getElementById('res-cedula').textContent = document.getElementById('propietario-cedula').value || '-';
        document.getElementById('res-propietario').textContent = document.getElementById('propietario-nombre').value || '-';
        document.getElementById('res-correo').textContent = document.getElementById('propietario-correo').value || '-';
        document.getElementById('res-tel-prop').textContent = document.getElementById('propietario-telefono').value || '-';

        // Logo
        const reviewLogo = document.getElementById('review-logo');
        if (logoDataUrl) {
            reviewLogo.innerHTML = `<img src="${logoDataUrl}" alt="Logo del Negocio">`;
            reviewLogo.style.border = 'none';
        } else {
            reviewLogo.innerHTML = '<i class="fa-solid fa-image"></i>';
            reviewLogo.style.border = '1px solid var(--border-gray)';
        }
    }

});
