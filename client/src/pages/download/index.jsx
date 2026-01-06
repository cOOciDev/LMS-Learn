import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";
import { downloadAssetByPath, extractAssetPath } from "@/utils/media";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

const getQueryParam = (search, key) => {
  const params = new URLSearchParams(search);
  return params.get(key) || "";
};

function DownloadPage() {
  const { t } = useLanguage();
  const location = useLocation();
  const downloadUrl = useMemo(
    () => decodeURIComponent(getQueryParam(location.search, "url")),
    [location.search]
  );
  const fileName = useMemo(
    () => decodeURIComponent(getQueryParam(location.search, "name")),
    [location.search]
  );
  const returnUrl = useMemo(
    () => decodeURIComponent(getQueryParam(location.search, "returnUrl")),
    [location.search]
  );
  const [downloadError, setDownloadError] = useState("");

  const handleStartDownload = async () => {
    if (!downloadUrl) return;
    setDownloadError("");
    const assetPath = extractAssetPath(downloadUrl);
    if (!assetPath) {
      window.location.href = downloadUrl;
      return;
    }
    try {
      await downloadAssetByPath(assetPath, fileName);
    } catch {
      setDownloadError(
        t("downloadPage.retryMessage") ||
          "Download failed. Please try again or use the direct link."
      );
    }
  };

  const handleClose = () => {
    window.close();
    setTimeout(() => {
      if (!window.closed) {
        window.location.href = returnUrl || "/";
      }
    }, 150);
  };

  useEffect(() => {
    if (!downloadUrl) return;
    const timer = setTimeout(() => {
      handleStartDownload();
    }, 300);
    return () => clearTimeout(timer);
  }, [downloadUrl, fileName]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-2xl">
        <h1 className="text-2xl font-bold text-foreground">
          {t("downloadPage.title") || "Download file"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("downloadPage.description") ||
            "Your download should start automatically. If it does not, use the button below."}
        </p>

        <div className="mt-6 rounded-2xl border border-border/60 bg-muted/40 px-4 py-3 text-left text-sm text-foreground">
          <p className="font-semibold">{t("downloadPage.fileLabel") || "File"}</p>
          <p className="truncate text-muted-foreground">
            {fileName || t("downloadPage.unknownFile") || "Unknown file"}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={handleStartDownload} className="w-full sm:w-auto">
            {t("downloadPage.retry") || "Retry download"}
          </Button>
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto"
          >
            {t("downloadPage.close") || "Close"}
          </Button>
        </div>

        {downloadError ? (
          <>
            <p className="mt-6 text-xs text-destructive">{downloadError}</p>
            <a
              className="mt-6 inline-block text-xs text-blue-400 hover:underline"
              href={downloadUrl}
            >
              {t("downloadPage.directLink") || "Open direct download link"}
            </a>
          </>
        ) : downloadUrl ? (
          <a
            className="mt-6 inline-block text-xs text-blue-400 hover:underline"
            href={downloadUrl}
          >
            {t("downloadPage.directLink") || "Open direct download link"}
          </a>
        ) : (
          <p className="mt-6 text-xs text-destructive">
            {t("downloadPage.missingLink") || "Download link is missing."}
          </p>
        )}
      </div>
    </div>
  );
}

export default DownloadPage;
