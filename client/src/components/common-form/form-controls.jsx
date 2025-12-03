// client/src/components/common-form/form-controls.jsx
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";

function FormControls({ formControls = [], formData, setFormData, isRTL = false }) {
  function renderComponentByType(controlItem) {
    const value = formData[controlItem.name] || "";

    switch (controlItem.componentType) {
      case "input":
        return (
          <Input
            id={controlItem.name}
            name={controlItem.name}
            placeholder={controlItem.placeholder}
            type={controlItem.type || "text"}
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [controlItem.name]: e.target.value })
            }
          />
        );

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
          <Label htmlFor={item.name} className="font-medium">
            {item.label}
          </Label>
          {renderComponentByType(item)}
        </div>
      ))}
    </div>
  );
}

export default FormControls;