import { useEventBus } from "@vueuse/core";
import type { NotificationEvent } from "@/api";

export const notificationBus = useEventBus<NotificationEvent>("mercanto_notifications");
