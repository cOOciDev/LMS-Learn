import { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createTicketService,
  getUserTicketsService,
  getTicketByIdService,
  addMessageToTicketService,
  closeTicketService,
} from "@/services";
import { useLanguage } from "@/context/language-context";
import { toast } from "sonner";
import { MessageSquare, Plus, Send, X, Clock, CheckCircle2 } from "lucide-react";
// Date formatting helper
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

function StudentTicketsPage() {
  const { t } = useLanguage();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Create ticket form
  const [createForm, setCreateForm] = useState({
    subject: "",
    message: "",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [selectedStatus]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const status = selectedStatus === "all" ? null : selectedStatus;
      const response = await getUserTicketsService(status);
      if (response.success) {
        setTickets(response.data || []);
      }
    } catch (error) {
      toast.error(t("tickets.errorLoading") || "Error loading tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!createForm.subject.trim() || !createForm.message.trim()) {
      toast.error(t("tickets.fillAllFields") || "Please fill all fields");
      return;
    }

    try {
      setCreating(true);
      const response = await createTicketService(createForm);
      if (response.success) {
        toast.success(t("tickets.createdSuccess") || "Ticket created successfully");
        setIsCreateDialogOpen(false);
        setCreateForm({ subject: "", message: "" });
        loadTickets();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || t("tickets.errorCreating") || "Error creating ticket"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleOpenTicket = async (ticketId) => {
    try {
      const response = await getTicketByIdService(ticketId);
      if (response.success) {
        setSelectedTicket(response.data);
        setIsTicketDialogOpen(true);
      }
    } catch (error) {
      toast.error(t("tickets.errorLoading") || "Error loading ticket");
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      setSendingMessage(true);
      const response = await addMessageToTicketService(selectedTicket._id, newMessage);
      if (response.success) {
        setSelectedTicket(response.data);
        setNewMessage("");
        loadTickets();
        toast.success(t("tickets.messageSent") || "Message sent successfully");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || t("tickets.errorSending") || "Error sending message"
      );
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCloseTicket = async (ticketId) => {
    if (!confirm(t("tickets.confirmClose") || "Are you sure you want to close this ticket?")) {
      return;
    }

    try {
      const response = await closeTicketService(ticketId);
      if (response.success) {
        toast.success(t("tickets.closedSuccess") || "Ticket closed successfully");
        loadTickets();
        if (selectedTicket?._id === ticketId) {
          setIsTicketDialogOpen(false);
          setSelectedTicket(null);
        }
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || t("tickets.errorClosing") || "Error closing ticket"
      );
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      open: { label: t("tickets.statusOpen") || "Open", variant: "default" },
      "in-progress": {
        label: t("tickets.statusInProgress") || "In Progress",
        variant: "secondary",
      },
      resolved: { label: t("tickets.statusResolved") || "Resolved", variant: "outline" },
      closed: { label: t("tickets.statusClosed") || "Closed", variant: "destructive" },
    };
    return statusMap[status] || statusMap.open;
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t("tickets.myTickets") || "My Tickets"}</h1>
          <p className="text-muted-foreground mt-1">
            {t("tickets.description") || "Manage your support tickets"}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t("tickets.createNew") || "Create New Ticket"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{t("tickets.createNew") || "Create New Ticket"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <Label htmlFor="subject">{t("tickets.subject") || "Subject"}</Label>
                <Input
                  id="subject"
                  value={createForm.subject}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, subject: e.target.value })
                  }
                  placeholder={t("tickets.subjectPlaceholder") || "Enter ticket subject"}
                  required
                />
              </div>
              <div>
                <Label htmlFor="message">{t("tickets.message") || "Message"}</Label>
                <Textarea
                  id="message"
                  value={createForm.message}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, message: e.target.value })
                  }
                  placeholder={t("tickets.messagePlaceholder") || "Describe your issue..."}
                  rows={6}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating
                    ? t("common.loading") || "Loading..."
                    : t("tickets.create") || "Create Ticket"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-full">
        <TabsList>
          <TabsTrigger value="all">{t("tickets.all") || "All"}</TabsTrigger>
          <TabsTrigger value="open">{t("tickets.statusOpen") || "Open"}</TabsTrigger>
          <TabsTrigger value="in-progress">
            {t("tickets.statusInProgress") || "In Progress"}
          </TabsTrigger>
          <TabsTrigger value="resolved">{t("tickets.statusResolved") || "Resolved"}</TabsTrigger>
          <TabsTrigger value="closed">{t("tickets.statusClosed") || "Closed"}</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">
                  {t("tickets.noTickets") || "No tickets found"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => {
                const statusBadge = getStatusBadge(ticket.status);
                return (
                  <Card
                    key={ticket._id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleOpenTicket(ticket._id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{ticket.subject}</h3>
                            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                            {ticket.unreadCount > 0 && (
                              <Badge variant="destructive">{ticket.unreadCount}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {t("tickets.createdAt") || "Created"}:{" "}
                            {formatDate(ticket.createdAt)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t("tickets.lastMessage") || "Last message"}:{" "}
                            {formatDate(ticket.lastMessageAt)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTicket(ticket._id);
                          }}
                        >
                          {t("tickets.view") || "View"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Ticket Detail Dialog */}
      <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    {selectedTicket.subject}
                    <Badge variant={getStatusBadge(selectedTicket.status).variant}>
                      {getStatusBadge(selectedTicket.status).label}
                    </Badge>
                  </DialogTitle>
                  {selectedTicket.status !== "closed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCloseTicket(selectedTicket._id)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      {t("tickets.close") || "Close Ticket"}
                    </Button>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="space-y-3">
                  {selectedTicket.messages?.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.senderRole === "admin" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.senderRole === "admin"
                            ? "bg-muted"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{msg.senderName}</span>
                          {msg.senderRole === "admin" && (
                            <Badge variant="outline" className="text-xs">
                              {t("common.admin")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatDate(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedTicket.status !== "closed" && (
                  <div className="border-t pt-4">
                    <div className="space-y-2">
                      <Label>{t("tickets.reply") || "Reply"}</Label>
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={t("tickets.replyPlaceholder") || "Type your message..."}
                        rows={4}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendingMessage}
                        className="w-full"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {sendingMessage
                          ? t("common.loading") || "Sending..."
                          : t("tickets.send") || "Send Message"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default StudentTicketsPage;
