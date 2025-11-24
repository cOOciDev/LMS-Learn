import { useEffect, useState } from "react";
import { useLanguage } from "@/context/language-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_SETTINGS = {
  maintenanceMode: false,
  enableMessages: true,
  allowNewInstructorSignups: true,
  supportEmail: "support@example.com",
  announcement: "",
};

function AdminSettingsPage() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState(() => {
    const stored = localStorage.getItem("adminSettings");
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem("adminSettings", JSON.stringify(settings));
  }, [settings]);

  function handleToggle(key) {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleChange(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {t("admin.settings") || "Settings"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.generalSettings") || "General"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">
                {t("admin.maintenanceMode") || "Maintenance Mode"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("admin.maintenanceDescription") ||
                  "Temporarily disable the platform for maintenance."}
              </p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={() => handleToggle("maintenanceMode")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">
                {t("admin.enableMessages") || "Enable Messages"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("admin.messagesDescription") ||
                  "Allow students to send support messages."}
              </p>
            </div>
            <Switch
              checked={settings.enableMessages}
              onCheckedChange={() => handleToggle("enableMessages")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">
                {t("admin.allowInstructorSignup") ||
                  "Allow New Instructor Signups"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("admin.allowInstructorSignupDesc") ||
                  "Let new instructors register without approvals."}
              </p>
            </div>
            <Switch
              checked={settings.allowNewInstructorSignups}
              onCheckedChange={() =>
                handleToggle("allowNewInstructorSignups")
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.contactSettings") || "Contact"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{t("admin.supportEmail") || "Support Email"}</Label>
            <Input
              value={settings.supportEmail}
              onChange={(e) => handleChange("supportEmail", e.target.value)}
            />
          </div>
          <div>
            <Label>{t("admin.siteAnnouncement") || "Site Announcement"}</Label>
            <Textarea
              value={settings.announcement}
              onChange={(e) => handleChange("announcement", e.target.value)}
              placeholder={
                t("admin.announcementPlaceholder") ||
                "Optional announcement to show users."
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminSettingsPage;
