import { useEventBus, useBroadcastChannel, type EventBusKey } from "@vueuse/core";
import { watch } from "vue";

export type AuthLifecyclePayload =
  | { type: "session_expired"; timestamp?: number }
  | { type: "logout"; timestamp?: number }
  | { type: "login"; accountId: string; timestamp?: number };

export const authEventKey: EventBusKey<AuthLifecyclePayload> = Symbol("auth-lifecycle");
export const authBus = useEventBus(authEventKey);

export const authBroadcastChannel = useBroadcastChannel<AuthLifecyclePayload, AuthLifecyclePayload>({
  name: "mercanto_auth_channel",
});

export function emitAuthEvent(event: AuthLifecyclePayload): void {
  const payload: AuthLifecyclePayload = {
    ...event,
    timestamp: Date.now(),
  };
  authBus.emit(payload);
  if (authBroadcastChannel.isSupported.value) {
    authBroadcastChannel.post(payload);
  }
}

if (authBroadcastChannel.isSupported.value) {
  watch(authBroadcastChannel.data, (incoming) => {
    if (incoming) {
      authBus.emit(incoming);
    }
  });
}

