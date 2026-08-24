import { GeocodingService } from "./modules/geo";
import { identityApi, organizationApi, verificationRequestApi, verificationRequestDocumentApi, geographyApi } from "./api";

// Global helper for password toggle
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

document.addEventListener("DOMContentLoaded", () => {
  const MapController = {
    map: null,
    marker: null,
    selectedLat: null,
    selectedLng: null,
    selectedAddress: "",
    selectedMunicipalityId: null,
    DEFAULT_CENTER: [12.1328, -86.2504],

    elements: {
      modal: document.getElementById("modal-mapa"),
      btnOpen: document.getElementById("btn-mapa"),
      btnClose: document.getElementById("btn-close-mapa"),
      btnCancel: document.getElementById("btn-cancel-mapa"),
      btnConfirm: document.getElementById("btn-confirm-location"),
      btnCurrent: document.getElementById("btn-current-location"),
      addressText: document.getElementById("selected-address-text"),
      targetInput: document.getElementById("negocio-direccion"),
      targetLat: document.getElementById("negocio-lat"),
      targetLng: document.getElementById("negocio-lng"),
      targetMunId: document.getElementById("negocio-municipality-id"),
    },

    init() {
      if (!this.elements.btnOpen) return;
      this.bindEvents();
    },

    bindEvents() {
      this.elements.btnOpen.addEventListener("click", () => this.openModal());
      this.elements.btnClose.addEventListener("click", () => this.closeModal());
      this.elements.btnCancel.addEventListener("click", () => this.closeModal());
      this.elements.btnConfirm.addEventListener("click", () => this.confirmSelection());
      this.elements.btnCurrent.addEventListener("click", () => this.useCurrentLocation());
    },

    openModal() {
      this.elements.modal.style.display = "flex";
      this.elements.btnOpen.classList.add("used");

      setTimeout(() => {
        if (!this.map) this.initMap();
        else this.map.invalidateSize();
      }, 100);
    },

    closeModal() {
      this.elements.modal.style.display = "none";
    },

    initMap() {
      this.map = L.map("map-container").setView(this.DEFAULT_CENTER, 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(this.map);

      this.map.on("click", (e) => this.updateMarker(e.latlng.lat, e.latlng.lng));
    },

    async updateMarker(lat, lng) {
      this.selectedLat = lat;
      this.selectedLng = lng;

      if (this.marker) {
        this.marker.setLatLng([lat, lng]);
      } else {
        this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
        this.marker.on("dragend", (e) => {
          const pos = e.target.getLatLng();
          this.updateMarker(pos.lat, pos.lng);
        });
      }

      this.elements.addressText.textContent = "Obteniendo dirección y municipio...";
      this.elements.btnConfirm.disabled = true;

      try {
        this.selectedAddress = await GeocodingService.reverseGeocode(lat, lng);
        this.elements.addressText.textContent = this.selectedAddress;

        // Retrieve municipality metadata using backend API
        const geoRes = await geographyApi.getMunicipalityByCoordinates({ lat, lng });
        this.selectedMunicipalityId = geoRes.id;

        this.elements.btnConfirm.disabled = false;
      } catch (error) {
        console.error("Municipality lookup failed:", error);
        this.selectedMunicipalityId = null;
        this.elements.addressText.innerHTML = `${this.selectedAddress} <br><span style="color: #d9534f; font-size: 0.8rem; font-weight: 600;">(Coordenadas fuera de cobertura municipal. Intenta nuevamente.)</span>`;
        this.elements.btnConfirm.disabled = true;
      }
    },

    useCurrentLocation() {
      if (!navigator.geolocation) return alert("Geolocalización no soportada.");

      const originalHtml = this.elements.btnCurrent.innerHTML;
      this.elements.btnCurrent.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Obteniendo...';
      this.elements.btnCurrent.disabled = true;

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          this.map.setView([latitude, longitude], 16);
          await this.updateMarker(latitude, longitude);
          this.restoreCurrentBtn(originalHtml);
        },
        () => {
          alert("Permiso denegado o error de red.");
          this.restoreCurrentBtn(originalHtml);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    },

    restoreCurrentBtn(html) {
      this.elements.btnCurrent.innerHTML = html;
      this.elements.btnCurrent.disabled = false;
    },

    confirmSelection() {
      if (!this.selectedLat || !this.selectedMunicipalityId) return;
      this.elements.targetInput.value = this.selectedAddress;
      this.elements.targetLat.value = this.selectedLat;
      this.elements.targetLng.value = this.selectedLng;
      this.elements.targetMunId.value = this.selectedMunicipalityId;
      this.closeModal();
    },
  };

  MapController.init();

  // View Navigation
  const step1Content = document.getElementById("step1-content");
  const step2Content = document.getElementById("step2-content");
  const step3Content = document.getElementById("step3-content");
  const indStep1 = document.getElementById("indicator-step1");
  const indStep2 = document.getElementById("indicator-step2");
  const indStep3 = document.getElementById("indicator-step3");
  const line1 = document.getElementById("line-1");
  const line2 = document.getElementById("line-2");
  const step3Actions = document.getElementById("step3-actions");

  function showStep(step) {
    step1Content.style.display = "none";
    step2Content.style.display = "none";
    step3Content.style.display = "none";
    step3Actions.style.display = "none";

    if (step === 1) {
      step1Content.style.display = "block";
      indStep1.classList.add("active");
      indStep1.classList.remove("completed");
      line1.classList.remove("active");
      indStep2.classList.remove("active", "completed");
      line2.classList.remove("active");
      indStep3.classList.remove("active", "completed");
    } else if (step === 2) {
      step2Content.style.display = "block";
      indStep1.classList.add("completed");
      line1.classList.add("active");
      indStep2.classList.add("active");
      indStep2.classList.remove("completed");
      line2.classList.remove("active");
      indStep3.classList.remove("active", "completed");
    } else if (step === 3) {
      step3Content.style.display = "block";
      step3Actions.style.display = "flex";
      populateReview();
      indStep1.classList.add("completed");
      line1.classList.add("active");
      indStep2.classList.add("completed");
      line2.classList.add("active");
      indStep3.classList.add("active");
    }
  }

  document.getElementById("btn-next-to-2").addEventListener("click", () => showStep(2));
  document.getElementById("btn-back-to-1").addEventListener("click", () => showStep(1));
  document.getElementById("btn-next-to-3").addEventListener("click", () => showStep(3));
  document.getElementById("btn-back-to-2").addEventListener("click", () => showStep(2));
  document.getElementById("btn-cancelar").addEventListener("click", () => (window.location.href = "registro.html"));

  // Logo Upload
  let logoDataUrl = null;
  const fileLogo = document.getElementById("file-logo");
  const logoPreview = document.getElementById("logo-preview");
  const dragDropLogo = document.getElementById("drag-drop-logo");
  const logoPreviewContainer = document.getElementById("logo-preview-container");

  function handleLogoFiles(files) {
    if (files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) return alert("Solo se permiten imágenes.");

    const reader = new FileReader();
    reader.onload = (e) => {
      logoDataUrl = e.target.result;
      logoPreview.src = logoDataUrl;
      logoPreviewContainer.style.display = "flex";
      dragDropLogo.style.display = "none";
    };
    reader.readAsDataURL(file);
  }

  document.getElementById("btn-browse-logo").addEventListener("click", () => fileLogo.click());
  fileLogo.addEventListener("change", (e) => handleLogoFiles(e.target.files));

  dragDropLogo.addEventListener("dragover", (e) => {
    e.preventDefault();
    dragDropLogo.classList.add("dragover");
  });
  dragDropLogo.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dragDropLogo.classList.remove("dragover");
  });
  dragDropLogo.addEventListener("drop", (e) => {
    e.preventDefault();
    dragDropLogo.classList.remove("dragover");
    handleLogoFiles(e.dataTransfer.files);
  });

  document.getElementById("btn-remove-logo").addEventListener("click", () => {
    logoDataUrl = null;
    logoPreview.src = "";
    fileLogo.value = "";
    logoPreviewContainer.style.display = "none";
    dragDropLogo.style.display = "block";
  });

  // ID Upload (Documento de Identidad)
  const btnSubirCedula = document.getElementById("btn-subir-cedula");
  const fileCedula = document.getElementById("file-cedula");
  btnSubirCedula.addEventListener("click", () => fileCedula.click());
  fileCedula.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      document.getElementById("cedula-filename").textContent = e.target.files[0].name;
      btnSubirCedula.innerHTML = 'Documento seleccionado <i class="fa-solid fa-check"></i>';
      btnSubirCedula.style.color = "var(--light-teal)";
      btnSubirCedula.style.borderColor = "var(--light-teal)";
    }
  });

  function populateReview() {
    const nombres = document.getElementById("propietario-nombres").value.trim();
    const apellidos = document.getElementById("propietario-apellidos").value.trim();
    document.getElementById("res-propietario").textContent = `${nombres} ${apellidos}` || "-";
    document.getElementById("res-ruc").textContent = document.getElementById("negocio-ruc").value || "-";
    document.getElementById("res-negocio").textContent = document.getElementById("negocio-nombre").value || "-";
    document.getElementById("res-tipo").textContent = document.getElementById("negocio-tipo").value || "-";
    document.getElementById("res-tel-negocio").textContent = document.getElementById("negocio-telefono").value || "-";
    document.getElementById("res-direccion").textContent = document.getElementById("negocio-direccion").value || "-";

    document.getElementById("res-cedula").textContent = document.getElementById("propietario-cedula").value || "-";
    document.getElementById("res-correo").textContent = document.getElementById("propietario-correo").value || "-";
    document.getElementById("res-tel-prop").textContent = document.getElementById("propietario-telefono").value || "-";

    const reviewLogo = document.getElementById("review-logo");
    if (logoDataUrl) {
      reviewLogo.innerHTML = `<img src="${logoDataUrl}" alt="Logo del Negocio" style="width: 100%; height: 100%; object-fit: cover;">`;
      reviewLogo.style.border = "none";
    } else {
      reviewLogo.innerHTML = '<i class="fa-solid fa-image"></i>';
      reviewLogo.style.border = "1px solid var(--border-gray)";
    }
  }

  // Modals Setup
  const btnSubmit = document.getElementById("btn-submit");
  const modalConfirm = document.getElementById("modal-confirm");
  const modalSuccess = document.getElementById("modal-success");
  const modalPassword = document.getElementById("modal-password");

  document.getElementById("confirm-check").addEventListener("change", (e) => {
    btnSubmit.disabled = !e.target.checked;
  });

  btnSubmit.addEventListener("click", () => (modalConfirm.style.display = "flex"));

  const closeModalConfirm = () => (modalConfirm.style.display = "none");
  document.getElementById("btn-close-confirm").addEventListener("click", closeModalConfirm);
  document.getElementById("btn-cancel-modal").addEventListener("click", closeModalConfirm);

  // Verification Workflow Integration
  document.getElementById("btn-confirm-send").addEventListener("click", () => {
    modalConfirm.style.display = "none";
    document.getElementById("pass-email").value = document.getElementById("propietario-correo").value;
    modalPassword.style.display = "flex";
  });

  document.getElementById("btn-cancel-password").addEventListener("click", () => {
    modalPassword.style.display = "none";
  });

  document.getElementById("btn-confirm-password").addEventListener("click", async () => {
    const pass = document.getElementById("pass-input").value;
    const confirm = document.getElementById("pass-confirm").value;
    const municipalityId = document.getElementById("negocio-municipality-id").value;

    if (!pass || pass !== confirm) return alert("Las contraseñas no coinciden.");
    if (!municipalityId) return alert("Falta el identificador de municipio. Por favor, selecciona la ubicación en el mapa nuevamente.");

    const btn = document.getElementById("btn-confirm-password");
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';
    btn.disabled = true;

    try {
      const email = document.getElementById("propietario-correo").value.trim();
      const firstName = document.getElementById("propietario-nombres").value.trim() || "Proveedor";
      const lastName = document.getElementById("propietario-apellidos").value.trim() || "Registrado";
      const cedula = document.getElementById("propietario-cedula").value.trim();
      const phone = document.getElementById("propietario-telefono").value.trim();

      // Phase 1: Identity & Profile
      await identityApi.register({
        email,
        password: pass,
        first_name: firstName,
        last_name: lastName,
        national_id: cedula,
        phone_number: phone,
        municipality_id: municipalityId,
        interests: []
      });

      await identityApi.login({ email, password: pass });

      // Phase 2: Tenant creation
      const rawKind = document.getElementById("negocio-tipo").value;
      const kindMap = {
        "Industria Manufacturera": "manufacturer",
        "Comercio al por mayor": "wholesaler",
        "Agricultura y Ganadería": "manufacturer"
      };

      const org = await organizationApi.registerOrganization({
        company_name: document.getElementById("negocio-nombre").value.trim(),
        tax_id: document.getElementById("negocio-ruc").value.trim(),
        location: {
          latitude: parseFloat(document.getElementById("negocio-lat").value) || 0,
          longitude: parseFloat(document.getElementById("negocio-lng").value) || 0
        },
        company_description: null,
        phone_number: document.getElementById("negocio-telefono").value.trim(),
        municipality_id: municipalityId,
        address: document.getElementById("negocio-direccion").value.trim(),
        kind: kindMap[rawKind] || "manufacturer"
      });

      // Phase 3: State Machine Drafting & Upload
      const req = await verificationRequestApi.createVerificationRequest({
        organization_id: org.id
      });

      if (fileCedula.files.length > 0) {
        await verificationRequestDocumentApi.uploadVerificationDocument(
          req.id,
          fileCedula.files[0],
          "Documento de Identidad"
        );
      }

      // Phase 4: Submit Verification
      await verificationRequestApi.submitVerificationRequest(req.id, {
        request_id: req.id
      });

      modalPassword.style.display = "none";
      modalSuccess.style.display = "flex";

    } catch (error) {
      console.error("Workflow failed:", error);
      alert("Error: " + (error.message || "Ocurrió un problema durante el registro."));
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });

  document.getElementById("btn-continue-success").addEventListener("click", () => {
    window.location.href = "login.html";
  });
});
