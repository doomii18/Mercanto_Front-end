import { defineStore } from "pinia";
import { ref } from "vue";
import { useVerificationRequestApi } from "@/api/modules/organization/verification_request/useVerificationRequestApi";
import { useVerificationDocumentApi } from "@/api/modules/organization/verification_request_document/useVerificationDocumentApi";
import type { ProviderKind } from "@/api";
import { useIdentityApi } from "@/api/modules/identity/auth/useIdentityApi";
import { useAccountRegisterStore } from "./accountRegisterStore";
import { useAuthStore } from "./authStore";
import { useTokenStore } from "./tokenStore";
import { useUserContextStore } from "./userContextStore";
import { useOrganizationApi } from "@/api/modules/organization/organization/useOrganizationApi";
import { useOrganizationLogoApi } from "@/api/modules/organization/logo/useOrganizationLogoApi";
import { sanitizePhone, sanitizeTaxId } from "@/utils/formatters";

export const useProviderRegisterStore = defineStore("providerRegister", () => {
  const accountStore = useAccountRegisterStore();
  const organizationApi = useOrganizationApi();
  const organizationLogoApi = useOrganizationLogoApi();
  const verificationRequestApi = useVerificationRequestApi();
  const verificationRequestDocumentApi = useVerificationDocumentApi();

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
      // 1. Create base Account & User Profile in identity service
      await accountStore.submitRegistration(password);

      // 2. Obtain tokens for authenticated requests without prematurely triggering buyer preference guards
      const identityApi = useIdentityApi();
      const tokenStore = useTokenStore();
      const tokens = await identityApi.login({
        email: accountStore.email.trim(),
        password,
      });
      tokenStore.setTokens(tokens.access_token, tokens.refresh_token);

      // 3. Register Organization in backend
      const org = await organizationApi.registerOrganization({
        company_name: companyName.value.trim(),
        tax_id: sanitizeTaxId(taxId.value),
        kind: kind.value,
        municipality_id: accountStore.municipalityId,
        address: address.value.trim(),
        location: {
          latitude: latitude.value,
          longitude: longitude.value,
        },
        phone_number: companyPhone.value ? sanitizePhone(companyPhone.value) : undefined,
        company_description: companyDescription.value.trim() || undefined,
      });

      // 4. Upload Organization Logo if provided
      if (logoFile.value) {
        await organizationLogoApi.uploadOrganizationLogo(org.id, logoFile.value);
      }

      // 5. Submit Verification Request if document provided
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

      // 6. Populate Provider Context & wait if necessary to guarantee provider type before exposing auth
      const userContext = useUserContextStore();
      userContext.updateActiveOrganization(org);
      userContext.setActiveOrganization(org.id);

      let retries = 5;
      while (retries > 0) {
        try {
          await userContext.initialize(true);
          if (userContext.organizations.length > 0 && userContext.isProvider) {
            break;
          }
        } catch (e) {
          console.warn("[ProviderRegister] Waiting for organization context...", e);
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
        retries--;
      }

      if (userContext.organizations.length === 0) {
        userContext.updateActiveOrganization(org);
        userContext.setActiveOrganization(org.id);
      }

      // 7. Finally, expose authenticated account now that provider context is fully established
      const authStore = useAuthStore();
      const profile = await identityApi.getMyAccount();
      authStore.account = profile;
      authStore.isInitialized = true;
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
