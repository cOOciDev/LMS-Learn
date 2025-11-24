import { useEffect, useState } from "react";
import { useLanguage } from "@/context/language-context";
import { useToast } from "@/hooks/use-toast";
import { getFinancialReportsService } from "@/services";
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

function AdminFinancialReportsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    setLoading(true);
    try {
      const response = await getFinancialReportsService();
      if (response?.success) {
        setReports(response.data);
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "Failed to load financial reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(amount) {
    return `$${Number(amount || 0).toLocaleString()}`;
  }

  function formatMonth(item) {
    if (!item?._id) return "N/A";
    const { year, month } = item._id;
    return `${month}/${year}`;
  }

  if (loading) {
    return (
      <div className="text-center py-10">
        {t("common.loading") || "Loading..."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {t("admin.financialReports") || "Financial Reports"}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.totalRevenue") || "Total Revenue"}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {formatCurrency(reports?.summary?.totalRevenue)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.totalOrders") || "Total Orders"}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {reports?.summary?.totalOrders || 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              {t("admin.avgOrderValue") || "Avg. Order Value"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {formatCurrency(reports?.summary?.avgOrderValue)}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {t("admin.monthlyRevenue") || "Monthly Performance"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.month") || "Month"}</TableHead>
                  <TableHead>{t("admin.revenue") || "Revenue"}</TableHead>
                  <TableHead>{t("admin.orders") || "Orders"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports?.monthlyRevenue?.length ? (
                  reports.monthlyRevenue.map((item) => (
                    <TableRow key={`${item._id.year}-${item._id.month}`}>
                      <TableCell>{formatMonth(item)}</TableCell>
                      <TableCell>{formatCurrency(item.revenue)}</TableCell>
                      <TableCell>{item.orders}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      {t("admin.noData") || "No data available"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.topCourses") || "Top Courses"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.course") || "Course"}</TableHead>
                  <TableHead>{t("admin.revenue") || "Revenue"}</TableHead>
                  <TableHead>{t("admin.orders") || "Orders"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports?.topCourses?.length ? (
                  reports.topCourses.map((course) => (
                    <TableRow key={course._id}>
                      <TableCell className="font-semibold">
                        {course.title}
                      </TableCell>
                      <TableCell>{formatCurrency(course.revenue)}</TableCell>
                      <TableCell>{course.orders}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      {t("admin.noData") || "No data available"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.topInstructors") || "Top Instructors"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.instructor") || "Instructor"}</TableHead>
                <TableHead>{t("admin.revenue") || "Revenue"}</TableHead>
                <TableHead>{t("admin.orders") || "Orders"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports?.topInstructors?.length ? (
                reports.topInstructors.map((instructor) => (
                  <TableRow key={instructor._id}>
                    <TableCell className="font-semibold">
                      {instructor.instructorName || "N/A"}
                    </TableCell>
                    <TableCell>{formatCurrency(instructor.revenue)}</TableCell>
                    <TableCell>{instructor.orders}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    {t("admin.noData") || "No data available"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminFinancialReportsPage;
