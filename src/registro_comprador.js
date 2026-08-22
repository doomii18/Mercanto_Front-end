import { bootstrapGeo, getGeoManager } from "./modules/geo";
import { identityApi, userProfileApi, geographyApi } from "./api";

document.addEventListener("DOMContentLoaded", async () => {
  const btnSubmit = document.getElementById("btn-submit");
  const btnCancelar = document.getElementById("btn-cancelar");
  const confirmCheck = document.getElementById("confirm-check");

  const selectDepartamento = document.getElementById("comp-departamento");
  const selectMunicipio = document.getElementById("comp-municipio");
  const btnAutoLocation = document.getElementById("btn-auto-location");

  const dragDropFoto = document.getElementById("drag-drop-foto");
  const btnBrowseFoto = document.getElementById("btn-browse-foto");
  const fileFoto = document.getElementById("file-foto");
  const fotoPreviewContainer = document.getElementById("foto-preview-container");
  const fotoPreview = document.getElementById("foto-preview");
  const btnRemoveFoto = document.getElementById("btn-remove-foto");
  let fotoDataUrl = null;
  let geoManager = null;

  // --- Geo Logic ---
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
          alert("Error al obtener la ubicación. Verifique los permisos.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    });
  }

  // --- Photo Upload Logic ---
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

  btnBrowseFoto.addEventListener("click", () => fileFoto.click());
  fileFoto.addEventListener("change", (e) => handleFotoFiles(e.target.files));
  dragDropFoto.addEventListener("dragover", (e) => { e.preventDefault(); dragDropFoto.classList.add("dragover"); });
  dragDropFoto.addEventListener("dragleave", (e) => { e.preventDefault(); dragDropFoto.classList.remove("dragover"); });
  dragDropFoto.addEventListener("drop", (e) => {
    e.preventDefault();
    dragDropFoto.classList.remove("dragover");
    handleFotoFiles(e.dataTransfer.files);
  });
  btnRemoveFoto.addEventListener("click", () => {
    fotoDataUrl = null;
    fotoPreview.src = "";
    fileFoto.value = "";
    fotoPreviewContainer.style.display = "none";
    dragDropFoto.style.display = "block";
  });

  // --- Actions ---
  btnCancelar.addEventListener("click", () => window.location.href = "registro.html");

  confirmCheck.addEventListener("change", (e) => btnSubmit.disabled = !e.target.checked);

  btnSubmit.addEventListener("click", async () => {
    const pwd = document.getElementById("comp-password").value;
    const pwdConfirm = document.getElementById("comp-password-confirm").value;

    if (!pwd) return alert("La contraseña no puede estar vacía.");
    if (pwd !== pwdConfirm) return alert("Las contraseñas no coinciden. Por favor, verifíquelas.");

    const email = document.getElementById("comp-correo").value.trim();
    const payload = {
      first_name: document.getElementById("comp-nombres").value.trim(),
      last_name: document.getElementById("comp-apellidos").value.trim(),
      national_id: document.getElementById("comp-cedula").value.trim() || null,
      phone_number: document.getElementById("comp-telefono").value.trim() || null,
      municipality_id: document.getElementById("comp-municipio").value,
      email: email,
      password: pwd,
      interests: [],
    };

    try {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registrando...';

      await identityApi.register(payload);

      const fileInput = document.getElementById("file-foto");
      if (fileInput.files.length > 0) {
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo foto...';
        await identityApi.login({ email, password: pwd });
        await userProfileApi.changeProfilePicture(fileInput.files[0]);
      }

      window.location.href = "login.html";
    } catch (error) {
      console.error("Registration pipeline failed:", error);
      alert("Error en el registro: " + (error.message || "Verifique los datos."));
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Completar Registro";
    }
  });
});
