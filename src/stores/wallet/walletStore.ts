import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useWalletApi } from "@/api/modules/wallet/wallet/useWalletApi";
import { usePlatformBankAccountApi } from "@/api/modules/wallet/platform_bank_account/usePlatformBankAccountApi";
import { useVoucherApi } from "@/api/modules/wallet/voucher/useVoucherApi";
import { useDepositApi } from "@/api/modules/wallet/deposit/useDepositApi";
import { notificationBus } from "@/events/notificationEvents";
import type {
  VirtualWalletResponse,
  LedgerEntryResponse,
  WalletLedgerPaginationQuery,
  PlatformBankAccountResponse,
  DepositRequestResponse,
  DepositRequestSummaryResponse,
} from "@/api";

export interface WalletRechargeDraft {
  amount: number | null;
  platformBankAccountId: string | null;
  bank: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  referenceNumber: string;
  depositDate: string;
  depositorName: string;
  depositTime: string;
  voucherFile: File | null;
  voucherFileName: string;
  voucherPreviewUrl: string | null;
}

export const useWalletStore = defineStore("wallet", () => {
  const walletApi = useWalletApi();
  const bankAccountApi = usePlatformBankAccountApi();
  const voucherApi = useVoucherApi();
  const depositApi = useDepositApi();

  const wallet = ref<VirtualWalletResponse | null>(null);
  const ledgerEntries = ref<LedgerEntryResponse[]>([]);
  const totalLedger = ref<number>(0);

  const platformBankAccounts = ref<PlatformBankAccountResponse[]>([]);
  const isAccountsLoading = ref<boolean>(false);

  const myRecharges = ref<DepositRequestSummaryResponse[]>([]);
  const totalMyRecharges = ref<number>(0);
  const isRechargesLoading = ref<boolean>(false);

  const lastSubmittedRecharge = ref<DepositRequestResponse | null>(null);
  const isSubmittingRecharge = ref<boolean>(false);

  const isLoading = ref<boolean>(false);
  const isLedgerLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const defaultRechargeDraft = (): WalletRechargeDraft => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return {
      amount: null,
      platformBankAccountId: null,
      bank: "",
      bankName: "",
      accountNumber: "",
      accountType: "",
      referenceNumber: "",
      depositDate: now.toISOString().split("T")[0],
      depositorName: "",
      depositTime: currentTime,
      voucherFile: null,
      voucherFileName: "",
      voucherPreviewUrl: null,
    };
  };

  const rechargeDraft = ref<WalletRechargeDraft>(defaultRechargeDraft());

  const balance = computed<number>(() => wallet.value?.balance ?? 0);
  const formattedBalance = computed<string>(() => {
    return new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: "NIO",
    }).format(balance.value);
  });

  async function fetchWallet(): Promise<VirtualWalletResponse | null> {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await walletApi.getMyWallet();
      wallet.value = response;
      return response;
    } catch (err: any) {
      console.error("[WalletStore] Failed to fetch wallet:", err);
      error.value = err.message || "Error al obtener la información de la billetera";
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchLedger(
    params: WalletLedgerPaginationQuery = { limit: 20, offset: 0 }
  ) {
    isLedgerLoading.value = true;
    try {
      const response = await walletApi.getMyWalletLedger(params);
      ledgerEntries.value = Array.isArray(response?.data) ? response.data : [];
      totalLedger.value = response?.total ?? 0;
      return response;
    } catch (err: any) {
      console.error("[WalletStore] Failed to fetch ledger:", err);
      ledgerEntries.value = [];
      return null;
    } finally {
      isLedgerLoading.value = false;
    }
  }

  async function fetchPlatformBankAccounts(): Promise<PlatformBankAccountResponse[]> {
    isAccountsLoading.value = true;
    try {
      const accounts = await bankAccountApi.getPlatformBankAccounts();
      platformBankAccounts.value = accounts.filter((a) => a.is_active);

      // Pre-select the first account if none is selected yet in draft
      if (
        platformBankAccounts.value.length > 0 &&
        (!rechargeDraft.value.platformBankAccountId ||
          !platformBankAccounts.value.some(
            (a) => a.id === rechargeDraft.value.platformBankAccountId
          ))
      ) {
        const first = platformBankAccounts.value[0];
        setRechargeDraft({
          platformBankAccountId: first.id,
          bank: first.bank_name.toLowerCase().replace(/\s+/g, "-"),
          bankName: first.bank_name,
          accountNumber: first.account_number,
          accountType: first.account_type,
        });
      }

      return platformBankAccounts.value;
    } catch (err: any) {
      console.error("[WalletStore] Failed to fetch platform bank accounts:", err);
      return [];
    } finally {
      isAccountsLoading.value = false;
    }
  }

  function setRechargeDraft(data: Partial<WalletRechargeDraft>) {
    rechargeDraft.value = { ...rechargeDraft.value, ...data };
  }

  function resetRechargeDraft() {
    rechargeDraft.value = defaultRechargeDraft();
    if (platformBankAccounts.value.length > 0) {
      const first = platformBankAccounts.value[0];
      setRechargeDraft({
        platformBankAccountId: first.id,
        bank: first.bank_name.toLowerCase().replace(/\s+/g, "-"),
        bankName: first.bank_name,
        accountNumber: first.account_number,
        accountType: first.account_type,
      });
    }
  }

  async function submitRecharge(): Promise<DepositRequestResponse> {
    const draft = rechargeDraft.value;

    if (!draft.platformBankAccountId) {
      throw new Error("Debe seleccionar una cuenta bancaria de destino");
    }
    if (!draft.amount || draft.amount <= 0) {
      throw new Error("El monto a recargar debe ser mayor a 0");
    }
    if (!draft.referenceNumber || !draft.referenceNumber.trim()) {
      throw new Error("Debe ingresar el número de referencia");
    }
    if (!draft.voucherFile) {
      throw new Error("Debe adjuntar el comprobante de depósito");
    }

    isSubmittingRecharge.value = true;
    error.value = null;

    try {
      // Step 1: Upload voucher file via Valet Parking flow
      const voucherBlobId = await voucherApi.uploadVoucherFile(draft.voucherFile);

      // Step 2: Format deposited_at datetime ISO string if provided
      let depositedAt: string = new Date().toISOString();
      if (draft.depositDate) {
        try {
          const timeParts = draft.depositTime ? draft.depositTime.split(":") : ["12", "00"];
          const date = new Date(draft.depositDate);
          date.setHours(parseInt(timeParts[0], 10) || 12, parseInt(timeParts[1], 10) || 0, 0, 0);
          depositedAt = date.toISOString();
        } catch {
          depositedAt = new Date().toISOString();
        }
      }

      // Step 3: Register deposit request in backend
      const response = await depositApi.createRecharge({
        platform_bank_account_id: draft.platformBankAccountId,
        amount: draft.amount,
        reference_code: draft.referenceNumber.trim(),
        voucher_blob_id: voucherBlobId,
        deposited_at: depositedAt,
      });

      lastSubmittedRecharge.value = response;
      return response;
    } catch (err: any) {
      console.error("[WalletStore] Failed to submit recharge:", err);
      throw err;
    } finally {
      isSubmittingRecharge.value = false;
    }
  }

  async function fetchMyRecharges(page = 1, perPage = 20) {
    isRechargesLoading.value = true;
    try {
      const response = await depositApi.getMyRecharges({
        limit: perPage,
        offset: (page - 1) * perPage,
      });
      myRecharges.value = response.data;
      totalMyRecharges.value = response.total;
      return response;
    } catch (err: any) {
      console.error("[WalletStore] Failed to fetch my recharges:", err);
      myRecharges.value = [];
      return null;
    } finally {
      isRechargesLoading.value = false;
    }
  }

  function reset() {
    wallet.value = null;
    ledgerEntries.value = [];
    totalLedger.value = 0;
    platformBankAccounts.value = [];
    myRecharges.value = [];
    totalMyRecharges.value = 0;
    lastSubmittedRecharge.value = null;
    isLoading.value = false;
    isLedgerLoading.value = false;
    isAccountsLoading.value = false;
    isRechargesLoading.value = false;
    isSubmittingRecharge.value = false;
    error.value = null;
    rechargeDraft.value = defaultRechargeDraft();
  }

  // Auto-refresh wallet data when wallet notification events arrive
  notificationBus.on((event) => {
    if (
      event.type === "WalletDepositStatusChanged" ||
      event.type === "WalletWithdrawalStatusChanged"
    ) {
      fetchWallet();
      fetchLedger();
      fetchMyRecharges();
    }
  });

  return {
    wallet,
    ledgerEntries,
    totalLedger,
    platformBankAccounts,
    isAccountsLoading,
    myRecharges,
    totalMyRecharges,
    isRechargesLoading,
    lastSubmittedRecharge,
    isSubmittingRecharge,
    isLoading,
    isLedgerLoading,
    error,
    balance,
    formattedBalance,
    rechargeDraft,
    setRechargeDraft,
    resetRechargeDraft,
    fetchWallet,
    fetchLedger,
    fetchPlatformBankAccounts,
    submitRecharge,
    fetchMyRecharges,
    reset,
  };
});
