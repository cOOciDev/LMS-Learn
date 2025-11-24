import { useEffect, useState } from "react";
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

const initialMessages = [
  {
    id: 1,
    sender: "student@test.com",
    subject: "Issue with video playback",
    body: "I cannot play lesson 3 of the React course.",
    status: "open",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    sender: "instructor@test.com",
    subject: "Need help publishing course",
    body: "My new course is stuck in draft status.",
    status: "in_progress",
    createdAt: new Date().toISOString(),
  },
];

function AdminMessagesPage() {
  const { t } = useLanguage();
  const [messages, setMessages] = useState(() => {
    const stored = localStorage.getItem("adminMessages");
    return stored ? JSON.parse(stored) : initialMessages;
  });
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [newMessage, setNewMessage] = useState({
    sender: "",
    subject: "",
    body: "",
  });

  useEffect(() => {
    localStorage.setItem("adminMessages", JSON.stringify(messages));
  }, [messages]);

  function filteredMessages() {
    return messages.filter((message) => {
      const matchStatus = filter === "all" || message.status === filter;
      const matchSearch =
        search === "" ||
        message.subject.toLowerCase().includes(search.toLowerCase()) ||
        message.sender.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }

  function handleStatusChange(id, status) {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, status } : msg))
    );
  }

  function handleAddMessage(e) {
    e.preventDefault();
    if (!newMessage.sender || !newMessage.subject || !newMessage.body) return;
    const payload = {
      ...newMessage,
      id: Date.now(),
      status: "open",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [payload, ...prev]);
    setNewMessage({ sender: "", subject: "", body: "" });
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
          <CardTitle>{t("admin.addNote") || "Add Note"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleAddMessage}>
            <Input
              placeholder={t("common.email") || "Email"}
              value={newMessage.sender}
              onChange={(e) =>
                setNewMessage({ ...newMessage, sender: e.target.value })
              }
            />
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
                <SelectItem value="open">{t("admin.open") || "Open"}</SelectItem>
                <SelectItem value="in_progress">
                  {t("admin.inProgress") || "In Progress"}
                </SelectItem>
                <SelectItem value="resolved">
                  {t("admin.resolved") || "Resolved"}
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.subject") || "Subject"}</TableHead>
                  <TableHead>{t("common.email") || "Sender"}</TableHead>
                  <TableHead>{t("common.date") || "Date"}</TableHead>
                  <TableHead>{t("admin.status") || "Status"}</TableHead>
                  <TableHead className="text-right">
                    {t("common.actions") || "Actions"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages().map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>
                      <div className="font-semibold">{message.subject}</div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {message.body}
                      </p>
                    </TableCell>
                    <TableCell>{message.sender}</TableCell>
                    <TableCell>{formatDate(message.createdAt)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          message.status === "resolved"
                            ? "default"
                            : message.status === "in_progress"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {message.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={message.status}
                        onValueChange={(value) =>
                          handleStatusChange(message.id, value)
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">
                            {t("admin.open") || "Open"}
                          </SelectItem>
                          <SelectItem value="in_progress">
                            {t("admin.inProgress") || "In Progress"}
                          </SelectItem>
                          <SelectItem value="resolved">
                            {t("admin.resolved") || "Resolved"}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminMessagesPage;
