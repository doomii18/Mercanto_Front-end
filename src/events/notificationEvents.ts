import { useEventBus } from "@vueuse/core";
import type { NotificationEvent } from "@/api/modules/notifications/types";

export const notificationBus = useEventBus<NotificationEvent>("mercanto_notifications");
