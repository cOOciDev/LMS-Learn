import { useEffect, useState } from "react";
import { useLanguage } from "@/context/language-context";
import { useToast } from "@/hooks/use-toast";
import { getAllCoursesAdminService } from "@/services";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

function AdminCoursesPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [courses, setCourses] = useState([]);
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

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, statusFilter]);

  async function fetchCourses() {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      };

      const response = await getAllCoursesAdminService(params);
      if (response?.success) {
        setCourses(response.data?.courses || []);
        setPagination(response.data?.pagination || pagination);
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "Failed to load courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
          {t("admin.courseManagement") || "Course Management"}
        </h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("common.search") || "Search courses..."}
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
                <SelectValue placeholder={t("admin.status") || "Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("admin.allStatuses") || "All Statuses"}
                </SelectItem>
                <SelectItem value="published">
                  {t("admin.published") || "Published"}
                </SelectItem>
                <SelectItem value="draft">
                  {t("admin.draft") || "Draft"}
                </SelectItem>
                <SelectItem value="archived">
                  {t("admin.archived") || "Archived"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("common.courses") || "Courses"}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              {t("common.loading") || "Loading..."}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("admin.noCourses") || "No courses found"}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.course") || "Course"}</TableHead>
                      <TableHead>
                        {t("common.instructor") || "Instructor"}
                      </TableHead>
                      <TableHead>{t("admin.status") || "Status"}</TableHead>
                      <TableHead>{t("admin.students") || "Students"}</TableHead>
                      <TableHead>{t("common.price") || "Price"}</TableHead>
                      <TableHead>
                        {t("common.createdAt") || "Created"}
                      </TableHead>
                      <TableHead className="text-right">
                        {t("common.actions") || "Actions"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course._id}>
                        <TableCell className="font-semibold">
                          <div>{course.title}</div>
                          <p className="text-xs text-muted-foreground">
                            {course.category}
                          </p>
                        </TableCell>
                        <TableCell>
                          {course.instructorId?.userName ||
                            course.instructorName ||
                            "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              course.status === "published"
                                ? "default"
                                : course.status === "draft"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {course.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{course.totalEnrollments || 0}</TableCell>
                        <TableCell>{`$${course.pricing || 0}`}</TableCell>
                        <TableCell>{formatDate(course.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(`/course/details/${course._id}`, "_blank")
                            }
                          >
                            {t("common.view") || "View"}
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
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={page === 1}
                    >
                      {t("common.previous") || "Previous"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((prev) => Math.min(pagination.pages, prev + 1))
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

export default AdminCoursesPage;
