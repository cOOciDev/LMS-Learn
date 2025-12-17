import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAllTicketsService,
  getTicketStatsService,
  getAdminTicketByIdService,
  addAdminReplyService,
  updateTicketStatusService,
  assignTicketService,
} from "@/services";
import { useLanguage } from "@/context/language-context";
import { toast } from "sonner";
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Filter,
} from "lucide-react";

// Date formatting helper
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

function AdminHelpCenterPage() {
  const { t } = useLanguage();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    page: 1,
    limit: 20,
  });
  const [newReply, setNewReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    loadTickets();
    loadStats();
  }, [filters.status, filters.priority]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status !== "all") params.status = filters.status;
      if (filters.priority !== "all") params.priority = filters.priority;
      params.page = filters.page;
      params.limit = filters.limit;

      const response = await getAllTicketsService(params);
      if (response.success) {
        setTickets(response.data || []);
      }
    } catch (error) {
      toast.error(t("helpCenter.errorLoading") || "Error loading tickets");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getTicketStatsService();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleSelectTicket = async (ticketId) => {
    try {
      const response = await getAdminTicketByIdService(ticketId);
      if (response.success) {
        setSelectedTicket(response.data);
      }
    } catch (error) {
      toast.error(t("helpCenter.errorLoading") || "Error loading ticket");
    }
  };

  const handleSendReply = async () => {
    if (!newReply.trim() || !selectedTicket) return;

    try {
      setSendingReply(true);
      const response = await addAdminReplyService(selectedTicket._id, newReply);
      if (response.success) {
        setSelectedTicket(response.data);
        setNewReply("");
        loadTickets();
        loadStats();
        toast.success(t("helpCenter.replySent") || "Reply sent successfully");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || t("helpCenter.errorSending") || "Error sending reply"
      );
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async (status, priority) => {
    if (!selectedTicket) return;

    try {
      setUpdatingStatus(true);
      const response = await updateTicketStatusService(selectedTicket._id, status, priority);
      if (response.success) {
        setSelectedTicket(response.data);
        loadTickets();
        loadStats();
        toast.success(t("helpCenter.statusUpdated") || "Status updated successfully");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || t("helpCenter.errorUpdating") || "Error updating status"
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignTicket = async () => {
    if (!selectedTicket) return;

    try {
      const response = await assignTicketService(selectedTicket._id);
      if (response.success) {
        setSelectedTicket(response.data);
        loadTickets();
        toast.success(t("helpCenter.assigned") || "Ticket assigned successfully");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || t("helpCenter.errorAssigning") || "Error assigning ticket"
      );
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      open: { label: t("helpCenter.statusOpen") || "Open", variant: "default" },
      "in-progress": {
        label: t("helpCenter.statusInProgress") || "In Progress",
        variant: "secondary",
      },
      resolved: {
        label: t("helpCenter.statusResolved") || "Resolved",
        variant: "outline",
      },
      closed: { label: t("helpCenter.statusClosed") || "Closed", variant: "destructive" },
    };
    return statusMap[status] || statusMap.open;
  };

  const getPriorityBadge = (priority) => {
    const priorityMap = {
      low: { label: t("helpCenter.priorityLow") || "Low", variant: "outline" },
      medium: { label: t("helpCenter.priorityMedium") || "Medium", variant: "default" },
      high: { label: t("helpCenter.priorityHigh") || "High", variant: "secondary" },
      urgent: { label: t("helpCenter.priorityUrgent") || "Urgent", variant: "destructive" },
    };
    return priorityMap[priority] || priorityMap.medium;
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t("helpCenter.title") || "Help Center"}</h1>
        <p className="text-muted-foreground mt-1">
          {t("helpCenter.description") || "Manage and respond to user support tickets"}
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("helpCenter.totalTickets") || "Total Tickets"}
                  </p>
                  <p className="text-2xl font-bold">{stats.total || 0}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("helpCenter.open") || "Open"}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">{stats.open || 0}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("helpCenter.inProgress") || "In Progress"}
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.inProgress || 0}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("helpCenter.urgent") || "Urgent"}
                  </p>
                  <p className="text-2xl font-bold text-red-600">{stats.urgent || 0}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                {t("helpCenter.tickets") || "Tickets"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="space-y-2">
                <Label>{t("helpCenter.filterByStatus") || "Status"}</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("helpCenter.all") || "All"}</SelectItem>
                    <SelectItem value="open">{t("helpCenter.statusOpen") || "Open"}</SelectItem>
                    <SelectItem value="in-progress">
                      {t("helpCenter.statusInProgress") || "In Progress"}
                    </SelectItem>
                    <SelectItem value="resolved">
                      {t("helpCenter.statusResolved") || "Resolved"}
                    </SelectItem>
                    <SelectItem value="closed">{t("helpCenter.statusClosed") || "Closed"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("helpCenter.filterByPriority") || "Priority"}</Label>
                <Select
                  value={filters.priority}
                  onValueChange={(value) => setFilters({ ...filters, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("helpCenter.all") || "All"}</SelectItem>
                    <SelectItem value="low">{t("helpCenter.priorityLow") || "Low"}</SelectItem>
                    <SelectItem value="medium">{t("helpCenter.priorityMedium") || "Medium"}</SelectItem>
                    <SelectItem value="high">{t("helpCenter.priorityHigh") || "High"}</SelectItem>
                    <SelectItem value="urgent">{t("helpCenter.priorityUrgent") || "Urgent"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tickets List */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : tickets.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {t("helpCenter.noTickets") || "No tickets found"}
                  </p>
                ) : (
                  tickets.map((ticket) => {
                    const statusBadge = getStatusBadge(ticket.status);
                    const priorityBadge = getPriorityBadge(ticket.priority);
                    const isSelected = selectedTicket?._id === ticket._id;

                    return (
                      <Card
                        key={ticket._id}
                        className={`cursor-pointer transition-all ${
                          isSelected ? "ring-2 ring-primary" : "hover:shadow-md"
                        }`}
                        onClick={() => handleSelectTicket(ticket._id)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-sm line-clamp-2">
                                {ticket.subject}
                              </h4>
                              {ticket.unreadCount > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {ticket.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant={statusBadge.variant} className="text-xs">
                                {statusBadge.label}
                              </Badge>
                              <Badge variant={priorityBadge.variant} className="text-xs">
                                {priorityBadge.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User className="w-3 h-3" />
                              <span>{ticket.userName}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(ticket.lastMessageAt)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ticket Detail */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 mb-2">
                      {selectedTicket.subject}
                      <Badge variant={getStatusBadge(selectedTicket.status).variant}>
                        {getStatusBadge(selectedTicket.status).label}
                      </Badge>
                      <Badge variant={getPriorityBadge(selectedTicket.priority).variant}>
                        {getPriorityBadge(selectedTicket.priority).label}
                      </Badge>
                    </CardTitle>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        {t("helpCenter.user") || "User"}: {selectedTicket.userName} (
                        {selectedTicket.userEmail})
                      </p>
                      <p>
                        {t("helpCenter.createdAt") || "Created"}:{" "}
                        {formatDate(selectedTicket.createdAt)}
                      </p>
                    </div>
                  </div>
                  {!selectedTicket.assignedTo && (
                    <Button size="sm" variant="outline" onClick={handleAssignTicket}>
                      {t("helpCenter.assignToMe") || "Assign to Me"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Messages */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto border rounded-lg p-4">
                  {selectedTicket.messages?.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.senderRole === "admin" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.senderRole === "admin"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
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
                        <p className="text-xs opacity-70 mt-1">{formatDate(msg.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Section */}
                {selectedTicket.status !== "closed" && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label>{t("helpCenter.reply") || "Reply"}</Label>
                      <Textarea
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        placeholder={t("helpCenter.replyPlaceholder") || "Type your reply..."}
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSendReply}
                          disabled={!newReply.trim() || sendingReply}
                          className="flex-1"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {sendingReply
                            ? t("common.loading") || "Sending..."
                            : t("helpCenter.sendReply") || "Send Reply"}
                        </Button>
                      </div>
                    </div>

                    {/* Status Controls */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>{t("helpCenter.updateStatus") || "Status"}</Label>
                        <Select
                          value={selectedTicket.status}
                          onValueChange={(value) => handleUpdateStatus(value, null)}
                          disabled={updatingStatus}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">{t("helpCenter.statusOpen") || "Open"}</SelectItem>
                            <SelectItem value="in-progress">
                              {t("helpCenter.statusInProgress") || "In Progress"}
                            </SelectItem>
                            <SelectItem value="resolved">
                              {t("helpCenter.statusResolved") || "Resolved"}
                            </SelectItem>
                            <SelectItem value="closed">
                              {t("helpCenter.statusClosed") || "Closed"}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("helpCenter.updatePriority") || "Priority"}</Label>
                        <Select
                          value={selectedTicket.priority}
                          onValueChange={(value) => handleUpdateStatus(null, value)}
                          disabled={updatingStatus}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">{t("helpCenter.priorityLow") || "Low"}</SelectItem>
                            <SelectItem value="medium">
                              {t("helpCenter.priorityMedium") || "Medium"}
                            </SelectItem>
                            <SelectItem value="high">
                              {t("helpCenter.priorityHigh") || "High"}
                            </SelectItem>
                            <SelectItem value="urgent">
                              {t("helpCenter.priorityUrgent") || "Urgent"}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">
                  {t("helpCenter.selectTicket") || "Select a ticket to view details"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminHelpCenterPage;
