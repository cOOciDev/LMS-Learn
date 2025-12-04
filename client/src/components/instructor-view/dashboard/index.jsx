// client/src/components/instructor-view/dashboard/index.jsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, Users, BookOpenText } from "lucide-react";
import { useMemo } from "react";
import { useLanguage } from "@/context/language-context";

function InstructorDashboard({ listOfCourses = [] }) {
  // محافظت در برابر undefined یا null
  const courses = Array.isArray(listOfCourses)
    ? listOfCourses
    : listOfCourses?.courses || [];
  const { t, language } = useLanguage();
  const isRTL = language === "fa";

  const stats = useMemo(() => {
    if (courses.length === 0) {
      return {
        totalStudents: 0,
        totalProfit: 0,
        studentList: [],
      };
    }

    return courses.reduce(
      (acc, course) => {
        const students = course.students || [];
        const studentCount = students.length;
        const price = course.pricing || 0;

        acc.totalStudents += studentCount;
        acc.totalProfit += price * studentCount;

        students.forEach((student) => {
          acc.studentList.push({
            courseTitle: course.title || "دوره بدون عنوان",
            studentName: student.studentName || student.name || "نامشخص",
            studentEmail: student.studentEmail || student.email || "ایمیل موجود نیست",
          });
        });

        return acc;
      },
      {
        totalStudents: 0,
        totalProfit: 0,
        studentList: [],
      }
    );
  }, [courses]);

  const config = [
    {
      icon: Users,
      label: t("admin.totalStudents"),
      value: stats.totalStudents,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      icon: DollarSign,
      label: t("admin.totalRevenue"),
      value: `$${stats.totalProfit.toFixed(2)}`,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-900/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* کارت‌های آمار */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {config.map((item, index) => (
          <Card key={index} className="border-border shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-semibold text-foreground">
                {item.label}
              </CardTitle>
              <div className={`p-3 rounded-full ${item.bg}`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {item.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* لیست دانشجویان */}
      <Card className="border-border shadow-xl">
        <CardHeader className="border-b border-border bg-muted/30">
          <CardTitle className="text-foreground flex items-center gap-3">
            <BookOpenText className="h-6 w-6" />
            {t("instructor.totalStudentsIn")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {stats.studentList.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-foreground font-bold">نام دوره</TableHead>
                    <TableHead className="text-foreground font-bold">نام دانشجو</TableHead>
                    <TableHead className="text-foreground font-bold">ایمیل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.studentList.map((student, index) => (
                    <TableRow
                      key={index}
                      className="hover:bg-muted/50 transition-colors border-border"
                    >
                      <TableCell className="font-medium text-foreground">
                        {student.courseTitle}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {student.studentName}
                      </TableCell>
                      <TableCell className="text-foreground/80">
                        {student.studentEmail}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                <Users className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-xl font-medium text-foreground">
                {t("instructor.noStudentsEnrolled")}
              </p>
              <p className="text-muted-foreground mt-2 ">
                {t("instructor.studentsWillAppearHere")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default InstructorDashboard;