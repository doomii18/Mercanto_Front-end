import { useApiFetch } from "./useApiFetch";
import { UploadUrlResponseSchema } from "@/api/shared/schemas";
import {
  VerificationDocumentUploadRequestSchema,
  ConfirmVerificationDocumentSchema,
} from "@/api/services/verification_request_document/payloads";
import type {
  VerificationDocumentUploadRequest,
  ConfirmVerificationDocument,
} from "@/api/services/verification_request_document/types";

export const useVerificationDocumentApi = () => {
  async function uploadVerificationDocument(
    requestId: string,
    file: File,
    documentLabel?: string
  ): Promise<void> {
    const payload: VerificationDocumentUploadRequest = {
      request_id: requestId,
      mime_type: file.type,
      size_bytes: file.size,
    };
    const validated = VerificationDocumentUploadRequestSchema.parse(payload);

    const { data: initData, error: initError } = await useApiFetch("/assets/verification-document")
      .post(validated)
      .json();

    if (initError.value || !initData.value) {
      throw initError.value || new Error("Failed to initialize verification document upload");
    }

    const uploadInfo = UploadUrlResponseSchema.parse(initData.value);

    const storageResponse = await fetch(uploadInfo.presigned_url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!storageResponse.ok) {
      throw new Error("Failed to upload verification document to storage");
    }

    const confirmPayload: ConfirmVerificationDocument = {
      request_id: requestId,
      document_label: documentLabel ?? null,
    };
    const validatedConfirm = ConfirmVerificationDocumentSchema.parse(confirmPayload);

    const { error: confirmError } = await useApiFetch(
      `/assets/verification-document/${uploadInfo.blob_id}/confirm`
    )
      .post(validatedConfirm);

    if (confirmError.value) {
      throw confirmError.value;
    }
  }

  async function deleteVerificationDocument(blobId: string): Promise<void> {
    const { error } = await useApiFetch(`/assets/verification-document/${blobId}`).delete();
    if (error.value) {
      throw error.value;
    }
  }

  async function getVerificationDocumentBlob(blobId: string): Promise<Blob> {
    const { data, error } = await useApiFetch(`/assets/verification-document/${blobId}`)
      .get()
      .blob();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch verification document");
    }
    return data.value;
  }

  return {
    uploadVerificationDocument,
    deleteVerificationDocument,
    getVerificationDocumentBlob,
  };
};
