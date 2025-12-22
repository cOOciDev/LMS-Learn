import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentContext } from "@/context/student-context";
import { fetchStudentBoughtCoursesService } from "@/services";
import { useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const normalizeMyCourses = (response) => {
  const root = response?.data ?? response;
  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.myCourses)) return root.myCourses;
  if (Array.isArray(root?.courses)) return root.courses;
  if (Array.isArray(root?.data)) return root.data;
  return [];
};

function StripePaymentReturnPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setStudentBoughtCoursesList } = useContext(StudentContext);
  const params = new URLSearchParams(location.search);
  const sessionId = params.get("session_id");

  useEffect(() => {
    let isMounted = true;

    const refreshMyCourses = async () => {
      try {
        const response = await fetchStudentBoughtCoursesService();
        if (!isMounted) return;
        setStudentBoughtCoursesList(normalizeMyCourses(response));
      } catch (error) {
        console.error("Failed to refresh courses after payment:", error);
      }
    };

    refreshMyCourses();

    const redirectTimeout = setTimeout(() => {
      sessionStorage.removeItem("currentOrderId");
      navigate("/student-courses", { replace: true });
    }, 1500);

    return () => {
      isMounted = false;
      clearTimeout(redirectTimeout);
    };
  }, [sessionId, navigate, setStudentBoughtCoursesList]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {sessionId
            ? "Payment successful! Redirecting to your courses..."
            : "Processing payment... Please wait"}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

export default StripePaymentReturnPage;
