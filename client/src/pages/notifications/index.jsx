import { useEffect, useState } from "react";
import { useLanguage } from "@/context/language-context";
import { useToast } from "@/hooks/use-toast";
import {
  getNotificationsService,
  markNotificationReadService,
  markAllNotificationsReadService,
} from "@/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function NotificationsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const response = await getNotificationsService();
      if (response?.success) {
        setNotifications(response.data || []);
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("notifications.loadError") || "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(notificationId) {
    try {
      const response = await markNotificationReadService(notificationId);
      if (response?.success) {
        setNotifications((prev) =>
          prev.map((item) =>
            item._id === notificationId ? { ...item, isRead: true } : item
          )
        );
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description:
          t("notifications.readError") || "Failed to update notification",
        variant: "destructive",
      });
    }
  }

  async function handleMarkAllRead() {
    try {
      const response = await markAllNotificationsReadService();
      if (response?.success) {
        setNotifications((prev) =>
          prev.map((item) => ({ ...item, isRead: true }))
        );
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description:
          t("notifications.readError") || "Failed to update notification",
        variant: "destructive",
      });
    }
  }

  function formatDate(date) {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {t("notifications.title") || "Notifications"}
        </h1>
        <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
          {t("notifications.markAllRead") || "Mark all read"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("notifications.inbox") || "Inbox"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
            >
              {t("notifications.filterAll") || "All"}
            </Button>
            <Button
              size="sm"
              variant={filter === "unread" ? "default" : "outline"}
              onClick={() => setFilter("unread")}
            >
              {t("notifications.unread") || "Unread"}
            </Button>
            <Button
              size="sm"
              variant={filter === "read" ? "default" : "outline"}
              onClick={() => setFilter("read")}
            >
              {t("notifications.read") || "Read"}
            </Button>
          </div>
          {loading ? (
            <div className="text-center py-8">
              {t("common.loading") || "Loading..."}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("notifications.empty") || "No notifications yet"}
            </div>
          ) : (
            <div className="space-y-4">
              {notifications
                .filter((notification) => {
                  if (filter === "unread") return !notification.isRead;
                  if (filter === "read") return notification.isRead;
                  return true;
                })
                .map((notification) => (
                <div
                  key={notification._id}
                  className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">{notification.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        {notification.body}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={notification.isRead ? "secondary" : "outline"}>
                        {notification.isRead
                          ? t("notifications.read") || "Read"
                          : t("notifications.unread") || "Unread"}
                      </Badge>
                      {!notification.isRead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkRead(notification._id)}
                        >
                          {t("notifications.markRead") || "Mark read"}
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default NotificationsPage;
