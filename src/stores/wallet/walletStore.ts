import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useWalletApi } from "@/api/modules/wallet/useWalletApi";
import type {
  VirtualWalletResponse,
  LedgerEntryResponse,
  WalletLedgerPaginationQuery,
} from "@/api/modules/wallet/types";

export interface WalletRechargeDraft {
  amount: number | null;
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

  const wallet = ref<VirtualWalletResponse | null>(null);
  const ledgerEntries = ref<LedgerEntryResponse[]>([]);
  const totalLedger = ref<number>(0);

  const isLoading = ref<boolean>(false);
  const isLedgerLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const defaultRechargeDraft = (): WalletRechargeDraft => ({
    amount: 2000,
    bank: "lafise",
    bankName: "Banco Lafise",
    accountNumber: "1234-5678-9012",
    accountType: "Cuenta Corriente - C$",
    referenceNumber: "1234567",
    depositDate: new Date().toISOString().split("T")[0],
    depositorName: "",
    depositTime: new Date().toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit" }),
    voucherFile: null,
    voucherFileName: "",
    voucherPreviewUrl: null,
  });

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

  function setRechargeDraft(data: Partial<WalletRechargeDraft>) {
    rechargeDraft.value = { ...rechargeDraft.value, ...data };
  }

  function reset() {
    wallet.value = null;
    ledgerEntries.value = [];
    totalLedger.value = 0;
    isLoading.value = false;
    isLedgerLoading.value = false;
    error.value = null;
    rechargeDraft.value = defaultRechargeDraft();
  }

  return {
    wallet,
    ledgerEntries,
    totalLedger,
    isLoading,
    isLedgerLoading,
    error,
    balance,
    formattedBalance,
    rechargeDraft,
    setRechargeDraft,
    fetchWallet,
    fetchLedger,
    reset,
  };
});
