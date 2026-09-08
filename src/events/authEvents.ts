import { useEventBus, type EventBusKey } from "@vueuse/core";

export type AuthLifecyclePayload =
  | { type: "session_expired" }
  | { type: "logout" }
  | { type: "login"; accountId: string };

export const authEventKey: EventBusKey<AuthLifecyclePayload> = Symbol("auth-lifecycle");
export const authBus = useEventBus(authEventKey);
