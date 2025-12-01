// client/src/pages/student/roadmap/index.jsx
"use client";

import React, { useMemo, useState } from "react";
import { useLanguage } from "@/context/language-context";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FiUserPlus, FiBookOpen, FiEdit, FiCheckCircle, FiAward, FiArrowRight } from "react-icons/fi";
import { motion } from "framer-motion";
import { useCategories } from "@/context/category-context";
import { buildCategoryOptions } from "@/utils/category";
import { useNavigate } from "react-router-dom";

export const roadmapSteps = [
  {
    id: "signUp",
    titleKey: "roadmap.signUpTitle",
    descriptionKey: "roadmap.signUpDescription",
    icon: <FiUserPlus className="text-3xl text-white" />,
    gradient: "bg-gradient-to-r from-indigo-500 to-purple-500",
  },
  {
    id: "startLearning",
    titleKey: "roadmap.startLearningTitle",
    descriptionKey: "roadmap.startLearningDescription",
    icon: <FiBookOpen className="text-3xl text-white" />,
    gradient: "bg-gradient-to-r from-green-400 to-teal-500",
  },
  {
    id: "practice",
    titleKey: "roadmap.practiceTitle",
    descriptionKey: "roadmap.practiceDescription",
    icon: <FiEdit className="text-3xl text-white" />,
    gradient: "bg-gradient-to-r from-yellow-400 to-orange-500",
  },
  {
    id: "finalExam",
    titleKey: "roadmap.finalExamTitle",
    descriptionKey: "roadmap.finalExamDescription",
    icon: <FiCheckCircle className="text-3xl text-white" />,
    gradient: "bg-gradient-to-r from-red-400 to-pink-500",
  },
  {
    id: "certificate",
    titleKey: "roadmap.certificateTitle",
    descriptionKey: "roadmap.certificateDescription",
    icon: <FiAward className="text-3xl text-white" />,
    gradient: "bg-gradient-to-r from-purple-400 to-indigo-600",
  },
];

export default function Roadmap() {
  const { t, language } = useLanguage();
  const { categories } = useCategories();
  const [categorySearch, setCategorySearch] = useState("");
  const navigate = useNavigate();

  const categoryOptions = useMemo(
    () =>
      buildCategoryOptions({
        categories,
        language,
        t,
      }),
    [categories, language, t]
  );

  const filteredCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    if (!query) return categoryOptions;
    return categoryOptions.filter((category) =>
      category.label.toLowerCase().includes(query)
    );
  }, [categoryOptions, categorySearch]);

  function handleViewCategory(categoryId) {
    navigate(`/roadmap/category/${categoryId}`);
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-4 text-center">{t("roadmap.title")}</h1>
      <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
        {t("roadmap.description") || "مسیر یادگیری شما به شکل گام به گام."}
      </p>

{/* Timeline */}
<div className="relative mb-12 flex justify-between items-center">
  <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-300 -z-10"></div>
  {roadmapSteps.map((step, index) => (
    <div key={step.id} className="flex-1 flex flex-col items-center relative z-10">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center ${step.gradient} shadow-lg`}
      >
        {step.icon}
      </div>
      </div>
    ))}
</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {roadmapSteps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15 }}
          >
<Card className="hover:scale-105 transition-transform duration-300 shadow-md hover:shadow-xl border rounded-lg">
  <div className={`${step.gradient} rounded-t-lg p-4 flex justify-center`}>
    {step.icon}
  </div>
  <CardContent>
    <CardTitle className="text-xl font-semibold">{t(step.titleKey)}</CardTitle>
    <CardDescription className="text-gray-600">{t(step.descriptionKey)}</CardDescription>
  </CardContent>
</Card>

          </motion.div>
        ))}
      </div>

      <section className="mt-16 rounded-3xl border border-slate-200/60 bg-white/80 p-8 shadow-lg transition dark:border-slate-800/60 dark:bg-slate-900/60">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-3">
            {t("roadmap.customTitle") || "Build Your Personalized Roadmap"}
          </h2>
          <p className="text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
            {t("roadmap.customDescription") ||
              "Search a category to see curated milestones, skills, and courses tailored to that learning path."}
          </p>
        </div>

        <div className="mx-auto mb-8 max-w-xl">
          <Input
            value={categorySearch}
            onChange={(event) => setCategorySearch(event.target.value)}
            placeholder={t("roadmap.customSearchPlaceholder") || "Search categories"}
            className="h-12 rounded-2xl border-slate-200 px-5 text-base shadow-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>

        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
              <Card
                key={category.id}
                className="flex flex-col justify-between border border-slate-200/70 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800/70 dark:bg-slate-900"
              >
                <CardContent className="pt-6">
                  <CardTitle className="text-xl">{category.label}</CardTitle>
                  <CardDescription className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                    {t("roadmap.customCardDescription") ||
                      "View the recommended skills, milestones, and courses for this path."}
                  </CardDescription>
                </CardContent>
                <div className="p-6 pt-0">
                  <Button
                    className="w-full gap-2 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-500"
                    onClick={() => handleViewCategory(category.id)}
                  >
                    {t("roadmap.customViewButton") || "View Roadmap"}
                    <FiArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
            {t("roadmap.customEmptyState") || "No categories match your search."}
          </div>
        )}
      </section>
    </div>
  );
}
