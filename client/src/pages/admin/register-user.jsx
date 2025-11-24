import CommonForm from "@/components/common-form";
import { Card, CardContent } from "@/components/ui/card";
import { initialSignUpFormData } from "@/config";
import { AuthContext } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { getTranslatedSignUpFormControls } from "@/utils/form-translations";
import { GraduationCap } from "lucide-react";
import { useContext, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { registerService } from "@/services";
import { useToast } from "@/hooks/use-toast";
import LanguageSwitcher from "@/components/language-switcher";
import ThemeSwitcher from "@/components/theme-switcher";

function AdminRegisterUserPage() {
  const { auth } = useContext(AuthContext);
  const [signUpFormData, setSignUpFormData] = useState(initialSignUpFormData);
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const translatedFormControls = useMemo(
    () => getTranslatedSignUpFormControls(t),
    [t]
  );

  function checkIfSignUpFormIsValid() {
    return (
      signUpFormData &&
      signUpFormData.userName !== "" &&
      signUpFormData.userEmail !== "" &&
      signUpFormData.password !== "" &&
      signUpFormData.role !== ""
    );
  }

  async function handleRegisterUser(event) {
    event.preventDefault();
    try {
      const data = await registerService(signUpFormData);
      if (data.success) {
        toast({
          title: t("common.success"),
          description: data.message || t("auth.userRegistered"),
        });
        setSignUpFormData(initialSignUpFormData);
      } else {
        toast({
          title: t("common.error"),
          description: data.message || t("auth.failedToRegister"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description:
          error?.response?.data?.message ||
          t("auth.failedToRegister"),
        variant: "destructive",
      });
    }
  }

  // Redirect if not admin
  if (auth?.user?.role !== "admin") {
    return null; // RouteGuard will handle redirect
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* <header className="px-4 lg:px-6 h-14 flex items-center justify-between border-b">
        <Link to={"/"} className="flex items-center justify-center">
          <GraduationCap className="h-8 w-8 mr-4" />
          <span className="font-extrabold text-xl">LMS LEARN</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </header> */}
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md p-6 space-y-4">
          <CardContent className="space-y-2">
            <CommonForm
              formControls={translatedFormControls}
              buttonText={t("auth.registerUser")}
              formData={signUpFormData}
              setFormData={setSignUpFormData}
              isButtonDisabled={!checkIfSignUpFormIsValid()}
              handleSubmit={handleRegisterUser}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminRegisterUserPage;

