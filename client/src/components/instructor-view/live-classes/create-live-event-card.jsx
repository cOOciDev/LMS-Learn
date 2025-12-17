import { PlusCircle } from "lucide-react";
import { useLanguage } from "@/context/language-context";

function CreateLiveEventCard({ onCreate }) {
  const { t } = useLanguage();

  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/80 p-6 text-center shadow-sm transition hover:border-primary/60 dark:border-slate-700 dark:bg-slate-900/70">
      <PlusCircle className="mx-auto mb-4 h-10 w-10 text-primary" />
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {t("createLiveEventCard.title")}
      </h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {t("createLiveEventCard.description")}
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary hover:text-white"
      >
        <PlusCircle className="h-4 w-4" />
        {t("createLiveEventCard.button")}
      </button>
    </div>
  );
}

export default CreateLiveEventCard;
