import type { ApiClient } from "../../client";
import { UploadUrlResponseSchema } from "../../shared/schemas";
import {
  VerificationDocumentUploadRequestSchema,
  ConfirmVerificationDocumentSchema,
} from "./payloads";
import type {
  VerificationDocumentUploadRequest,
  ConfirmVerificationDocument,
} from "./types";

export class VerificationRequestDocumentService {
  constructor(private readonly client: ApiClient) {}

  async uploadVerificationDocument(
    requestId: string,
    file: File,
    documentLabel?: string,
  ): Promise<void> {
    const payload: VerificationDocumentUploadRequest = {
      request_id: requestId,
      mime_type: file.type,
      size_bytes: file.size,
    };
    const validated = VerificationDocumentUploadRequestSchema.parse(payload);
    const initData = UploadUrlResponseSchema.parse(
      await this.client.request("/assets/verification-document", {
        method: "POST",
        body: JSON.stringify(validated),
      }),
    );

    const storageResponse = await fetch(initData.presigned_url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!storageResponse.ok) throw new Error("Upload failed");

    const confirmPayload: ConfirmVerificationDocument = {
      request_id: requestId,
      document_label: documentLabel,
    };
    const validatedConfirm = ConfirmVerificationDocumentSchema.parse(confirmPayload);

    await this.client.request(
      `/assets/verification-document/${initData.blob_id}/confirm`,
      {
        method: "POST",
        body: JSON.stringify(validatedConfirm),
      },
    );
  }

  async deleteVerificationDocument(blobId: string): Promise<void> {
    await this.client.request(`/assets/verification-document/${blobId}`, {
      method: "DELETE",
    });
  }

  async getVerificationDocumentUrl(blobId: string): Promise<string> {
    const response = await fetch(
      `${this.client.getBaseUrl()}/assets/verification-document/${blobId}`,
      { method: "GET" },
    );
    if (!response.ok)
      throw new Error(`Failed to fetch document: ${response.statusText}`);

    return URL.createObjectURL(await response.blob());
  }
}
