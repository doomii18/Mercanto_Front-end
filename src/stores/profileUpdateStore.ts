import { defineStore } from "pinia";
import { ref } from "vue";
import { userProfileApi } from "@/api";
import { useUserContextStore } from "./userContextStore";
import type { UserProfileResponse } from "@/api/services/user_profile/types";

export const useProfileUpdateStore = defineStore("profileUpdate", () => {
  const firstName = ref("");
  const lastName = ref("");
  const phoneNumber = ref("");
  const nationalId = ref("");
  const municipalityId = ref<string | null>(null);

  const avatarFile = ref<File | null>(null);
  const avatarPreviewUrl = ref<string | null>(null);

  const isLoading = ref(false);
  const errorMessage = ref<string | null>(null);

  function hydrateFromProfile(profile: UserProfileResponse | null) {
    if (!profile) return;
    const internal = profile as any;
    firstName.value = profile.first_name || "";
    lastName.value = profile.last_name || "";
    phoneNumber.value = internal.phone_number || "";
    nationalId.value = internal.national_id || "";
    municipalityId.value = internal.municipality_id || null;
  }

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

  function resetForm() {
    firstName.value = "";
    lastName.value = "";
    phoneNumber.value = "";
    nationalId.value = "";
    municipalityId.value = null;
    clearAvatar();
    errorMessage.value = null;
  }

  async function submitUpdate(): Promise<boolean> {
    isLoading.value = true;
    errorMessage.value = null;
    const contextStore = useUserContextStore();

    try {
      // Update text fields
      const updatedProfile = await userProfileApi.updateMyProfile({
        first_name: firstName.value.trim(),
        last_name: lastName.value.trim(),
        phone_number: phoneNumber.value.trim() || null,
        national_id: nationalId.value.trim() || null,
        municipality_id: municipalityId.value || null,
      });

      //  Update avatar if a new file was selected
      if (avatarFile.value) {
        await userProfileApi.changeProfilePicture(avatarFile.value);
        // Fetch the latest profile to get the new avatar_blob_id
        const latestProfile = await userProfileApi.getMyProfile();
        contextStore.updateUserProfile(latestProfile);
      } else {
        contextStore.updateUserProfile(updatedProfile);
      }

      return true;
    } catch (err: any) {
      errorMessage.value = err.message || "Error al actualizar el perfil.";
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    firstName,
    lastName,
    phoneNumber,
    nationalId,
    municipalityId,
    avatarFile,
    avatarPreviewUrl,
    isLoading,
    errorMessage,
    hydrateFromProfile,
    setAvatar,
    clearAvatar,
    resetForm,
    submitUpdate,
  };
});
