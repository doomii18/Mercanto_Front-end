import { useApiFetch } from "@/api/useApiFetch";
import { ProfilePicUploadRequestSchema } from "./requests";
import { AvatarUploadUrlResponseSchema } from "./responses";
import type { ProfilePicUploadRequest, AvatarUploadUrlResponse } from "./types";

export const useAvatarApi = () => {
  // POST /me/avatar/upload
  async function requestAvatarUpload(
    payload: ProfilePicUploadRequest
  ): Promise<AvatarUploadUrlResponse> {
    const validated = ProfilePicUploadRequestSchema.parse(payload);
    const { data, error } = await useApiFetch("/me/avatar/upload")
      .post(validated)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to initialize avatar upload");
    }

    return AvatarUploadUrlResponseSchema.parse(data.value);
  }

  // POST /me/avatar/confirm/{blob_id}
  async function confirmAvatarUpload(blobId: string): Promise<void> {
    const { error } = await useApiFetch(`/me/avatar/confirm/${blobId}`).post();

    if (error.value) {
      throw error.value || new Error(`Failed to confirm avatar ${blobId}`);
    }
  }

  // GET /avatar/{blob_id}
  async function getAvatarBlob(blobId: string): Promise<Blob> {
    const { data, error } = await useApiFetch(`/avatar/${blobId}`)
      .get()
      .blob();

    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch avatar ${blobId}`);
    }

    return data.value;
  }

  // DELETE /me/avatar/{blob_id}
  async function deleteAvatar(blobId: string): Promise<void> {
    const { error } = await useApiFetch(`/me/avatar/${blobId}`).delete();

    if (error.value) {
      throw error.value || new Error(`Failed to delete avatar ${blobId}`);
    }
  }

  // Complete client flow: request URL, PUT file, confirm
  async function changeAvatar(file: File): Promise<string> {
    const uploadInfo = await requestAvatarUpload({
      mime_type: file.type,
      size_bytes: file.size,
    });

    const response = await fetch(uploadInfo.presigned_url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!response.ok) {
      throw new Error("Failed to upload avatar binary to storage");
    }

    await confirmAvatarUpload(uploadInfo.blob_id);
    return uploadInfo.blob_id;
  }

  return {
    requestAvatarUpload,
    confirmAvatarUpload,
    getAvatarBlob,
    deleteAvatar,
    changeAvatar,
  };
};
