import { signInFormControls, signUpFormControls } from "@/config";

export const getTranslatedSignInFormControls = (t) => {
  return signInFormControls.map((control) => {
    const fieldName = control.name === "userEmail" ? "email" : control.name;
    return {
      ...control,
      label: t(`common.${fieldName}`),
      placeholder: control.placeholder ? t(`common.${fieldName}`) : control.placeholder,
    };
  });
};

export const getTranslatedSignUpFormControls = (t) => {
  return signUpFormControls.map((control) => {
    const fieldName = control.name === "userEmail" ? "email" : control.name;
    const translated = {
      ...control,
      label: t(`common.${fieldName}`),
      placeholder: control.placeholder ? t(`common.${fieldName}`) : control.placeholder,
    };
    
    // Translate role options
    if (control.name === "role" && control.options) {
      translated.options = control.options.map((option) => ({
        ...option,
        label: t(`common.${option.id}`) || option.label,
      }));
    }
    
    return translated;
  });
};

