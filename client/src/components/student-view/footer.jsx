// client/src/components/student/common/footer/index.jsx
import { Youtube, Github, Instagram } from "lucide-react";
import { useLanguage } from "@/context/language-context";

function StudentViewCommonFooter() {
  const { t, language } = useLanguage();
  const currentYear = new Date().getFullYear();
  const isRTL = language === "fa";

  const socialLinks = [
    {
      icon: Github,
      label: "GitHub",
      href: "https://github.com/cOOciDev",
      hoverColor: "hover:bg-grey dark:hover:bg-grey",
      invertOnHover: true // گیت‌هاب تو دارک مود سفید میشه
    },
    {
      icon: Youtube,
      label: "YouTube",
      href: "https://youtube.com/@cOOciDev",
      hoverColor: "hover:bg-red-600",
      invertOnHover: true // یوتیوب قرمز + آیکون سفید
    },
    {
      icon: "/social_15527900.png",
      label: "Instagram",
      href: "https://instagram.com/cOOcidev",
      hoverColor: "hover:bg-gradient-to-tr hover:from-purple-600 hover:via-pink-500 hover:to-orange-400",
      invertOnHover: true // اینستاگرام گرادیان + آیکون سفید
    },
    {
      icon: "/telegram_2111646.png",
      label: "Telegram",
      href: "https://t.me/cOOciDev", // آیدی خودت رو عوض کن
      hoverColor: "hover:bg-[#229ED9]",
      invertOnHover: false // مهم! تلگرام آیکونش همون رنگ اصلیش میمونه (نه سفید!)
    },
  ];

  return (
    <footer className={`border-t bg-gradient-to-t from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 ${isRTL ? "text-right" : "text-left"}`}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-1 gap-10 md:grid-cols-4 ${isRTL ? "md:grid-flow-col-dense" : ""}`}>
          
          {/* لوگو + شبکه‌های اجتماعی */}
          <div className={isRTL ? "md:col-start-4" : ""}>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t("home.heroTitle").split(" ")[0]}  {t("app.name")}
            </h2>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {t("home.heroDescription")}
            </p>

            <div className={`mt-6 flex ${isRTL ? "justify-end" : "justify-start"} gap-6`}>
              {socialLinks.map((social) => {
                const Icon = social.icon;

                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`
                      group relative overflow-hidden rounded-full p-3 
                      bg-gray-100 dark:bg-gray-800 
                      transition-all duration-300 transform hover:scale-110 hover:shadow-2xl
                      ${social.hoverColor}
                    `}
                    aria-label={social.label}
                  >
                    {/* گرادیان فقط برای اینستاگرام */}
                    {social.label === "Instagram" && (
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}

                    {/* آیکون — فقط اونایی که invertOnHover = true سفید میشن */}
                    {typeof Icon === "string" ? (
                      <img
                        src={Icon}
                        alt={social.label}
                        className={`
                          h-6 w-6 object-contain relative z-10 transition-all duration-300
                          ${social.invertOnHover ? "group-hover:brightness-0 group-hover:invert" : ""}
                        `}
                      />
                    ) : (
                      <Icon
                        className={`
                          h-6 w-6 relative z-10 transition-all duration-300
                          ${social.invertOnHover ? "group-hover:text-white" : "text-current"}
                        `}
                      />
                    )}

                    <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-white/20" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* لینک‌های مفید */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {t("common.courses")}
            </h3>
            <ul className="mt-4 space-y-3">
              <li><a href="/courses" className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition">{t("coursesPage.title")}</a></li>
              <li><a href="/roadmap" className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition">{t("roadmap.title")}</a></li>
              {/* <li><a href="/instructors" className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition">{t("common.instructor")}s</a></li> */}
            </ul>
          </div>

          {/* شرکت */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {isRTL ? "شرکت" : "Company"}
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition">{isRTL ? "درباره ما" : "About Us"}</a></li>
              {/* <li><a href="/contact" className="hover:text-blue-600 dark:hover:text-blue-400 transition">{isRTL ? "تماس با ما" : "Contact"}</a></li> */}
              {/* <li><a href="/blog" className="hover:text-blue-600 dark:hover:text-blue-400 transition">{isRTL ? "وبلاگ" : "Blog"}</a></li> */}
              {/* <li><a href="/careers" className="hover:text-blue-600 dark:hover:text-blue-400 transition">{isRTL ? "فرصت‌های شغلی" : "Careers"}</a></li> */}
            </ul>
          </div>

          {/* پشتیبانی */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {t("common.support") || (isRTL ? "پشتیبانی" : "Support")}
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {/* <li>Email: support@cOOcidev.ir</li> */}
              {/* <li>{isRTL ? "تلگرام" : "Telegram"}: @cOOciSupport</li> */}
              <li>{isRTL ? "ساعات پاسخگویی" : "Response Time"}: 9AM - 9PM</li>
            </ul>
          </div>
        </div>

        {/* کپی‌رایت */}
        <div className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-800">
          <div className="flex flex-col items-center justify-between gap-4 text-center text-sm text-gray-600 dark:text-gray-400 md:flex-row">
            <p>
              © {currentYear} cOOciDev Fajrane LMS. {isRTL ? "تمامی حقوق محفوظ است." : "All rights reserved."}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default StudentViewCommonFooter;