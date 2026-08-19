import { bootstrapGeo, getGeoManager } from "./modules/geo";
import { categoryApi } from "./api";

document.addEventListener('DOMContentLoaded', async () => {

    // --- DOM Elements ---

    // Steps containers
    const step1Content = document.getElementById('step1-content');
    const step2Content = document.getElementById('step2-content');
    const step3Content = document.getElementById('step3-content');
    const step4Content = document.getElementById('step4-content');

    // Stepper indicators
    const indStep1 = document.getElementById('indicator-step1');
    const indStep2 = document.getElementById('indicator-step2');
    const indStep3 = document.getElementById('indicator-step3');
    const indStep4 = document.getElementById('indicator-step4');

    const line1 = document.getElementById('line-1');
    const line2 = document.getElementById('line-2');
    const line3 = document.getElementById('line-3');

    // Buttons
    const btnNextTo2 = document.getElementById('btn-next-to-2');
    const btnBackTo1 = document.getElementById('btn-back-to-1');
    const btnNextTo3 = document.getElementById('btn-next-to-3');
    const btnBackTo2 = document.getElementById('btn-back-to-2');
    const btnNextTo4 = document.getElementById('btn-next-to-4');
    const btnBackTo3 = document.getElementById('btn-back-to-3');
    const btnSubmit = document.getElementById('btn-submit');
    const btnCancelar = document.getElementById('btn-cancelar');

    // Checkbox
    const confirmCheck = document.getElementById('confirm-check');

    // General Form Fields
    const selectDepartamento = document.getElementById('comp-departamento');
    const selectMunicipio = document.getElementById('comp-municipio');

    // Photo Upload
    const dragDropFoto = document.getElementById('drag-drop-foto');
    const btnBrowseFoto = document.getElementById('btn-browse-foto');
    const fileFoto = document.getElementById('file-foto');
    const fotoPreviewContainer = document.getElementById('foto-preview-container');
    const fotoPreview = document.getElementById('foto-preview');
    const btnRemoveFoto = document.getElementById('btn-remove-foto');
    let fotoDataUrl = null;

    // Categories
    const categoriesGrid = document.getElementById('categories-grid');
    const selectedInterests = new Set();
    const categoriesMap = new Map();

    // --- Bootstrapping Geo ---
    try {
        await bootstrapGeo();
        const geoManager = getGeoManager();

        if (geoManager && selectDepartamento && selectMunicipio) {
            selectDepartamento.innerHTML = '<option value="" disabled selected>Seleccione...</option>';
            selectDepartamento.disabled = false;

            const departments = geoManager.getDepartments();
            departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.id;
                option.textContent = dept.name;
                selectDepartamento.appendChild(option);
            });

            selectDepartamento.addEventListener('change', (e) => {
                const deptId = e.target.value;
                const municipalities = geoManager.getMunicipalitiesByDepartment(deptId);

                selectMunicipio.innerHTML = '<option value="" disabled selected>Seleccione...</option>';
                selectMunicipio.disabled = false;

                municipalities.forEach(mun => {
                    const option = document.createElement('option');
                    option.value = mun.id;
                    option.textContent = mun.name;
                    selectMunicipio.appendChild(option);
                });
            });
        }
    } catch (error) {
        console.error("Error loading geography data:", error);
        if (selectDepartamento) selectDepartamento.innerHTML = '<option value="" disabled>Error de conexión</option>';
        if (selectMunicipio) selectMunicipio.innerHTML = '<option value="" disabled>Error de conexión</option>';
    }

    // --- Loading Categories ---
    async function loadCategories() {
        try {
            const response = await categoryApi.getCategories({ limit: 50 });
            categoriesGrid.innerHTML = '';

            if (response.data.length === 0) {
                categoriesGrid.innerHTML = '<p>No hay categorías disponibles.</p>';
                return;
            }

            response.data.forEach(async (cat) => {
                categoriesMap.set(cat.id, cat.name);

                const card = document.createElement('div');
                card.className = 'category-selectable-card';
                card.dataset.id = cat.id;

                let imgHtml = '<div class="category-placeholder"><i class="fa-solid fa-tags"></i></div>';
                if (cat.image_blob_id) {
                    try {
                        const imgUrl = await categoryApi.getCategoryImageBlobUrl(cat.image_blob_id);
                        imgHtml = `<img src="${imgUrl}" alt="${cat.name}">`;
                    } catch (e) {
                        console.warn("Failed to load category image", e);
                    }
                }

                card.innerHTML = `
                    ${imgHtml}
                    <p>${cat.name}</p>
                `;

                card.addEventListener('click', () => {
                    card.classList.toggle('selected');
                    if (selectedInterests.has(cat.id)) {
                        selectedInterests.delete(cat.id);
                    } else {
                        selectedInterests.add(cat.id);
                    }
                });

                categoriesGrid.appendChild(card);
            });
        } catch (error) {
            console.error("Error fetching categories:", error);
            categoriesGrid.innerHTML = '<p>Error al cargar las categorías.</p>';
        }
    }

    loadCategories();

    // --- Navigation Logic ---
    function updateStepperUI(activeStep) {
        [indStep1, indStep2, indStep3, indStep4].forEach((ind, i) => {
            if (i + 1 < activeStep) {
                ind.classList.add('completed');
                ind.classList.remove('active');
            } else if (i + 1 === activeStep) {
                ind.classList.add('active');
                ind.classList.remove('completed');
            } else {
                ind.classList.remove('active', 'completed');
            }
        });

        line1.classList.toggle('active', activeStep > 1);
        line2.classList.toggle('active', activeStep > 2);
        line3.classList.toggle('active', activeStep > 3);
    }

    function showStep(step) {
        step1Content.style.display = 'none';
        step2Content.style.display = 'none';
        step3Content.style.display = 'none';
        step4Content.style.display = 'none';

        if (step === 1) {
            step1Content.style.display = 'block';
        } else if (step === 2) {
            step2Content.style.display = 'block';
        } else if (step === 3) {
            step3Content.style.display = 'block';
        } else if (step === 4) {
            step4Content.style.display = 'flex';
            populateReview();
        }

        updateStepperUI(step);
    }

    btnNextTo2.addEventListener('click', () => showStep(2));
    btnBackTo1.addEventListener('click', () => showStep(1));
    btnNextTo3.addEventListener('click', () => showStep(3));
    btnBackTo2.addEventListener('click', () => showStep(2));
    btnNextTo4.addEventListener('click', () => showStep(4));
    btnBackTo3.addEventListener('click', () => showStep(3));

    btnCancelar.addEventListener('click', () => {
        window.location.href = 'registro.html';
    });

    confirmCheck.addEventListener('change', (e) => {
        btnSubmit.disabled = !e.target.checked;
    });

    btnSubmit.addEventListener('click', () => {
        const interestsArr = Array.from(selectedInterests);
        console.log("Selected Interests to submit:", interestsArr);
        alert('Cuenta de comprador creada exitosamente. Redirigiendo al inicio...');
        window.location.href = 'login.html';
    });

    // --- Photo Upload Logic ---
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

    // --- Populate Review Step ---
    function populateReview() {
        const nombres = document.getElementById('comp-nombres').value;
        const apellidos = document.getElementById('comp-apellidos').value;

        document.getElementById('res-nombres').textContent = `${nombres} ${apellidos}`.trim() || '-';
        document.getElementById('res-cedula').textContent = document.getElementById('comp-cedula').value || '-';
        document.getElementById('res-correo').textContent = document.getElementById('comp-correo').value || '-';
        document.getElementById('res-telefono').textContent = document.getElementById('comp-telefono').value || '-';

        const resIntereses = document.getElementById('res-intereses');
        if (selectedInterests.size > 0) {
            const names = Array.from(selectedInterests).map(id => categoriesMap.get(id));
            resIntereses.textContent = names.join(', ');
        } else {
            resIntereses.textContent = 'Ninguna categoría seleccionada';
        }

        const reviewFoto = document.getElementById('review-foto');
        if (fotoDataUrl) {
            reviewFoto.innerHTML = `<img src="${fotoDataUrl}" alt="Foto de perfil">`;
            reviewFoto.style.border = 'none';
        } else {
            reviewFoto.innerHTML = '<i class="fa-solid fa-user"></i>';
            reviewFoto.style.border = '1px solid var(--border-gray)';
        }
    }
});
