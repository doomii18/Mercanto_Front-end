import { defineStore } from "pinia";
import { ref } from "vue";
import {
  identityApi,
  organizationApi,
  verificationRequestApi,
  verificationRequestDocumentApi,
} from "@/api";
import type { ProviderKind } from "@/api/services/organization/types";
import { useAccountRegisterStore } from "./accountRegisterStore";

export const useProviderRegisterStore = defineStore("providerRegister", () => {
  const accountStore = useAccountRegisterStore();

  const companyName = ref("");
  const taxId = ref("");
  const kind = ref<ProviderKind>("wholesaler");
  const companyPhone = ref("");
  const companyDescription = ref("");
  const address = ref("");
  const latitude = ref<number | null>(null);
  const longitude = ref<number | null>(null);

  const logoFile = ref<File | null>(null);
  const logoPreviewUrl = ref<string | null>(null);
  const verificationDocumentFile = ref<File | null>(null);

  const termsAccepted = ref(false);
  const isLoading = ref(false);
  const errorMessage = ref<string | null>(null);

  function setLogo(file: File) {
    if (!file.type.startsWith("image/")) {
      throw new Error("Solo se permiten archivos de imagen para el logo.");
    }
    if (logoPreviewUrl.value) URL.revokeObjectURL(logoPreviewUrl.value);
    logoFile.value = file;
    logoPreviewUrl.value = URL.createObjectURL(file);
  }

  function clearLogo() {
    if (logoPreviewUrl.value) URL.revokeObjectURL(logoPreviewUrl.value);
    logoFile.value = null;
    logoPreviewUrl.value = null;
  }

  function setVerificationDocument(file: File) {
    verificationDocumentFile.value = file;
  }

  function clearVerificationDocument() {
    verificationDocumentFile.value = null;
  }

  function setLocation(coords: { lat: number; lng: number; address?: string }) {
    latitude.value = coords.lat;
    longitude.value = coords.lng;
    if (coords.address) {
      address.value = coords.address;
    }
  }

  async function submitProviderRegistration(password: string) {
    if (latitude.value === null || longitude.value === null) {
      throw new Error("Debe seleccionar una ubicación válida en el mapa.");
    }

    if (!accountStore.municipalityId) {
      throw new Error("Debe seleccionar un municipio válido.");
    }

    isLoading.value = true;
    errorMessage.value = null;

    try {
      // Create base Account & User Profile
      await accountStore.submitRegistration(password);

      //  Explicit login to acquire and persist active tokens
      await identityApi.login({
        email: accountStore.email.trim(),
        password,
      });

      // Create Organization
      const org = await organizationApi.createOrganization({
        company_name: companyName.value.trim(),
        tax_id: taxId.value.trim().toUpperCase(),
        kind: kind.value,
        municipality_id: accountStore.municipalityId,
        address: address.value.trim(),
        location: {
          latitude: latitude.value,
          longitude: longitude.value,
        },
        phone_number: companyPhone.value.trim() || undefined,
        company_description: companyDescription.value.trim() || undefined,
      });

      // Upload Organization Logo
      if (logoFile.value) {
        await organizationApi.uploadOrganizationLogo(org.id, logoFile.value);
      }

      //  Submit Verification Request
      if (verificationDocumentFile.value) {
        const verifReq = await verificationRequestApi.createVerificationRequest({
          organization_id: org.id,
        });

        await verificationRequestDocumentApi.uploadVerificationDocument(
          verifReq.id,
          verificationDocumentFile.value,
          "Registro Mercantil / Cédula RUC",
        );

        await verificationRequestApi.submitVerificationRequest(verifReq.id, {
          request_id: verifReq.id,
        });
      }
    } catch (err: any) {
      errorMessage.value =
        err.message || "Error al completar el registro del proveedor";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  function resetForm() {
    companyName.value = "";
    taxId.value = "";
    kind.value = "wholesaler";
    companyPhone.value = "";
    companyDescription.value = "";
    address.value = "";
    latitude.value = null;
    longitude.value = null;
    termsAccepted.value = false;
    errorMessage.value = null;
    clearLogo();
    clearVerificationDocument();
  }

  return {
    companyName,
    taxId,
    kind,
    companyPhone,
    companyDescription,
    address,
    latitude,
    longitude,
    logoFile,
    logoPreviewUrl,
    verificationDocumentFile,
    termsAccepted,
    isLoading,
    errorMessage,
    setLogo,
    clearLogo,
    setVerificationDocument,
    clearVerificationDocument,
    setLocation,
    submitProviderRegistration,
    resetForm,
  };
});
