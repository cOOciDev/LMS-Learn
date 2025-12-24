import { useCallback, useEffect, useState } from "react";
import { getUnreadNotificationCountService } from "@/services";

const REFRESH_INTERVAL_MS = 30000;

export function useUnreadNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await getUnreadNotificationCountService();
      if (response?.success) {
        setUnreadCount(response.data?.unreadCount || 0);
      }
    } catch (error) {
      // Keep previous count if fetch fails.
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const timer = setInterval(fetchUnreadCount, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchUnreadCount]);

  return { unreadCount, refreshUnreadCount: fetchUnreadCount };
}
