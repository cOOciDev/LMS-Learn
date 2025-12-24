import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/language-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createAdminMessageService, getAdminMessagesService } from "@/services";

function AdminMessagesPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [newMessage, setNewMessage] = useState({
    subject: "",
    body: "",
    targetRole: "user",
    recipientEmail: "",
    recipientEmails: "",
  });
  const [audienceMode, setAudienceMode] = useState("role");
  const [lastSentCount, setLastSentCount] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    setLoading(true);
    try {
      const response = await getAdminMessagesService({ page: 1, limit: 50 });
      if (response?.success) {
        setMessages(response.data || []);
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      const matchStatus =
        filter === "all" ||
        (filter === "unread" && !message.isRead) ||
        (filter === "read" && message.isRead);
      const recipientEmail = message.recipientUserId?.userEmail || "";
      const recipientName = message.recipientUserId?.userName || "";
      const matchSearch =
        search === "" ||
        message.subject.toLowerCase().includes(search.toLowerCase()) ||
        recipientEmail.toLowerCase().includes(search.toLowerCase()) ||
        recipientName.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [messages, filter, search]);

  async function handleAddMessage(e) {
    e.preventDefault();
    if (!newMessage.subject || !newMessage.body) {
      return;
    }
    try {
      const rawEmails = newMessage.recipientEmails
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const hasSpecificEmail =
        newMessage.recipientEmail || rawEmails.length > 0;
      const payload = {
        subject: newMessage.subject,
        body: newMessage.body,
        targetRole: hasSpecificEmail ? undefined : newMessage.targetRole,
        recipientEmail: newMessage.recipientEmail || undefined,
        recipientEmails: rawEmails.length ? rawEmails : undefined,
      };
      const response = await createAdminMessageService(payload);
      if (response?.success) {
        setLastSentCount(response.data?.count ?? null);
        toast({
          title: t("common.success"),
          description: response.message || "Message sent",
        });
        setNewMessage({
          subject: "",
          body: "",
          targetRole: "user",
          recipientEmail: "",
          recipientEmails: "",
        });
        fetchMessages();
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description:
          error.response?.data?.message || "Failed to send message",
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
          {t("admin.messages") || "Messages"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.addNote") || "Send Message"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleAddMessage}>
            <div className="grid gap-3 md:grid-cols-2">
              <Select
                value={audienceMode}
                onValueChange={setAudienceMode}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("admin.audience") || "Audience"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="role">
                    {t("admin.audienceByRole") || "By role"}
                  </SelectItem>
                  <SelectItem value="specific">
                    {t("admin.audienceSpecific") || "Specific users"}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                disabled={audienceMode !== "role"}
                value={newMessage.targetRole}
                onValueChange={(value) =>
                  setNewMessage({ ...newMessage, targetRole: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("common.role") || "Role"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{t("common.user") || "User"}</SelectItem>
                  <SelectItem value="instructor">
                    {t("common.instructor") || "Instructor"}
                  </SelectItem>
                  <SelectItem value="all">
                    {t("admin.allRoles") || "All Roles"}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input
                disabled={audienceMode !== "specific"}
                placeholder={
                  t("admin.recipientEmail") ||
                  "Recipient email (optional)"
                }
                value={newMessage.recipientEmail}
                onChange={(e) =>
                  setNewMessage({
                    ...newMessage,
                    recipientEmail: e.target.value,
                  })
                }
              />
            </div>
            {audienceMode === "specific" && (
              <Textarea
                placeholder={
                  t("admin.recipientEmails") ||
                  "Comma-separated emails"
                }
                value={newMessage.recipientEmails}
                onChange={(e) =>
                  setNewMessage({
                    ...newMessage,
                    recipientEmails: e.target.value,
                  })
                }
              />
            )}
            <Input
              placeholder={t("common.subject") || "Subject"}
              value={newMessage.subject}
              onChange={(e) =>
                setNewMessage({ ...newMessage, subject: e.target.value })
              }
            />
            <Textarea
              placeholder={t("common.message") || "Message"}
              value={newMessage.body}
              onChange={(e) =>
                setNewMessage({ ...newMessage, body: e.target.value })
              }
            />
            <Button type="submit">{t("common.add") || "Add"}</Button>
          </form>
          {lastSentCount !== null && (
            <p className="mt-3 text-sm text-muted-foreground">
              {t("admin.lastDelivery") || "Last delivery"}: {lastSentCount}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder={t("common.search") || "Search messages..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t("admin.status") || "Filter"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("admin.allStatuses") || "All"}
                </SelectItem>
                <SelectItem value="unread">
                  {t("admin.statusUnread") || "Unread"}
                </SelectItem>
                <SelectItem value="read">
                  {t("admin.statusRead") || "Read"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.inbox") || "Inbox"}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              {t("common.loading") || "Loading..."}
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("admin.noMessages") || "No messages found"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.subject") || "Subject"}</TableHead>
                    <TableHead>{t("common.email") || "Recipient"}</TableHead>
                    <TableHead>{t("common.date") || "Date"}</TableHead>
                    <TableHead>{t("admin.status") || "Status"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.map((message) => (
                    <TableRow key={message._id}>
                      <TableCell>
                        <div className="font-semibold">{message.subject}</div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {message.body}
                        </p>
                      </TableCell>
                      <TableCell>
                        {message.recipientUserId?.userEmail ||
                          t("admin.noRecipient") ||
                          "N/A"}
                      </TableCell>
                      <TableCell>{formatDate(message.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant={message.isRead ? "secondary" : "outline"}>
                          {message.isRead
                            ? t("admin.statusRead") || "Read"
                            : t("admin.statusUnread") || "Unread"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminMessagesPage;
