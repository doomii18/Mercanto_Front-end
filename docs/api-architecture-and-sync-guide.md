# Frontend API Architecture and Backend Synchronization Guide

This guide documents the standard architecture of the frontend API layer (`frontend/src/api/`), the modular entity/resource design pattern, the canonical file upload flow (*Valet Parking*), and the step-by-step workflow for synchronizing new modules and endpoints from the Rust backend.

---

## 1. Architectural Philosophy and Design Principles

1. **1:1 Alignment with Backend Handlers & Crates**:
   The folder hierarchy in the frontend mirrors the backend server crates and handler structure (`crates/server/<domain>/src/handlers/`). For example, when the backend groups operations under `wallet` into dedicated subhandlers (`wallet`, `deposit`, `withdrawal`, `platform_bank_account`, `voucher`), the frontend replicates this exact subdivision.
2. **Bidirectional Strict Typing with Zod 4**:
   Both request inputs (parameters and request payloads) and server responses are validated at runtime using **Zod 4**. Static TypeScript types are inferred directly from these schemas (`z.infer<typeof ...>`), guaranteeing complete consistency between compile-time typing and runtime validation.
3. **Decoupling and Zero Ambiguous Barrels**:
   - No monolithic barrel files or composable aggregators exist in domain roots (e.g., there is no root `wallet/index.ts` re-exporting multiple composables).
   - Composables are imported directly from their respective submodule path (e.g., `@/api/modules/wallet/deposit/useDepositApi`).
   - The global entry point [`frontend/src/api/index.ts`](file:///var/home/ocelot/Repositories/bytes-volcanicos-hackaton/frontend/src/api/index.ts) **exclusively exports TypeScript types** (`types.d.ts`), enabling views and Pinia stores to import types cleanly with `import type { ... } from "@/api"`.

---

## 2. Directory Structure

```text
frontend/src/api/
├── index.ts                      <-- Re-exports EXCLUSIVELY TypeScript types (types.d.ts)
├── useApiFetch.ts                <-- Base @vueuse/core fetch instance with interceptors
└── modules/
    ├── shared/                   <-- Shared schemas & types (pagination, error payloads, UploadUrl)
    │   ├── schemas.ts
    │   └── types.d.ts
    ├── geography/                <-- Standalone module (no submodules)
    ├── health/                   <-- Standalone module
    ├── catalog/                  <-- Modular domain with submodules
    │   ├── category/
    │   ├── category_image/       <-- Dedicated file-handling submodule (Valet Parking)
    │   ├── inventory/
    │   ├── offer/
    │   ├── product/
    │   └── product_image/        <-- Dedicated file-handling submodule (Valet Parking)
    ├── commerce/
    │   ├── cart/
    │   ├── quote/
    │   └── review/
    ├── identity/
    │   ├── auth/
    │   ├── avatar/               <-- Dedicated file-handling submodule (Valet Parking)
    │   └── user_profile/
    ├── messaging/
    │   ├── chat/
    │   └── notifications/
    ├── organization/
    │   ├── logo/                 <-- Dedicated file-handling submodule (Valet Parking)
    │   ├── organization/
    │   ├── verification_request/
    │   └── verification_request_document/ <-- Dedicated file-handling submodule (Valet Parking)
    └── wallet/
        ├── wallet/               <-- Virtual balance & immutable transaction ledger
        ├── deposit/              <-- Deposit requests / account recharges
        ├── withdrawal/           <-- Extraction requests / account withdrawals
        ├── platform_bank_account/<-- Official destination bank accounts managed by platform
        └── voucher/              <-- Dedicated file-handling submodule for vouchers (Valet Parking)
```

---

## 3. Anatomy of an API Submodule

Every submodule folder (e.g., `frontend/src/api/modules/wallet/deposit/`) adheres to a standard 5-part architecture:

```text
deposit/
├── domain.ts          (Optional: domain scalars, enums, and branded Zod rules)
├── requests.ts        (Required: Zod schemas for input bodies and query params)
├── responses.ts       (Required: Zod schemas for API output responses)
├── types.d.ts         (Required: TypeScript types inferred via z.infer)
└── useDepositApi.ts   (Required: Vue composable providing typed HTTP methods)
```

### 3.1. `domain.ts`
Defines reusable atomic scalars, enumerations, and validation rules:
```typescript
import { z } from "zod";

export const DepositRequestStatusSchema = z.enum(["pending", "approved", "rejected"]);
export const DepositAmountSchema = z.coerce.number().positive("Deposit amount must be positive");
```

> **Note**: For purely upload-focused submodules (e.g., `category_image`, `voucher`) or response-only lookup submodules (e.g., `platform_bank_account`), `domain.ts` may be omitted according to YAGNI.

### 3.2. `requests.ts`
Defines Zod schemas for payloads used in `POST`, `PUT`, `PATCH`, and query string parameters (`Query`):
```typescript
import { z } from "zod";
import { DepositRequestStatusSchema, DepositAmountSchema } from "./domain";

export const CreateDepositRequestSchema = z.object({
  platform_bank_account_id: z.string().uuid("Invalid platform bank account ID"),
  amount: DepositAmountSchema,
  reference_code: z.string().trim().max(100).nullable().optional(),
  voucher_blob_id: z.string().uuid("Invalid voucher blob ID"),
  deposited_at: z.string().datetime().nullable().optional(),
});

export const DepositFilterQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  per_page: z.number().int().min(1).max(100).optional(),
  status: DepositRequestStatusSchema.optional(),
  search: z.string().trim().optional(),
});
```

### 3.3. `responses.ts`
Defines the exact structure returned by backend endpoints, including paginated envelopes:
```typescript
import { z } from "zod";
import { DepositRequestStatusSchema, DepositAmountSchema } from "./domain";

export const DepositRequestResponseSchema = z.object({
  id: z.string().uuid(),
  account_id: z.string().uuid(),
  platform_bank_account_id: z.string().uuid(),
  amount: DepositAmountSchema,
  status: DepositRequestStatusSchema,
  voucher_blob_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const PaginatedDepositSummaryResponseSchema = z.object({
  data: z.array(DepositRequestSummaryResponseSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().nonnegative(),
  per_page: z.number().int().nonnegative(),
  total_pages: z.number().int().nonnegative(),
});
```

### 3.4. `types.d.ts`
Infers and exports clean TypeScript interfaces:
```typescript
import { z } from "zod";
import { DepositRequestStatusSchema } from "./domain";
import { CreateDepositRequestSchema, DepositFilterQuerySchema } from "./requests";
import { DepositRequestResponseSchema, PaginatedDepositSummaryResponseSchema } from "./responses";

export type DepositRequestStatus = z.infer<typeof DepositRequestStatusSchema>;
export type CreateDepositRequest = z.infer<typeof CreateDepositRequestSchema>;
export type DepositFilterQuery = z.infer<typeof DepositFilterQuerySchema>;
export type DepositRequestResponse = z.infer<typeof DepositRequestResponseSchema>;
export type PaginatedDepositSummaryResponse = z.infer<typeof PaginatedDepositSummaryResponseSchema>;
```

### 3.5. `use<Entity>Api.ts`
Implements HTTP methods using `useApiFetch`. Each method:
1. Validates input arguments using `Schema.parse(payload)`.
2. Dispatches the typed HTTP request (`.get()`, `.post()`, etc.).
3. Explicitly throws when `error.value || !data.value`.
4. Parses and validates the returned payload with `ResponseSchema.parse(data.value)`.

```typescript
import { useApiFetch } from "@/api/useApiFetch";
import { CreateDepositRequestSchema } from "./requests";
import { DepositRequestResponseSchema } from "./responses";
import type { CreateDepositRequest, DepositRequestResponse } from "./types";

export const useDepositApi = () => {
  async function createRecharge(payload: CreateDepositRequest): Promise<DepositRequestResponse> {
    const validated = CreateDepositRequestSchema.parse(payload);
    const { data, error } = await useApiFetch("/wallets/me/recharges")
      .post(validated)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to create recharge request");
    }

    return DepositRequestResponseSchema.parse(data.value);
  }

  return {
    createRecharge,
  };
};
```

---

## 4. File Handling Architecture: *Valet Parking* Pattern

Instead of uploading heavy `multipart/form-data` binaries through the application API gateway, the platform implements the **Valet Parking** pattern:
1. The frontend requests a temporary presigned PUT URL from the backend (`POST .../upload`).
2. The frontend uploads the raw binary file directly to Object Storage (MinIO / S3) via `fetch(presigned_url, { method: "PUT", body: file })`.
3. The frontend confirms physical upload existence with the backend (`POST .../{blob_id}/confirm`), triggering asynchronous worker outbox processing.

Every file-handling submodule (e.g., `catalog/product_image`, `identity/avatar`, `organization/verification_request_document`, `wallet/voucher`) implements a dedicated composable with a composite helper:

```typescript
// Example from frontend/src/api/modules/wallet/voucher/useVoucherApi.ts
export const useVoucherApi = () => {
  // Step 1: Request presigned upload URL
  async function requestVoucherUpload(payload: InitiateVoucherUpload): Promise<UploadUrlResponse> {
    const validated = InitiateVoucherUploadSchema.parse(payload);
    const { data, error } = await useApiFetch("/wallets/me/vouchers/upload").post(validated).json();
    if (error.value || !data.value) throw error.value || new Error("Failed to initialize upload");
    return UploadUrlResponseSchema.parse(data.value);
  }

  // Step 3: Confirm upload after binary is written to storage
  async function confirmVoucherUpload(blobId: string): Promise<void> {
    const { error } = await useApiFetch(`/wallets/me/vouchers/${blobId}/confirm`).post();
    if (error.value) throw error.value || new Error("Failed to confirm upload");
  }

  // End-to-end client composite flow:
  async function uploadVoucherFile(file: File): Promise<string> {
    // 1. Get presigned upload URL
    const uploadInfo = await requestVoucherUpload({
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
    });

    // 2. Direct binary PUT to S3 / MinIO
    const response = await fetch(uploadInfo.presigned_url, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!response.ok) throw new Error("Failed to upload binary to storage");

    // 3. Confirm physical object existence in the backend
    await confirmVoucherUpload(uploadInfo.blob_id);

    return uploadInfo.blob_id;
  }

  return {
    requestVoucherUpload,
    confirmVoucherUpload,
    uploadVoucherFile,
  };
};
```

---

## 5. Step-by-Step Workflow: Synchronizing with the Backend

Whenever endpoints or data structures are added or updated in the backend:

### Step 1: Inspect Backend Crates & Handlers
Navigate to `crates/server/<domain>/src/handlers/`. Review:
- Endpoint paths, HTTP verbs, and status codes.
- Request DTOs in `requests.rs` and response DTOs in `responses.rs`.
- File upload endpoints (`/upload` and `/{blob_id}/confirm`) if handling assets.

### Step 2: Create or Update Submodules in `frontend/src/api/modules/<domain>/`
- Create the target submodule folder (e.g., `<submodule>/`).
- Add `domain.ts` for domain rules or status enums if applicable.
- Add `requests.ts` mapping Rust DTOs to Zod (`z.string().uuid()`, `z.string().datetime()`, etc.).
- Add `responses.ts` mapping backend response DTOs.
- Add `types.d.ts` exporting inferred types.
- Add `use<Entity>Api.ts` using `useApiFetch`.

### Step 3: Register Types in [`frontend/src/api/index.ts`](file:///var/home/ocelot/Repositories/bytes-volcanicos-hackaton/frontend/src/api/index.ts)
Add the export line for the new submodule:
```typescript
// <Domain>
export * from "./modules/<domain>/<submodule>/types.d";
```

### Step 4: Consume in Pinia Stores and Views
- Import types centrally from `@/api`:
  ```typescript
  import type { DepositRequestResponse } from "@/api";
  ```
- Import composables directly from their submodule path:
  ```typescript
  import { useDepositApi } from "@/api/modules/wallet/deposit/useDepositApi";
  import { useVoucherApi } from "@/api/modules/wallet/voucher/useVoucherApi";
  ```

### Step 5: Verification and Quality Checks
Always execute in the `frontend` root:
```bash
# 1. Typecheck with vue-tsc
npm run typecheck

# 2. Production build verification
npm run build
```
Both commands must finish with **0 errors** before concluding synchronization.
