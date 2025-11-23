import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, UserCheck, UserX, Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/language-context";
import { useToast } from "@/hooks/use-toast";
import {
  getAllUsersService,
  updateUserService,
  deleteUserService,
  getUserGrowthStatsService,
} from "@/services";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function AdminUserManagement() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [selectedUser, setSelectedUser] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [growthStats, setGrowthStats] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchGrowthStats();
  }, [page, searchTerm, roleFilter, statusFilter]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter !== "all" && { role: roleFilter }),
        ...(statusFilter !== "all" && { isActive: statusFilter === "active" }),
      };

      const response = await getAllUsersService(params);
      if (response?.success) {
        setUsers(response.data?.users || []);
        setPagination(response.data?.pagination || pagination);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: t("common.error"),
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function fetchGrowthStats() {
    try {
      const response = await getUserGrowthStatsService();
      if (response?.success) {
        setGrowthStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching growth stats:", error);
    }
  }

  async function handleToggleStatus(user) {
    try {
      const response = await updateUserService(user._id, {
        isActive: !user.isActive,
      });

      if (response?.success) {
        toast({
          title: t("common.success"),
          description: `User ${user.isActive ? "deactivated" : "activated"} successfully`,
        });
        fetchUsers();
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  }

  async function handleUpdateUser(userData) {
    try {
      const response = await updateUserService(selectedUser._id, userData);
      if (response?.success) {
        toast({
          title: t("common.success"),
          description: "User updated successfully",
        });
        setEditDialogOpen(false);
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  }

  async function handleDeleteUser(userId) {
    if (!confirm(t("admin.confirmDeleteUser") || "Are you sure you want to deactivate this user?")) {
      return;
    }

    try {
      const response = await deleteUserService(userId);
      if (response?.success) {
        toast({
          title: t("common.success"),
          description: "User deactivated successfully",
        });
        fetchUsers();
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "Failed to deactivate user",
        variant: "destructive",
      });
    }
  }

  function formatDate(date) {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t("admin.userManagement") || "User Management"}</h1>
      </div>

      {/* Growth Statistics */}
      {growthStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.totalUsers") || "Total Users"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{growthStats.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {growthStats.thisMonth ? `+${growthStats.thisMonth} this month` : ""}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.activeUsers") || "Active Users"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{growthStats.active || 0}</div>
              <p className="text-xs text-muted-foreground">
                {growthStats.total ? `${Math.round((growthStats.active / growthStats.total) * 100)}% of total` : ""}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.newUsers") || "New This Month"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{growthStats.thisMonth || 0}</div>
              <p className="text-xs text-muted-foreground">
                {growthStats.lastMonth ? `vs ${growthStats.lastMonth} last month` : ""}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("common.search") || "Search users..."}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={(value) => { setRoleFilter(value); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t("common.role") || "Role"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.allRoles") || "All Roles"}</SelectItem>
                <SelectItem value="user">{t("common.user") || "User"}</SelectItem>
                <SelectItem value="instructor">{t("common.instructor") || "Instructor"}</SelectItem>
                <SelectItem value="admin">{t("common.admin") || "Admin"}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t("admin.status") || "Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.allStatuses") || "All Statuses"}</SelectItem>
                <SelectItem value="active">{t("admin.active") || "Active"}</SelectItem>
                <SelectItem value="inactive">{t("admin.inactive") || "Inactive"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.usersList") || "Users List"}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">{t("common.loading") || "Loading..."}</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("admin.noUsersFound") || "No users found"}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.userName") || "Name"}</TableHead>
                      <TableHead>{t("common.email") || "Email"}</TableHead>
                      <TableHead>{t("common.role") || "Role"}</TableHead>
                      <TableHead>{t("admin.status") || "Status"}</TableHead>
                      <TableHead>{t("admin.lastLogin") || "Last Login"}</TableHead>
                      <TableHead>{t("admin.createdAt") || "Created"}</TableHead>
                      <TableHead className="text-right">{t("common.actions") || "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">
                          {user.profile?.firstName && user.profile?.lastName
                            ? `${user.profile.firstName} ${user.profile.lastName}`
                            : user.userName}
                        </TableCell>
                        <TableCell>{user.userEmail}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "default" : "destructive"}>
                            {user.isActive ? t("admin.active") || "Active" : t("admin.inactive") || "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.lastLogin)}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(user)}
                            >
                              {user.isActive ? (
                                <UserX className="h-4 w-4 text-red-500" />
                              ) : (
                                <UserCheck className="h-4 w-4 text-green-500" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user._id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    {t("admin.showing") || "Showing"} {(page - 1) * pagination.limit + 1} - {Math.min(page * pagination.limit, pagination.total)} {t("admin.of") || "of"} {pagination.total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      {t("common.previous") || "Previous"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                      disabled={page === pagination.pages}
                    >
                      {t("common.next") || "Next"}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.editUser") || "Edit User"}</DialogTitle>
            <DialogDescription>
              {t("admin.updateUserDetails") || "Update user details and status"}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <EditUserForm
              user={selectedUser}
              onSave={handleUpdateUser}
              onCancel={() => {
                setEditDialogOpen(false);
                setSelectedUser(null);
              }}
              t={t}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditUserForm({ user, onSave, onCancel, t }) {
  const [formData, setFormData] = useState({
    role: user.role,
    isActive: user.isActive,
  });

  function handleSubmit(e) {
    e.preventDefault();
    onSave(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">{t("common.role") || "Role"}</label>
        <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">{t("common.user") || "User"}</SelectItem>
            <SelectItem value="instructor">{t("common.instructor") || "Instructor"}</SelectItem>
            <SelectItem value="admin">{t("common.admin") || "Admin"}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded"
          />
          {t("admin.active") || "Active"}
        </label>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel") || "Cancel"}
        </Button>
        <Button type="submit">{t("common.save") || "Save"}</Button>
      </DialogFooter>
    </form>
  );
}

export default AdminUserManagement;

