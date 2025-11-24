import { useEffect, useState } from "react";
import { useLanguage } from "@/context/language-context";
import { useToast } from "@/hooks/use-toast";
import {
  getAllInstructorsService,
  getInstructorDetailsService,
  updateInstructorService,
} from "@/services";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, BookOpen, Users, UserCheck } from "lucide-react";

function AdminInstructorManagement() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [instructors, setInstructors] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [selectedInstructorDetails, setSelectedInstructorDetails] =
    useState(null);

  useEffect(() => {
    fetchInstructors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, statusFilter]);

  async function fetchInstructors() {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { isActive: statusFilter === "active" }),
      };
      const response = await getAllInstructorsService(params);
      if (response?.success) {
        setInstructors(response.data?.instructors || []);
        setStats(response.data?.stats);
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

  async function handleViewDetails(instructor) {
    setSelectedInstructor(instructor);
    try {
      const response = await getInstructorDetailsService(instructor._id);
      if (response?.success) {
        setSelectedInstructorDetails(response.data);
        setDetailsDialogOpen(true);
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "Failed to load instructor details",
        variant: "destructive",
      });
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

  function formatDate(date) {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {t("admin.instructorManagement") || "Instructor Management"}
        </h1>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("admin.totalInstructors") || "Total Instructors"}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalInstructors || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("admin.active") || "Active"}: {stats.activeInstructors || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("admin.totalCourses") || "Total Courses"}
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalCourses || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("admin.published") || "Published"}:{" "}
                {stats.publishedCourses || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("admin.totalStudents") || "Total Students"}
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalStudents || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("admin.enrolledAcrossCourses") || "Across all courses"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue
                  placeholder={t("admin.status") || "Status Filter"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("admin.allStatuses") || "All Statuses"}
                </SelectItem>
                <SelectItem value="active">
                  {t("admin.active") || "Active"}
                </SelectItem>
                <SelectItem value="inactive">
                  {t("admin.inactive") || "Inactive"}
                </SelectItem>
              </SelectContent>
            </Select>
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
                      <TableHead>
                        {t("admin.courses") || "Courses"}
                      </TableHead>
                      <TableHead>
                        {t("admin.students") || "Students"}
                      </TableHead>
                      <TableHead>
                        {t("admin.averageRating") || "Avg. Rating"}
                      </TableHead>
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
                          <span className="font-semibold">
                            {instructor.totalCourses || 0}
                          </span>{" "}
                          ({t("admin.published") || "Published"}:{" "}
                          {instructor.publishedCourses || 0})
                        </TableCell>
                        <TableCell>{instructor.totalStudents || 0}</TableCell>
                        <TableCell>
                          {(instructor.ratingAverage || 0).toFixed(2)}
                        </TableCell>
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
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(instructor)}
                            >
                              {t("common.view") || "View"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(instructor)}
                            >
                              {instructor.isActive
                                ? t("admin.deactivate") || "Deactivate"
                                : t("admin.activate") || "Activate"}
                            </Button>
                          </div>
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

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {t("admin.instructorDetails") || "Instructor Details"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {selectedInstructor?.userName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedInstructor?.userEmail}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("admin.status") || "Status"}:{" "}
                  {selectedInstructor?.isActive
                    ? t("admin.active") || "Active"
                    : t("admin.inactive") || "Inactive"}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  {t("admin.courses") || "Courses"}
                </h4>
                {selectedInstructorDetails?.courses?.length ? (
                  <div className="space-y-3">
                    {selectedInstructorDetails.courses.map((course) => (
                      <Card key={course._id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h5 className="font-bold">{course.title}</h5>
                              <p className="text-sm text-muted-foreground">
                                {course.level?.toUpperCase()} •{" "}
                                {course.category}
                              </p>
                              <p className="text-sm">
                                {t("admin.status") || "Status"}:{" "}
                                {course.isPublished
                                  ? t("admin.published") || "Published"
                                  : course.status || "Draft"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                {t("admin.students") || "Students"}:{" "}
                                {course.totalEnrollments || 0}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(course.createdAt)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("admin.noCourses") || "No courses yet."}
                  </p>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminInstructorManagement;
