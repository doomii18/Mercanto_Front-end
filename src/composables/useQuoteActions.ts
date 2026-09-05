import { ref, computed, type Ref } from "vue";
import { quoteApi } from "@/api";
import { useUserContextStore } from "@/stores/userContextStore";
import { useToastStore } from "@/stores/toastStore";
import type {
  QuoteAggregateResponse,
  QuoteStatus,
} from "@/api/services/quote/types";

export type QuoteActionType =
  | "accept"
  | "reject"
  | "pay"
  | "fulfill"
  | "cancel";

export interface QuoteAction {
  type: QuoteActionType;
  label: string;
  icon: string;
  variant: "success" | "danger" | "primary" | "neutral";
  confirmTitle: string;
  confirmDescription: string;
  confirmText: string;
}

interface UseQuoteActionsOptions {
  onReload?: () => Promise<void> | void;
}

export function useQuoteActions(
  quoteAggregate: Ref<QuoteAggregateResponse | null>,
  options: UseQuoteActionsOptions = {},
) {
  const contextStore = useUserContextStore();
  const toastStore = useToastStore();

  const isProcessing = ref(false);
  const processingAction = ref<QuoteActionType | null>(null);

  const isProvider = computed(() => contextStore.isProvider);
  const status = computed<QuoteStatus | null>(
    () => quoteAggregate.value?.quote.status ?? null,
  );
  const quoteId = computed(() => quoteAggregate.value?.quote.id ?? null);

  const availableActions = computed<QuoteAction[]>(() => {
    const currentStatus = status.value;
    if (!currentStatus) return [];

    if (
      currentStatus === "fulfilled" ||
      currentStatus === "rejected" ||
      currentStatus === "cancelled"
    ) {
      return [];
    }

    const actions: QuoteAction[] = [];

    if (currentStatus === "pending_provider") {
      if (isProvider.value) {
        actions.push({
          type: "accept",
          label: "Aceptar pedido",
          icon: "fa-solid fa-check",
          variant: "success",
          confirmTitle: "¿Aceptar este pedido?",
          confirmDescription:
            "Confirmarás los detalles y disponibilidad del pedido para el comprador.",
          confirmText: "Aceptar pedido",
        });
        actions.push({
          type: "reject",
          label: "Rechazar",
          icon: "fa-solid fa-xmark",
          variant: "danger",
          confirmTitle: "¿Rechazar este pedido?",
          confirmDescription:
            "El comprador será notificado del rechazo. Esta acción no se puede deshacer.",
          confirmText: "Rechazar pedido",
        });
      } else {
        actions.push({
          type: "cancel",
          label: "Cancelar pedido",
          icon: "fa-solid fa-ban",
          variant: "neutral",
          confirmTitle: "¿Cancelar tu pedido?",
          confirmDescription:
            "El proveedor será notificado. Esta acción no se puede deshacer.",
          confirmText: "Sí, cancelar",
        });
      }
    } else if (currentStatus === "accepted") {
      if (!isProvider.value) {
        actions.push({
          type: "pay",
          label: "Pagar ahora",
          icon: "fa-solid fa-credit-card",
          variant: "primary",
          confirmTitle: "¿Confirmar el pago?",
          confirmDescription:
            "Se realizará el cobro mediante tu método de pago preferido.",
          confirmText: "Confirmar pago",
        });
      }
      actions.push({
        type: "cancel",
        label: "Cancelar pedido",
        icon: "fa-solid fa-ban",
        variant: "neutral",
        confirmTitle: "¿Cancelar este pedido?",
        confirmDescription:
          "Ambas partes serán notificadas. Esta acción no se puede deshacer.",
        confirmText: "Sí, cancelar",
      });
    } else if (currentStatus === "paid") {
      if (isProvider.value) {
        actions.push({
          type: "fulfill",
          label: "Marcar como entregado",
          icon: "fa-solid fa-truck",
          variant: "success",
          confirmTitle: "¿Confirmar la entrega?",
          confirmDescription:
            "Marca este pedido como recibido por el comprador. Se cerrará el ciclo de la cotización.",
          confirmText: "Confirmar entrega",
        });
      }
      actions.push({
        type: "cancel",
        label: "Cancelar pedido",
        icon: "fa-solid fa-ban",
        variant: "neutral",
        confirmTitle: "¿Cancelar este pedido pagado?",
        confirmDescription:
          "Se iniciará el proceso de reembolso al comprador.",
        confirmText: "Sí, cancelar",
      });
    }

    return actions;
  });

  async function executeAction(action: QuoteAction): Promise<boolean> {
    if (!quoteId.value) {
      toastStore.addToast({
        title: "Error",
        message: "No se pudo identificar el pedido.",
        icon: "fa-solid fa-circle-exclamation",
        variant: "error",
      });
      return false;
    }

    isProcessing.value = true;
    processingAction.value = action.type;

    try {
      switch (action.type) {
        case "accept":
          await quoteApi.acceptQuote(quoteId.value);
          break;
        case "reject":
          await quoteApi.rejectQuote(quoteId.value);
          break;
        case "pay":
          await quoteApi.payQuote(quoteId.value);
          break;
        case "fulfill":
          await quoteApi.fulfillQuote(quoteId.value);
          break;
        case "cancel":
          await quoteApi.cancelQuote(quoteId.value);
          break;
      }

      toastStore.addToast({
        title: "Pedido actualizado",
        message: getSuccessMessage(action.type),
        icon: "fa-solid fa-circle-check",
        variant: "success",
      });

      if (options.onReload) {
        await options.onReload();
      }

      return true;
    } catch (err: any) {
      console.error(
        `[useQuoteActions] Failed to ${action.type} quote ${quoteId.value}:`,
        err,
      );
      toastStore.addToast({
        title: "No se pudo completar la acción",
        message:
          err?.message || "Ocurrió un error inesperado. Intenta nuevamente.",
        icon: "fa-solid fa-circle-exclamation",
        variant: "error",
      });
      return false;
    } finally {
      isProcessing.value = false;
      processingAction.value = null;
    }
  }

  function getSuccessMessage(type: QuoteActionType): string {
    switch (type) {
      case "accept":
        return "El pedido ha sido aceptado.";
      case "reject":
        return "El pedido ha sido rechazado.";
      case "pay":
        return "El pago se ha registrado correctamente.";
      case "fulfill":
        return "El pedido ha sido marcado como entregado.";
      case "cancel":
        return "El pedido ha sido cancelado.";
    }
  }

  function isActionProcessing(type: QuoteActionType): boolean {
    return isProcessing.value && processingAction.value === type;
  }

  return {
    availableActions,
    executeAction,
    isProcessing,
    processingAction,
    isActionProcessing,
    isProvider,
    status,
  };
}
