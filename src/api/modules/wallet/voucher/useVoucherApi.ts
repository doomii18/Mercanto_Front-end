import { useApiFetch } from "@/api/useApiFetch";
import { UploadUrlResponseSchema } from "@/api/modules/shared/schemas";
import { InitiateVoucherUploadSchema } from "./requests";
import { VoucherDownloadResponseSchema } from "./responses";
import type { InitiateVoucherUpload, VoucherDownloadResponse } from "./types";
import type { UploadUrlResponse } from "@/api/modules/shared/types";

export const useVoucherApi = () => {
  // POST /wallets/me/vouchers/upload
  async function requestVoucherUpload(
    payload: InitiateVoucherUpload
  ): Promise<UploadUrlResponse> {
    const validated = InitiateVoucherUploadSchema.parse(payload);
    const { data, error } = await useApiFetch("/wallets/me/vouchers/upload")
      .post(validated)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to initialize voucher upload");
    }

    return UploadUrlResponseSchema.parse(data.value);
  }

  // POST /wallets/me/vouchers/{blob_id}/confirm
  async function confirmVoucherUpload(blobId: string): Promise<void> {
    const { error } = await useApiFetch(`/wallets/me/vouchers/${blobId}/confirm`).post();

    if (error.value) {
      throw error.value || new Error(`Failed to confirm voucher upload ${blobId}`);
    }
  }

  // GET /admin/payments/recharges/{id}/voucher
  async function getRechargeVoucherUrl(depositId: string): Promise<VoucherDownloadResponse> {
    const { data, error } = await useApiFetch(`/admin/payments/recharges/${depositId}/voucher`)
      .get()
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to get voucher download URL for recharge ${depositId}`);
    }

    return VoucherDownloadResponseSchema.parse(data.value);
  }

  // Complete Valet Parking client flow:
  // 1. Request presigned upload URL
  // 2. PUT file binary directly to Object Storage
  // 3. Confirm upload with the backend worker
  // 4. Return confirmed blob_id
  async function uploadVoucherFile(file: File): Promise<string> {
    const uploadInfo = await requestVoucherUpload({
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
    });

    const response = await fetch(uploadInfo.presigned_url, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });

    if (!response.ok) {
      throw new Error("Failed to upload voucher binary to storage");
    }

    await confirmVoucherUpload(uploadInfo.blob_id);
    return uploadInfo.blob_id;
  }

  return {
    requestVoucherUpload,
    confirmVoucherUpload,
    getRechargeVoucherUrl,
    uploadVoucherFile,
  };
};
