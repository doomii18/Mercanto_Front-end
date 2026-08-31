import { defineStore } from "pinia";
import { ref } from "vue";
import { identityApi, userProfileApi } from "@/api";
import type { RegisterRequest } from "@/api/services/identity/types";

export const useAccountRegisterStore = defineStore("accountRegister", () => {
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
        national_id: nationalId.value.trim() || null,
        phone_number: phoneNumber.value.trim() || null,
        municipality_id: municipalityId.value!,
        interests: interests.value,
      };

      await identityApi.register(payload);

      if (avatarFile.value) {
        await identityApi.login({ email: email.value.trim(), password: rawPassword });
        await userProfileApi.changeProfilePicture(avatarFile.value);
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
