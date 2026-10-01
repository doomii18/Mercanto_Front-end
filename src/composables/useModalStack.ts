import { ref } from "vue";

const BASE_MODAL_Z_INDEX = 10000;
const BASE_ALERT_Z_INDEX = 20000;
export const TOAST_Z_INDEX = 30000;

let modalCounter = 0;
const activeModals = ref<string[]>([]);

/**
 * Registers an active modal in the global stacking order.
 * Returns a computed z-index ensuring newer dialogs/alerts always render in front.
 */
export function registerModal(id: string, isAlert = false): number {
  modalCounter++;
  // If already in list, remove before pushing to top
  const existingIdx = activeModals.value.indexOf(id);
  if (existingIdx !== -1) {
    activeModals.value.splice(existingIdx, 1);
  }
  activeModals.value.push(id);
  document.body.style.overflow = "hidden";

  const base = isAlert ? BASE_ALERT_Z_INDEX : BASE_MODAL_Z_INDEX;
  return base + modalCounter * 10;
}

/**
 * Unregisters a modal when closed or unmounted.
 * Restores body scroll only when all open modals are closed.
 */
export function unregisterModal(id: string): void {
  const index = activeModals.value.indexOf(id);
  if (index !== -1) {
    activeModals.value.splice(index, 1);
  }
  if (activeModals.value.length === 0) {
    modalCounter = 0;
    document.body.style.overflow = "";
  }
}

/**
 * Checks whether this modal is currently the topmost modal in the stack.
 */
export function isTopModal(id: string): boolean {
  if (activeModals.value.length === 0) return false;
  return activeModals.value[activeModals.value.length - 1] === id;
}

/**
 * Checks if there is at least one active modal.
 */
export function hasActiveModals(): boolean {
  return activeModals.value.length > 0;
}
