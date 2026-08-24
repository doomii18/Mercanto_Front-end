import { bootstrapGeo, getGeoManager } from "./modules/geo";
import { categoryApi, identityApi, userProfileApi, geographyApi } from "./api";

window.togglePass = function(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = "password";
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
};

document.addEventListener("DOMContentLoaded", async () => {
    const selectedInterests = new Set();
    let isCategoriesLoaded = false;
    let fotoDataUrl = null;
    let geoManager = null;

    const step1 = document.getElementById("step1-content");
    const step2 = document.getElementById("step2-content");
    const step3 = document.getElementById("step3-content");
    const step4 = document.getElementById("step4-content");

    const selectDepartamento = document.getElementById("comp-departamento");
    const selectMunicipio = document.getElementById("comp-municipio");
    const btnAutoLocation = document.getElementById("btn-auto-location");

    const dragDropFoto = document.getElementById("drag-drop-foto");
    const btnBrowseFoto = document.getElementById("btn-browse-foto");
    const fileFoto = document.getElementById("file-foto");
    const fotoPreviewContainer = document.getElementById("foto-preview-container");
    const fotoPreview = document.getElementById("foto-preview");
    const btnRemoveFoto = document.getElementById("btn-remove-foto");

    const modalConfirm = document.getElementById("modal-confirm");
    const modalSuccess = document.getElementById("modal-success");

    function populateMunicipalitiesForDept(deptId, selectedMunId = null) {
        if (!geoManager || !selectMunicipio) return;
        const municipalities = geoManager.getMunicipalitiesByDepartment(deptId);
        selectMunicipio.innerHTML = '<option value="" disabled selected>Seleccione...</option>';
        selectMunicipio.disabled = false;

        municipalities.forEach((mun) => {
            const option = document.createElement("option");
            option.value = mun.id;
            option.textContent = mun.name;
            if (selectedMunId && mun.id === selectedMunId) option.selected = true;
            selectMunicipio.appendChild(option);
        });
    }

    try {
        await bootstrapGeo();
        geoManager = getGeoManager();
        if (geoManager && selectDepartamento && selectMunicipio) {
            selectDepartamento.innerHTML = '<option value="" disabled selected>Seleccione...</option>';
            selectDepartamento.disabled = false;

            const departments = geoManager.getDepartments();
            departments.forEach((dept) => {
                const option = document.createElement("option");
                option.value = dept.id;
                option.textContent = dept.name;
                selectDepartamento.appendChild(option);
            });

            selectDepartamento.addEventListener("change", (e) => {
                populateMunicipalitiesForDept(e.target.value);
            });
        }
    } catch (error) {
        console.error("Error loading geography data:", error);
        if (selectDepartamento) selectDepartamento.innerHTML = '<option value="" disabled>Error de conexión</option>';
        if (selectMunicipio) selectMunicipio.innerHTML = '<option value="" disabled>Error de conexión</option>';
    }

    if (btnAutoLocation) {
        btnAutoLocation.addEventListener("click", () => {
            if (!navigator.geolocation) return alert("La geolocalización no está soportada por su navegador.");

            const originalText = btnAutoLocation.innerHTML;
            btnAutoLocation.disabled = true;
            btnAutoLocation.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Detectando...';

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        const res = await geographyApi.getMunicipalityByCoordinates({ lat: latitude, lng: longitude });
                        selectDepartamento.value = res.department_id;
                        populateMunicipalitiesForDept(res.department_id, res.id);
                    } catch (err) {
                        console.error("Reverse geocoding failed:", err);
                        alert("No se pudo determinar el municipio para tu ubicación actual.");
                    } finally {
                        btnAutoLocation.disabled = false;
                        btnAutoLocation.innerHTML = originalText;
                    }
                },
                () => {
                    btnAutoLocation.disabled = false;
                    btnAutoLocation.innerHTML = originalText;
                    alert("Error al obtener la ubicación. Verifique los permisos de su navegador.");
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        });
    }

    function handleFotoFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            if (!file.type.startsWith("image/")) return alert("Solo se permiten imágenes.");
            const reader = new FileReader();
            reader.onload = (e) => {
                fotoDataUrl = e.target.result;
                fotoPreview.src = fotoDataUrl;
                fotoPreviewContainer.style.display = "flex";
                dragDropFoto.style.display = "none";
            };
            reader.readAsDataURL(file);
        }
    }

    btnBrowseFoto?.addEventListener("click", () => fileFoto.click());
    fileFoto?.addEventListener("change", (e) => handleFotoFiles(e.target.files));

    dragDropFoto?.addEventListener("dragover", (e) => {
        e.preventDefault();
        dragDropFoto.classList.add("dragover");
    });
    dragDropFoto?.addEventListener("dragleave", (e) => {
        e.preventDefault();
        dragDropFoto.classList.remove("dragover");
    });
    dragDropFoto?.addEventListener("drop", (e) => {
        e.preventDefault();
        dragDropFoto.classList.remove("dragover");
        handleFotoFiles(e.dataTransfer.files);
    });

    btnRemoveFoto?.addEventListener("click", () => {
        fotoDataUrl = null;
        fotoPreview.src = "";
        fileFoto.value = "";
        fotoPreviewContainer.style.display = "none";
        dragDropFoto.style.display = "block";
    });

    function showStep(stepNumber) {
        step1.style.display = stepNumber === 1 ? "block" : "none";
        step2.style.display = stepNumber === 2 ? "block" : "none";
        step3.style.display = stepNumber === 3 ? "block" : "none";
        step4.style.display = stepNumber === 4 ? "block" : "none";

        const updateIndicator = (id, num) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.className = stepNumber >= num ? (stepNumber === num ? "step active" : "step completed") : "step";
        };

        updateIndicator("indicator-step1", 1);
        updateIndicator("indicator-step2", 2);
        updateIndicator("indicator-step3", 3);
        updateIndicator("indicator-step4", 4);

        const updateLine = (id, num) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.className = stepNumber >= num ? "step-line active" : "step-line";
        };

        updateLine("line-1", 2);
        updateLine("line-2", 3);
        updateLine("line-3", 4);

        if (stepNumber === 2 && !isCategoriesLoaded) loadCategories();
        if (stepNumber === 3) populateReview();
        if (stepNumber === 4) {
            document.getElementById("step4-email").value = document.getElementById("comp-correo").value.trim();
        }
    }

    function validateStep1() {
        const requiredFields = [
            { id: "comp-nombres", msg: "Por favor ingresa tus nombres." },
            { id: "comp-apellidos", msg: "Por favor ingresa tus apellidos." },
            { id: "comp-cedula", msg: "Por favor ingresa tu cédula de identidad." },
            { id: "comp-telefono", msg: "Por favor ingresa tu teléfono." },
            { id: "comp-departamento", msg: "Por favor selecciona un departamento." },
            { id: "comp-municipio", msg: "Por favor selecciona un municipio." },
            { id: "comp-correo", msg: "Por favor ingresa tu correo electrónico." }
        ];

        for (const field of requiredFields) {
            const el = document.getElementById(field.id);
            if (!el || !el.value.trim()) {
                alert(field.msg);
                return false;
            }
        }
        return true;
    }

    document.getElementById("btn-next-to-2")?.addEventListener("click", () => {
        if (validateStep1()) showStep(2);
    });
    document.getElementById("btn-back-to-1")?.addEventListener("click", () => showStep(1));
    document.getElementById("btn-next-to-3")?.addEventListener("click", () => showStep(3));
    document.getElementById("btn-back-to-2")?.addEventListener("click", () => showStep(2));
    document.getElementById("btn-next-to-4")?.addEventListener("click", () => showStep(4));
    document.getElementById("btn-back-to-3")?.addEventListener("click", () => showStep(3));

    document.getElementById("btn-cancelar")?.addEventListener("click", () => {
        window.location.href = "registro.html";
    });

    async function loadCategories() {
        try {
            const res = await categoryApi.getCategories({ limit: 50 });
            const grid = document.getElementById("categories-grid");
            const frag = document.createDocumentFragment();

            const cardsData = await Promise.allSettled(res.data.map(async (cat) => {
                let imgUrl = "./src/assets/logo.png";
                if (cat.image_blob_id) {
                    try { imgUrl = await categoryApi.getCategoryImageBlobUrl(cat.image_blob_id); }
                    catch (e) { console.warn(`Failed to fetch blob for ${cat.name}`); }
                }
                return { cat, imgUrl };
            }));

            cardsData.forEach((result) => {
                if (result.status !== "fulfilled") return;
                const { cat, imgUrl } = result.value;

                const card = document.createElement("div");
                card.className = "category-selectable-card";
                card.innerHTML = `<img src="${imgUrl}" alt="${cat.name}"><p>${cat.name}</p>`;

                card.addEventListener("click", () => {
                    if (selectedInterests.has(cat.id)) {
                        selectedInterests.delete(cat.id);
                        card.classList.remove("selected");
                    } else {
                        selectedInterests.add(cat.id);
                        card.classList.add("selected");
                    }
                });
                frag.appendChild(card);
            });

            grid.appendChild(frag);
            isCategoriesLoaded = true;
        } catch (err) {
            console.error("Categories fetch failed:", err);
            alert("No se pudieron cargar las categorías.");
        }
    }

    function populateReview() {
        document.getElementById("rev-nombre").textContent = document.getElementById("comp-nombres").value || "-";
        document.getElementById("rev-apellidos").textContent = document.getElementById("comp-apellidos").value || "-";
        document.getElementById("rev-cedula").textContent = document.getElementById("comp-cedula").value || "-";
        document.getElementById("rev-correo").textContent = document.getElementById("comp-correo").value || "-";

        const photoTarget = document.getElementById("review-photo-preview");
        if (fotoDataUrl) {
            photoTarget.innerHTML = `<img src="${fotoDataUrl}" style="width:100%; height:100%; object-fit:cover;">`;
            photoTarget.style.border = "none";
        } else {
            photoTarget.innerHTML = '<i class="fa-solid fa-user"></i>';
            photoTarget.style.border = "1px solid var(--border-gray)";
        }
    }

    document.getElementById("confirm-check")?.addEventListener("change", (e) => {
        document.getElementById("btn-next-to-4").disabled = !e.target.checked;
    });

    document.getElementById("btn-submit")?.addEventListener("click", () => {
        const pwd = document.getElementById("step4-pass").value;
        const pwdConfirm = document.getElementById("step4-pass-confirm").value;

        if (!pwd) return alert("La contraseña no puede estar vacía.");
        if (pwd !== pwdConfirm) return alert("Las contraseñas no coinciden. Por favor, verifíquelas.");

        modalConfirm.style.display = "flex";
    });

    const closeConfirm = () => modalConfirm.style.display = "none";
    document.getElementById("btn-close-confirm")?.addEventListener("click", closeConfirm);
    document.getElementById("btn-cancel-modal")?.addEventListener("click", closeConfirm);

    document.getElementById("btn-confirm-send")?.addEventListener("click", async () => {
        const email = document.getElementById("comp-correo").value.trim();
        const pwd = document.getElementById("step4-pass").value;

        const payload = {
            first_name: document.getElementById("comp-nombres").value.trim(),
            last_name: document.getElementById("comp-apellidos").value.trim(),
            national_id: document.getElementById("comp-cedula").value.trim() || null,
            phone_number: document.getElementById("comp-telefono").value.trim() || null,
            municipality_id: document.getElementById("comp-municipio").value,
            email: email,
            password: pwd,
            interests: Array.from(selectedInterests)
        };

        try {
            document.getElementById("btn-confirm-send").innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';
            document.getElementById("btn-confirm-send").disabled = true;

            await identityApi.register(payload);

            const fileInput = document.getElementById("file-foto");
            if (fileInput.files.length > 0) {
                await identityApi.login({ email, password: pwd });
                await userProfileApi.changeProfilePicture(fileInput.files[0]);
            }

            modalConfirm.style.display = "none";
            modalSuccess.style.display = "flex";
        } catch (error) {
            console.error("Pipeline failure:", error);
            alert("Error en el registro: " + (error.message || "Revise los datos e intente de nuevo."));
        } finally {
            document.getElementById("btn-confirm-send").textContent = "Enviar Información";
            document.getElementById("btn-confirm-send").disabled = false;
        }
    });

    document.getElementById("btn-continue-success")?.addEventListener("click", () => {
        window.location.href = "login.html";
    });
});
