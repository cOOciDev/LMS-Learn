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
import { useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import LanguageSwitcher from "@/components/language-switcher";
import ThemeSwitcher from "@/components/theme-switcher";

function AuthPage() {
  const {
    signInFormData,
    setSignInFormData,
    handleLoginUser,
  } = useContext(AuthContext);
  const { t } = useLanguage();
  
  const translatedFormControls = useMemo(
    () => getTranslatedSignInFormControls(t),
    [t]
  );

  function checkIfSignInFormIsValid() {
    return (
      signInFormData &&
      signInFormData.userEmail !== "" &&
      signInFormData.password !== ""
    );
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
              buttonText={t("common.signIn")}
              formData={signInFormData}
              setFormData={setSignInFormData}
              isButtonDisabled={!checkIfSignInFormIsValid()}
              handleSubmit={handleLoginUser}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AuthPage;
