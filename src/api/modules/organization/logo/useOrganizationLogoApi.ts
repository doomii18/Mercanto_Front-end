import { useApiFetch } from "@/api/useApiFetch";
import { OrganizationLogoUploadRequestSchema } from "./requests";
import { UploadUrlResponseSchema } from "./responses";

export const useOrganizationLogoApi = () => {
  // GET /providers/logo/{blob_id}
  async function getOrganizationLogoBlob(blobId: string): Promise<Blob> {
    const { data, error } = await useApiFetch(`/providers/logo/${blobId}`)
      .get()
      .blob();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch organization logo");
    }

    return data.value;
  }

  // POST /providers/{organization_id}/logo/upload & POST /providers/{organization_id}/logo/{blob_id}/confirm
  async function uploadOrganizationLogo(
    organizationId: string,
    file: File
  ): Promise<void> {
    const payload = OrganizationLogoUploadRequestSchema.parse({
      mime_type: file.type,
      size_bytes: file.size,
    });

    // Request presigned upload URL
    const { data: initData, error: initError } = await useApiFetch(
      `/providers/${organizationId}/logo/upload`
    )
      .post(payload)
      .json();

    if (initError.value || !initData.value) {
      throw initError.value || new Error("Failed to initialize logo upload");
    }

    const uploadInfo = UploadUrlResponseSchema.parse(initData.value);

    // Upload directly to object storage
    const storageResponse = await fetch(uploadInfo.presigned_url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!storageResponse.ok) {
      throw new Error("Failed to upload logo to storage");
    }

    // Confirm upload to backend
    const { error: confirmError } = await useApiFetch(
      `/providers/${organizationId}/logo/${uploadInfo.blob_id}/confirm`
    ).post();

    if (confirmError.value) {
      throw confirmError.value;
    }
  }

  // DELETE /providers/{organization_id}/logo
  async function deleteOrganizationLogo(organizationId: string): Promise<void> {
    const { error } = await useApiFetch(`/providers/${organizationId}/logo`)
      .delete();

    if (error.value) {
      throw error.value;
    }
  }

  return {
    getOrganizationLogoBlob,
    uploadOrganizationLogo,
    deleteOrganizationLogo,
  };
};
