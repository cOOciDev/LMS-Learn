import { useEffect, useState } from "react";
import { useLanguage } from "@/context/language-context";
import { useToast } from "@/hooks/use-toast";
import { getAllInstructorsService, updateInstructorService } from "@/services";
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
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

function AdminInstructorManagement() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  useEffect(() => {
    fetchInstructors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm]);

  async function fetchInstructors() {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
      };
      const response = await getAllInstructorsService(params);
      if (response?.success) {
        setInstructors(response.data?.instructors || []);
        setPagination(response.data?.pagination || pagination);
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "Failed to load instructors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(instructor) {
    try {
      const response = await updateInstructorService(instructor._id, {
        isActive: !instructor.isActive,
      });
      if (response?.success) {
        toast({
          title: t("common.success"),
          description: "Instructor updated successfully",
        });
        fetchInstructors();
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "Failed to update instructor",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {t("admin.instructorManagement") || "Instructor Management"}
        </h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("common.search") || "Search instructors..."}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("admin.instructorsList") || "Instructors List"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              {t("common.loading") || "Loading..."}
            </div>
          ) : instructors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("admin.noInstructorsFound") || "No instructors found"}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.userName") || "Name"}</TableHead>
                      <TableHead>{t("common.email") || "Email"}</TableHead>
                      <TableHead>{t("admin.status") || "Status"}</TableHead>
                      <TableHead className="text-right">
                        {t("common.actions") || "Actions"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instructors.map((instructor) => (
                      <TableRow key={instructor._id}>
                        <TableCell className="font-medium">
                          {instructor.profile?.firstName &&
                          instructor.profile?.lastName
                            ? `${instructor.profile.firstName} ${instructor.profile.lastName}`
                            : instructor.userName}
                        </TableCell>
                        <TableCell>{instructor.userEmail}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              instructor.isActive ? "default" : "destructive"
                            }
                          >
                            {instructor.isActive
                              ? t("admin.active") || "Active"
                              : t("admin.inactive") || "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(instructor)}
                          >
                            {instructor.isActive
                              ? t("admin.deactivate") || "Deactivate"
                              : t("admin.activate") || "Activate"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    {t("admin.showing") || "Showing"}{" "}
                    {(page - 1) * pagination.limit + 1} -{" "}
                    {Math.min(page * pagination.limit, pagination.total)}{" "}
                    {t("admin.of") || "of"} {pagination.total}
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
                      onClick={() =>
                        setPage((p) => Math.min(pagination.pages, p + 1))
                      }
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
    </div>
  );
}

export default AdminInstructorManagement;
