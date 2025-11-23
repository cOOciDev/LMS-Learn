import CommonForm from "@/components/common-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthContext } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { getTranslatedSignInFormControls } from "@/utils/form-translations";
import { GraduationCap } from "lucide-react";
import { useContext, useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import LanguageSwitcher from "@/components/language-switcher";
import ThemeSwitcher from "@/components/theme-switcher";
import { useToast } from "@/hooks/use-toast";

function AuthPage() {
  const {
    signInFormData,
    setSignInFormData,
    handleLoginUser,
    auth,
  } = useContext(AuthContext);
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const translatedFormControls = useMemo(
    () => getTranslatedSignInFormControls(t),
    [t]
  );

  // Redirect if already authenticated (but only once to avoid loops)
  useEffect(() => {
    if (auth?.authenticate && auth?.user) {
      const timer = setTimeout(() => {
        if (auth?.user?.role === "admin" || auth?.user?.role === "instructor") {
          navigate("/instructor", { replace: true });
        } else {
          navigate("/home", { replace: true });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [auth?.authenticate, auth?.user?.role, navigate]);

  function checkIfSignInFormIsValid() {
    return (
      signInFormData &&
      signInFormData.userEmail !== "" &&
      signInFormData.password !== ""
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!checkIfSignInFormIsValid()) {
      toast({
        title: t("common.error"),
        description: t("auth.pleaseFillAllFields"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await handleLoginUser(event);
      
      if (result?.success) {
        toast({
          title: t("common.success"),
          description: result.message || t("auth.loginSuccessful"),
        });
        
        // Navigate based on user role from result
        const userRole = result.user?.role || auth?.user?.role;
        setTimeout(() => {
          if (userRole === "admin" || userRole === "instructor") {
            navigate("/instructor");
          } else {
            navigate("/home");
          }
        }, 300);
      } else {
        toast({
          title: t("common.error"),
          description: result?.message || t("auth.loginFailed"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error?.message || t("auth.loginFailed"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center justify-between border-b">
        <Link to={"/"} className="flex items-center justify-center">
          <GraduationCap className="h-8 w-8 mr-4" />
          <span className="font-extrabold text-xl">LMS LEARN</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </header>
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md p-6 space-y-4">
          <CardHeader>
            <CardTitle>{t("auth.signInToAccount")}</CardTitle>
            <CardDescription>
              {t("auth.enterEmailPassword")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <CommonForm
              formControls={translatedFormControls}
              buttonText={isLoading ? t("common.loading") : t("common.signIn")}
              formData={signInFormData}
              setFormData={setSignInFormData}
              isButtonDisabled={!checkIfSignInFormIsValid() || isLoading}
              handleSubmit={handleSubmit}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AuthPage;
