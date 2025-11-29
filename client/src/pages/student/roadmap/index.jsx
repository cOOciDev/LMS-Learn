// client/src/pages/student/roadmap/index.jsx
"use client";

import React from "react";
import { useLanguage } from "@/context/language-context";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { FiUserPlus, FiBookOpen, FiEdit, FiCheckCircle, FiAward } from "react-icons/fi";
import { motion } from "framer-motion";

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
  const { t } = useLanguage();

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
    </div>
  );
}
