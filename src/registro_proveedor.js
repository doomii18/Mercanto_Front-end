import { GeocodingService } from "./modules/geo/index.js";

document.addEventListener("DOMContentLoaded", () => {
  const MapController = {
    map: null,
    marker: null,
    selectedLat: null,
    selectedLng: null,
    selectedAddress: "",
    DEFAULT_CENTER: [12.1328, -86.2504], // Managua Default

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
    },

    init() {
      if (!this.elements.btnOpen) return;
      this.bindEvents();
    },

    bindEvents() {
      this.elements.btnOpen.addEventListener("click", () => this.openModal());
      this.elements.btnClose.addEventListener("click", () => this.closeModal());
      this.elements.btnCancel.addEventListener("click", () =>
        this.closeModal(),
      );
      this.elements.btnConfirm.addEventListener("click", () =>
        this.confirmSelection(),
      );
      this.elements.btnCurrent.addEventListener("click", () =>
        this.useCurrentLocation(),
      );
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

      this.map.on("click", (e) =>
        this.updateMarker(e.latlng.lat, e.latlng.lng),
      );
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

      this.elements.addressText.textContent = "Obteniendo dirección...";
      this.elements.btnConfirm.disabled = true;

      this.selectedAddress = await GeocodingService.reverseGeocode(lat, lng);
      this.elements.addressText.textContent = this.selectedAddress;
      this.elements.btnConfirm.disabled = false;
    },

    useCurrentLocation() {
      if (!navigator.geolocation) return alert("Geolocalización no soportada.");

      const originalHtml = this.elements.btnCurrent.innerHTML;
      this.elements.btnCurrent.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Obteniendo...';
      this.elements.btnCurrent.disabled = true;

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          this.map.setView([latitude, longitude], 16);
          await this.updateMarker(latitude, longitude);
          this.restoreCurrentBtn(originalHtml);
        },
        (err) => {
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
      if (!this.selectedLat) return;
      this.elements.targetInput.value = this.selectedAddress;
      this.elements.targetLat.value = this.selectedLat;
      this.elements.targetLng.value = this.selectedLng;
      this.closeModal();
    },
  };

  MapController.init();

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

  document
    .getElementById("btn-next-to-2")
    .addEventListener("click", () => showStep(2));
  document
    .getElementById("btn-back-to-1")
    .addEventListener("click", () => showStep(1));
  document
    .getElementById("btn-next-to-3")
    .addEventListener("click", () => showStep(3));
  document
    .getElementById("btn-back-to-2")
    .addEventListener("click", () => showStep(2));
  document
    .getElementById("btn-cancelar")
    .addEventListener("click", () => (window.location.href = "registro.html"));

  let logoDataUrl = null;
  const fileLogo = document.getElementById("file-logo");
  const logoPreview = document.getElementById("logo-preview");
  const dragDropLogo = document.getElementById("drag-drop-logo");
  const logoPreviewContainer = document.getElementById(
    "logo-preview-container",
  );

  function handleLogoFiles(files) {
    if (files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/"))
      return alert("Solo se permiten imágenes.");

    const reader = new FileReader();
    reader.onload = (e) => {
      logoDataUrl = e.target.result;
      logoPreview.src = logoDataUrl;
      logoPreviewContainer.style.display = "flex";
      dragDropLogo.style.display = "none";
    };
    reader.readAsDataURL(file);
  }

  document
    .getElementById("btn-browse-logo")
    .addEventListener("click", () => fileLogo.click());
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

  const btnSubirCedula = document.getElementById("btn-subir-cedula");
  const fileCedula = document.getElementById("file-cedula");
  btnSubirCedula.addEventListener("click", () => fileCedula.click());
  fileCedula.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      document.getElementById("cedula-filename").textContent =
        e.target.files[0].name;
      btnSubirCedula.innerHTML =
        'Documento seleccionado <i class="fa-solid fa-check"></i>';
      btnSubirCedula.style.color = "var(--light-teal)";
      btnSubirCedula.style.borderColor = "var(--light-teal)";
    }
  });

  function populateReview() {
    document.getElementById("res-ruc").textContent =
      document.getElementById("negocio-ruc").value || "-";
    document.getElementById("res-negocio").textContent =
      document.getElementById("negocio-nombre").value || "-";
    document.getElementById("res-tipo").textContent =
      document.getElementById("negocio-tipo").value || "-";
    document.getElementById("res-tel-negocio").textContent =
      document.getElementById("negocio-telefono").value || "-";
    document.getElementById("res-direccion").textContent =
      document.getElementById("negocio-direccion").value || "-";

    document.getElementById("res-cedula").textContent =
      document.getElementById("propietario-cedula").value || "-";
    document.getElementById("res-propietario").textContent =
      document.getElementById("propietario-nombre").value || "-";
    document.getElementById("res-correo").textContent =
      document.getElementById("propietario-correo").value || "-";
    document.getElementById("res-tel-prop").textContent =
      document.getElementById("propietario-telefono").value || "-";

    const reviewLogo = document.getElementById("review-logo");
    if (logoDataUrl) {
      reviewLogo.innerHTML = `<img src="${logoDataUrl}" alt="Logo del Negocio">`;
      reviewLogo.style.border = "none";
    } else {
      reviewLogo.innerHTML = '<i class="fa-solid fa-image"></i>';
      reviewLogo.style.border = "1px solid var(--border-gray)";
    }
  }

  const btnSubmit = document.getElementById("btn-submit");
  const modalConfirm = document.getElementById("modal-confirm");
  const modalSuccess = document.getElementById("modal-success");

  document.getElementById("confirm-check").addEventListener("change", (e) => {
    btnSubmit.disabled = !e.target.checked;
  });

  btnSubmit.addEventListener(
    "click",
    () => (modalConfirm.style.display = "flex"),
  );

  const closeModalConfirm = () => (modalConfirm.style.display = "none");
  document
    .getElementById("btn-close-confirm")
    .addEventListener("click", closeModalConfirm);
  document
    .getElementById("btn-cancel-modal")
    .addEventListener("click", closeModalConfirm);

  document.getElementById("btn-confirm-send").addEventListener("click", () => {
    modalConfirm.style.display = "none";
    modalSuccess.style.display = "flex";
  });

  document
    .getElementById("btn-continue-success")
    .addEventListener("click", () => {
      window.location.href = "registro_password.html";
    });
});
