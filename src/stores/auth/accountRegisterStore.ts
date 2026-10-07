import { defineStore } from "pinia";
import { ref } from "vue";
import { useIdentityApi } from "@/api/modules/identity/auth/useIdentityApi";
import { useAuthStore } from "./authStore";
import { useTokenStore } from "./tokenStore";
import type { RegisterRequest } from "@/api";
import { useAvatarApi } from "@/api/modules/identity/avatar/useAvatarApi";
import { sanitizeNationalId, sanitizePhone } from "@/utils/formatters";

export const useAccountRegisterStore = defineStore("accountRegister", () => {
  const identityApi = useIdentityApi();
  const avatarApi = useAvatarApi();

  const firstName = ref("");
  const lastName = ref("");
  const nationalId = ref("");
  const phoneNumber = ref("");
  const departmentId = ref("");
  const municipalityId = ref<string | null>(null);
  const email = ref("");
  const password = ref("");
  const termsAccepted = ref(false);
  const interests = ref<string[]>([]);

  const avatarFile = ref<File | null>(null);
  const avatarPreviewUrl = ref<string | null>(null);

  const isLoading = ref(false);
  const errorMessage = ref<string | null>(null);

  function setAvatar(file: File) {
    if (!file.type.startsWith("image/")) {
      throw new Error("Solo se permiten archivos de imagen.");
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new Error("La imagen supera el límite máximo permitido de 2MB.");
    }
    if (avatarPreviewUrl.value) URL.revokeObjectURL(avatarPreviewUrl.value);
    avatarFile.value = file;
    avatarPreviewUrl.value = URL.createObjectURL(file);
  }

  function clearAvatar() {
    if (avatarPreviewUrl.value) URL.revokeObjectURL(avatarPreviewUrl.value);
    avatarFile.value = null;
    avatarPreviewUrl.value = null;
  }

  async function submitRegistration(rawPassword: string) {
    isLoading.value = true;
    errorMessage.value = null;

    try {
      const payload: RegisterRequest = {
        email: email.value.trim(),
        password: rawPassword,
        first_name: firstName.value.trim(),
        last_name: lastName.value.trim(),
        national_id: nationalId.value ? sanitizeNationalId(nationalId.value) : null,
        phone_number: phoneNumber.value ? sanitizePhone(phoneNumber.value) : null,
        municipality_id: municipalityId.value!,
        interests: interests.value,
      };

      // 1. Create user account
      await identityApi.register(payload);

      // 2. Upload avatar if selected (temporarily acquires tokens and uploads)
      if (avatarFile.value) {
        const tokenStore = useTokenStore();
        try {
          const tokens = await identityApi.login({
            email: email.value.trim(),
            password: rawPassword,
          });
          tokenStore.setTokens(tokens.access_token, tokens.refresh_token);

          await avatarApi.changeAvatar(avatarFile.value);
        } catch (avatarErr) {
          console.warn("No se pudo subir el avatar en el registro:", avatarErr);
        } finally {
          // Clear tokens so the session remains unauthenticated until user logs in at /login
          tokenStore.clearTokens();
          const authStore = useAuthStore();
          authStore.account = null;
        }
      }
    } catch (err: any) {
      errorMessage.value = err.message || "Error durante el registro";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  function resetForm() {
    firstName.value = "";
    lastName.value = "";
    nationalId.value = "";
    phoneNumber.value = "";
    departmentId.value = "";
    municipalityId.value = null;
    email.value = "";
    password.value = "";
    termsAccepted.value = false;
    interests.value = [];
    clearAvatar();
    errorMessage.value = null;
  }

  return {
    firstName,
    lastName,
    nationalId,
    phoneNumber,
    departmentId,
    municipalityId,
    email,
    password,
    termsAccepted,
    interests,
    avatarFile,
    avatarPreviewUrl,
    isLoading,
    errorMessage,
    setAvatar,
    clearAvatar,
    submitRegistration,
    resetForm,
  };
});
