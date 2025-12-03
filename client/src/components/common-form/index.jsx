// client/src/components/common-form/index.jsx
import { Button } from "../ui/button";
import FormControls from "./form-controls";
import { useLanguage } from "@/context/language-context";

function CommonForm({
  handleSubmit,
  buttonText,
  formControls = [],
  formData,
  setFormData,
  isButtonDisabled = false,
}) {
  const { language } = useLanguage();
  const isRTL = language === "fa";

  return (
    <form onSubmit={handleSubmit} dir={isRTL ? "rtl" : "ltr"}>
      <FormControls
        formControls={formControls}
        formData={formData}
        setFormData={setFormData}
        isRTL={isRTL}   // خودش می‌فهمه فارسیه یا نه
      />

      <Button
        type="submit"
        disabled={isButtonDisabled}
        className="mt-6 w-full text-lg font-semibold"
      >
        {buttonText || (isRTL ? "ذخیره و ادامه" : "Save & Continue")}
      </Button>
    </form>
  );
}

export default CommonForm;