import CourseCurriculum from "@/components/instructor-view/courses/add-new-course/course-curriculum";
import CourseLanding from "@/components/instructor-view/courses/add-new-course/course-landing";
import CourseSettings from "@/components/instructor-view/courses/add-new-course/course-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  courseCurriculumInitialFormData,
  courseLandingInitialFormData,
} from "@/config";
import { AuthContext } from "@/context/auth-context";
import { InstructorContext } from "@/context/instructor-context";
import {
  addNewCourseService,
  fetchInstructorCourseDetailsService,
  updateCourseByIdService,
} from "@/services";
import { useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useToast } from "@/hooks/use-toast";

function AddNewCoursePage() {
  const {
    courseLandingFormData,
    courseCurriculumFormData,
    setCourseLandingFormData,
    setCourseCurriculumFormData,
    currentEditedCourseId,
    setCurrentEditedCourseId,
  } = useContext(InstructorContext);

  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const params = useParams();
  const { t } = useLanguage();
  const { toast } = useToast();

  function isEmpty(value) {
    if (Array.isArray(value)) {
      return value.length === 0;
    }

    return value === "" || value === null || value === undefined;
  }

  function validateFormData() {
    // Validate landing page data
    const requiredLandingFields = ['title', 'category', 'level', 'primaryLanguage', 'description', 'pricing'];
    for (const key of requiredLandingFields) {
      if (isEmpty(courseLandingFormData[key])) {
        return false;
      }
    }

    // Validate curriculum
    if (!courseCurriculumFormData || courseCurriculumFormData.length === 0) {
      return false;
    }

    let hasFreePreview = false;

    for (const item of courseCurriculumFormData) {
      if (
        isEmpty(item.title) ||
        isEmpty(item.videoUrl) ||
        isEmpty(item.public_id)
      ) {
        return false;
      }

      if (item.freePreview) {
        hasFreePreview = true; //found at least one free preview
      }
    }

    return hasFreePreview;
  }

  async function handleCreateCourse() {
    if (!validateFormData()) {
      toast({
        title: t("common.error"),
        description: "Please fill in all required fields and add at least one free preview lecture.",
        variant: "destructive",
      });
      return;
    }

    try {
      const courseFinalFormData = {
        instructorId: auth?.user?._id,
        instructorName: auth?.user?.userName,
        date: new Date(),
        ...courseLandingFormData,
        students: [],
        curriculum: courseCurriculumFormData,
        status: "published",
        isPublished: true,
      };

      const response =
        currentEditedCourseId !== null
          ? await updateCourseByIdService(
              currentEditedCourseId,
              courseFinalFormData
            )
          : await addNewCourseService(courseFinalFormData);

      if (response?.success) {
        toast({
          title: t("common.success"),
          description: currentEditedCourseId 
            ? "Course updated successfully!" 
            : "Course created successfully!",
        });
        setCourseLandingFormData(courseLandingInitialFormData);
        setCourseCurriculumFormData(courseCurriculumInitialFormData);
        setCurrentEditedCourseId(null);
        navigate("/instructor");
      } else {
        toast({
          title: t("common.error"),
          description: response?.message || "Failed to save course. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error?.response?.data?.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function fetchCurrentCourseDetails() {
    try {
      const response = await fetchInstructorCourseDetailsService(
        currentEditedCourseId
      );

      if (response?.success) {
        const courseData = response?.data?.course || response?.data;
        const setCourseFormData = Object.keys(
          courseLandingInitialFormData
        ).reduce((acc, key) => {
          acc[key] = courseData[key] || courseLandingInitialFormData[key];
          return acc;
        }, {});

        setCourseLandingFormData(setCourseFormData);
        setCourseCurriculumFormData(courseData?.curriculum || []);
      }
    } catch (error) {
      console.error("Error fetching course details:", error);
      toast({
        title: t("common.error"),
        description: "Failed to load course details. Please try again.",
        variant: "destructive",
      });
    }
  }

  useEffect(() => {
    if (currentEditedCourseId !== null) fetchCurrentCourseDetails();
  }, [currentEditedCourseId]);

  useEffect(() => {
    if (params?.courseId) setCurrentEditedCourseId(params?.courseId);
  }, [params?.courseId]);


  const isEditMode = currentEditedCourseId !== null;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/instructor")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.back") || "Back"}
        </Button>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-extrabold">
            {isEditMode ? t("instructor.editCourse") || "Edit Course" : t("instructor.createCourse") || "Create New Course"}
          </h1>
          <Button
            disabled={!validateFormData()}
            className="text-sm tracking-wider font-bold px-8"
            onClick={handleCreateCourse}
          >
            {isEditMode ? t("common.update") || "UPDATE" : t("common.submit") || "SUBMIT"}
          </Button>
        </div>
      </div>
      <Card>
        <CardContent>
          <div className="p-4">
            <Tabs defaultValue="course-landing-page" className="space-y-4">
              <TabsList>
                <TabsTrigger value="course-landing-page">
                  {t("course.courseDetails") || "Course Landing Page"}
                </TabsTrigger>
                <TabsTrigger value="curriculum">
                  {t("course.curriculum") || "Curriculum"}
                </TabsTrigger>
                <TabsTrigger value="settings">
                  {t("course.settings") || "Settings"}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="course-landing-page">
                <CourseLanding />
              </TabsContent>
              <TabsContent value="curriculum">
                <CourseCurriculum />
              </TabsContent>
              <TabsContent value="settings">
                <CourseSettings />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AddNewCoursePage;
