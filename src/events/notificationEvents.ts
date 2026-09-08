import { useEventBus } from "@vueuse/core";
import type { NotificationEvent } from "@/api/services/notifications/types";

export const notificationBus = useEventBus<NotificationEvent>("mercanto_notifications");
