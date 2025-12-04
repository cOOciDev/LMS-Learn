import { useLanguage } from "@/context/language-context";
import { Button } from "@/components/ui/button";

function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {/* HERO */}
      <section className="relative py-20 px-6 lg:px-16 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white rounded-b-[60px] overflow-hidden shadow-xl">
        <div className="max-w-3xl mx-auto text-center space-y-6 z-10 relative">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight drop-shadow-lg">
            {t("about.title")}
          </h1>
          <p className="text-lg md:text-xl opacity-90 leading-relaxed">
            {t("about.heroDescription")}
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="py-16 px-6 lg:px-16 bg-white/90 shadow-inner rounded-t-[60px] transition-colors dark:bg-slate-900/80">
        <div className="max-w-4xl mx-auto space-y-10 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {t("about.missionTitle")}
          </h2>
          <p className="text-gray-700 dark:text-slate-300 text-lg leading-relaxed">
            {t("about.missionText1")}
            <br />
            <span className="font-semibold text-blue-700 dark:text-blue-400">
              {t("about.missionFree")}
            </span>
            <br />
            <span className="font-semibold text-blue-700 dark:text-blue-400">
              {t("about.missionPaid")}
            </span>
            <br />
            <br />
            {t("about.missionText2")}
          </p>
        </div>

        {/* TEAM */}
        <div className="max-w-4xl mx-auto mt-20 text-center space-y-10">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">
            {t("about.teamTitle")}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold mb-2">{t("about.parsaName")}</h3>
              <p className="text-gray-600 dark:text-slate-300 mb-4">
                {t("about.parsaRole")}
              </p>
              <a
                href="https://github.com/candy-bu"
                className="text-blue-600 dark:text-blue-400 underline"
                target="_blank"
              >
                Github: candy-bu
              </a>
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold mb-2">{t("about.mehdiName")}</h3>
              <p className="text-gray-600 dark:text-slate-300 mb-4">
                {t("about.mehdiRole")}
              </p>
              <a
                href="https://github.com/cOOciDev"
                className="text-blue-600 dark:text-blue-400 underline"
                target="_blank"
              >
                Github: cOOciDev
              </a>
            </div>
          </div>
        </div>

        {/* FUN LINE */}
        <div className="max-w-3xl mx-auto mt-20 text-center">
          <p className="text-gray-700 dark:text-slate-300 text-lg font-semibold">
            {t("about.funLine1")}
            <br />
            <span className="text-blue-700 dark:text-blue-400 font-bold text-xl">
              {t("about.funNames")}
            </span>
            <span className="text-blue-700 dark:text-blue-400 font-bold text-xl">
              {t("about.funLine2")} 😄
            </span>
            
          </p>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;
