// client/src/components/instructor-view/courses/index.jsx

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  courseCurriculumInitialFormData,
  courseLandingInitialFormData,
} from "@/config";
import { InstructorContext } from "@/context/instructor-context";
import { Delete, Edit, Plus } from "lucide-react";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/language-context";


function InstructorCourses({ listOfCourses }) {
  const navigate = useNavigate();
  const {
    setCurrentEditedCourseId,
    setCourseLandingFormData,
    setCourseCurriculumFormData,
  } = useContext(InstructorContext);
  const { t, language } = useLanguage();
  const isRTL = language === "fa";
  
  const courses = Array.isArray(listOfCourses)
    ? listOfCourses
    : (listOfCourses?.courses || []);

  const handleCreateNewCourse = () => {
    setCurrentEditedCourseId(null);
    setCourseLandingFormData(courseLandingInitialFormData);
    setCourseCurriculumFormData(courseCurriculumInitialFormData.map(item => ({ ...item })));
    navigate("/instructor/create-new-course");
  };

  const handleEditCourse = (courseId) => {
    navigate(`/instructor/edit-course/${courseId}`);
  };

  return (
    <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-muted/40 border-b border-border p-6">
        <CardTitle className="text-2xl sm:text-3xl font-extrabold text-foreground">
          {t("common.courses")}
        </CardTitle>
        <Button 
          onClick={handleCreateNewCourse} 
          className="h-12 px-6 font-bold shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
          size="lg"
        >
          <Plus className="h-5 w-5 ml-2" />
          {t("instructor.createCourse")}
        </Button>
      </CardHeader>

      <CardContent className="p-2 w-full">
        <div className="overflow-x-auto">
          <Table >
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/40">
                <TableHead className="text-foreground font-bold text-sm sm:text-base ">{t("common.courses")}</TableHead>
                <TableHead className="text-foreground font-bold text-sm sm:text-base text-center sm:text-center">{t("course.students")}</TableHead>
                <TableHead className="text-foreground font-bold text-sm sm:text-base text-center sm:text-center">{t("admin.totalRevenue")}</TableHead>
                <TableHead className="text-right text-foreground font-bold text-sm sm:text-base">{t("admin.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody >
              {courses.length > 0 ? (
                courses.map((course) => (
                  <TableRow
                    key={course._id}
                    className="hover:bg-muted/50 transition-all duration-200 border-b border-border/50"
                  >
                    {/* نام دوره — روی موبایل کوچک‌تر و چند خطی */}
                    <TableCell className="font-semibold text-foreground text-sm sm:text-base max-w-32 sm:max-w-none truncate sm:truncate-none">
                      {course?.title || "Untitled Course"}
                    </TableCell>

                    {/* تعداد دانشجو */}
                    <TableCell className="text-foreground/90 text-center text-sm sm:text-base">
                      {course?.students?.length || 0}
                    </TableCell>

                    {/* درآمد */}
                    <TableCell className="text-foreground font-bold text-green-600 dark:text-green-400 text-center text-sm sm:text-base">
                      ${((course?.students?.length || 0) * (course?.pricing || 0)).toFixed(2)}
                    </TableCell>

                    {/* دکمه‌ها — روی موبایل بزرگ‌تر و راحت‌تر */}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleEditCourse(course._id)}
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0 hover:bg-primary/10 hover:text-primary rounded-lg"
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0 hover:bg-destructive/10 hover:text-destructive rounded-lg"
                        >
                          <Delete className="h-5 w-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-16 sm:py-20">
                    <div className="flex flex-col items-center gap-6 text-muted-foreground">
                      <div className="bg-muted/50 rounded-full p-8 shadow-inner">
                        <svg className="w-16 h-16 sm:w-20 sm:h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div className="space-y-2 text-center">
                        <p className="text-xl sm:text-2xl font-bold text-foreground">No courses created yet</p>
                        <p className="text-base sm:text-lg px-4">Click the button above to create your first course!</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default InstructorCourses;