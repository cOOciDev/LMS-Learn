// client/src/components/common-form/form-controls.jsx
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { useState } from "react";
import { EyeOff, Eye } from "lucide-react";

function FormControls({ formControls = [], formData, setFormData, isRTL = false }) {
  const [showPasswordFields, setShowPasswordFields] = useState({});

  const togglePasswordVisibility = (fieldName) => {
    setShowPasswordFields((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  function renderComponentByType(controlItem) {
    const value = formData[controlItem.name] || "";

    switch (controlItem.componentType) {
      case "input": {
        const hasPasswordToggle = controlItem.showPasswordToggle;
        const isPasswordField = controlItem.type === "password";
        const inputType =
          hasPasswordToggle && isPasswordField
            ? showPasswordFields[controlItem.name]
              ? "text"
              : "password"
            : controlItem.type || "text";

        return (
          <div className={hasPasswordToggle ? "relative" : ""}>
            <Input
              id={controlItem.name}
              name={controlItem.name}
              placeholder={controlItem.placeholder}
              type={inputType}
              value={value}
              className={hasPasswordToggle ? "pr-10" : undefined}
              onChange={(e) =>
                setFormData({ ...formData, [controlItem.name]: e.target.value })
              }
            />
            {hasPasswordToggle && (
              <button
                type="button"
                onClick={() => togglePasswordVisibility(controlItem.name)}
                className="absolute inset-y-0 right-2 flex items-center text-slate-500 transition hover:text-slate-700"
                aria-label={
                  showPasswordFields[controlItem.name] ? "Hide password" : "Show password"
                }
              >
                {showPasswordFields[controlItem.name] ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        );
      }

      case "select":
        return (
          <Select
            dir={isRTL ? "rtl" : "ltr"}   // این خط همه مشکلات RTL رو حل می‌کنه!
            onValueChange={(val) =>
              setFormData({ ...formData, [controlItem.name]: val })
            }
            value={value}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={controlItem.placeholder || controlItem.label} />
            </SelectTrigger>
            <SelectContent>
              {controlItem.options?.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "textarea":
        return (
          <Textarea
            id={controlItem.name}
            name={controlItem.name}
            placeholder={controlItem.placeholder}
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [controlItem.name]: e.target.value })
            }
          />
        );

      default:
        return null;
    }
  }

  return (
    <div className="space-y-6">
      {formControls.map((item) => (
        <div key={item.name} className="space-y-2">
          <Label htmlFor={item.name} className="font-medium flex items-center gap-1">
            {item.label}
            {item.required && (
              <span aria-hidden className="text-destructive text-xs font-bold">
                *
              </span>
            )}
          </Label>
          {renderComponentByType(item)}
        </div>
      ))}
    </div>
  );
}

export default FormControls;
