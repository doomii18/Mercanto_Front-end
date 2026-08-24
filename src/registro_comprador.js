import { bootstrapGeo, getGeoManager } from "./modules/geo";
import { identityApi, userProfileApi, geographyApi } from "./api";

function togglePass(inputId, icon) {
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
}
window.togglePass = togglePass;

document.addEventListener("DOMContentLoaded", async () => {
  const btnNextTo2 = document.getElementById("btn-next-to-2");
  const btnBackTo1 = document.getElementById("btn-back-to-1");
  const btnSubmit = document.getElementById("btn-submit");
  const btnCancelar = document.getElementById("btn-cancelar");
  const confirmCheck = document.getElementById("confirm-check");

  const step1Content = document.getElementById("step1-content");
  const step2Content = document.getElementById("step2-content");
  const indStep1 = document.getElementById("indicator-step1");
  const indStep2 = document.getElementById("indicator-step2");
  const line1 = document.getElementById("line-1");
  const step2Email = document.getElementById("step2-email");

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

  // --- Step Navigation ---
  function showStep(step) {
    if (step === 1) {
      step1Content.style.display = "block";
      step2Content.style.display = "none";
      indStep1.classList.add("active");
      indStep1.classList.remove("completed");
      line1.classList.remove("active");
      indStep2.classList.remove("active", "completed");
    } else if (step === 2) {
      step1Content.style.display = "none";
      step2Content.style.display = "block";
      indStep1.classList.add("completed");
      indStep1.classList.remove("active");
      line1.classList.add("active");
      indStep2.classList.add("active");
      indStep2.classList.remove("completed");
      step2Email.value = document.getElementById("comp-correo").value.trim();
    }
  }

  function validateStep1() {
    const nombres = document.getElementById("comp-nombres").value.trim();
    const apellidos = document.getElementById("comp-apellidos").value.trim();
    const cedula = document.getElementById("comp-cedula").value.trim();
    const telefono = document.getElementById("comp-telefono").value.trim();
    const correo = document.getElementById("comp-correo").value.trim();
    const departamento = selectDepartamento.value;
    const municipio = selectMunicipio.value;

    if (!nombres) { alert("Por favor ingresa tus nombres."); return false; }
    if (!apellidos) { alert("Por favor ingresa tus apellidos."); return false; }
    if (!cedula) { alert("Por favor ingresa tu cédula de identidad."); return false; }
    if (!telefono) { alert("Por favor ingresa tu teléfono."); return false; }
    if (!departamento) { alert("Por favor selecciona un departamento."); return false; }
    if (!municipio) { alert("Por favor selecciona un municipio."); return false; }
    if (!correo) { alert("Por favor ingresa tu correo electrónico."); return false; }
    return true;
  }

  btnNextTo2.addEventListener("click", () => {
    if (validateStep1()) showStep(2);
  });

  btnBackTo1.addEventListener("click", () => showStep(1));

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
    const pwd = document.getElementById("step2-pass").value;
    const pwdConfirm = document.getElementById("step2-pass-confirm").value;

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
