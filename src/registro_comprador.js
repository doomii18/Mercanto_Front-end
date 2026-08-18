document.addEventListener('DOMContentLoaded', () => {

    // Buttons
    const btnCancelar = document.getElementById('btn-cancelar');
    const btnSubmit = document.getElementById('btn-submit');

    // Drag & drop photo
    const dragDropFoto = document.getElementById('drag-drop-foto');
    const btnBrowseFoto = document.getElementById('btn-browse-foto');
    const fileFoto = document.getElementById('file-foto');
    const fotoPreviewContainer = document.getElementById('foto-preview-container');
    const fotoPreview = document.getElementById('foto-preview');
    const btnRemoveFoto = document.getElementById('btn-remove-foto');
    let fotoDataUrl = null;

    btnCancelar.addEventListener('click', () => {
        window.location.href = 'registro.html';
    });

    btnSubmit.addEventListener('click', () => {
        // Validation logic can go here. For now, redirect.
        alert('Cuenta de comprador creada exitosamente. Redirigiendo al inicio...');
        window.location.href = 'login.html';
    });

    // --- Photo Upload Logic (Drag & Drop) ---

    function handleFotoFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            if (!file.type.startsWith('image/')) {
                alert('Solo se permiten imágenes.');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                fotoDataUrl = e.target.result;
                fotoPreview.src = fotoDataUrl;
                fotoPreviewContainer.style.display = 'flex';
                dragDropFoto.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    }

    btnBrowseFoto.addEventListener('click', () => fileFoto.click());
    
    fileFoto.addEventListener('change', (e) => {
        handleFotoFiles(e.target.files);
    });

    dragDropFoto.addEventListener('dragover', (e) => {
        e.preventDefault();
        dragDropFoto.classList.add('dragover');
    });

    dragDropFoto.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragDropFoto.classList.remove('dragover');
    });

    dragDropFoto.addEventListener('drop', (e) => {
        e.preventDefault();
        dragDropFoto.classList.remove('dragover');
        handleFotoFiles(e.dataTransfer.files);
    });

    btnRemoveFoto.addEventListener('click', () => {
        fotoDataUrl = null;
        fotoPreview.src = '';
        fileFoto.value = '';
        fotoPreviewContainer.style.display = 'none';
        dragDropFoto.style.display = 'block';
    });

});
