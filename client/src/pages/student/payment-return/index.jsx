import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function StripePaymentReturnPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const sessionId = params.get("session_id");

  useEffect(() => {
    const redirectTimeout = setTimeout(() => {
      sessionStorage.removeItem("currentOrderId");
      navigate("/student-courses", { replace: true });
    }, 1500);

    return () => clearTimeout(redirectTimeout);
  }, [sessionId, navigate]);

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
