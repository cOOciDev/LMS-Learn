// client/src/config/index.js
export const signUpFormControls = [
  {
    name: "userName",
    label: "User Name",
    placeholder: "Enter your user name",
    type: "text",
    componentType: "input",
  },
  {
    name: "userEmail",
    label: "User Email",
    placeholder: "Enter your user email",
    type: "email",
    componentType: "input",
  },
  {
    name: "password",
    label: "Password",
    placeholder: "Enter your password",
    type: "password",
    componentType: "input",
    showPasswordToggle: true,
  },
  {
    name: "role",
    label: "Role",
    placeholder: "Select user role",
    type: "text",
    componentType: "select",
    options: [
      { id: "user", label: "User" },
      { id: "instructor", label: "Instructor" },
      { id: "admin", label: "Admin" },
    ],
  },
];

export const signInFormControls = [
  {
    name: "userEmail",
    label: "User Email",
    placeholder: "Enter your user email",
    type: "email",
    componentType: "input",
  },
  {
    name: "password",
    label: "Password",
    placeholder: "Enter your password",
    type: "password",
    componentType: "input",
    showPasswordToggle: true,
  },
];

export const initialSignInFormData = {
  userEmail: "",
  password: "",
};

export const initialSignUpFormData = {
  userName: "",
  userEmail: "",
  password: "",
  role: "",
};

export const languageOptions = [
  { id: "english", label: "English" },
  { id: "persian", label: "Persian" },
];

export const courseLevelOptions = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

export const defaultCourseCategories = [
  { id: "web-development", labelKey: "categories.Web_Development", fallbackLabel: "Web Development" },
  { id: "backend-development", labelKey: "categories.Backend_Development", fallbackLabel: "Backend Development" },
  { id: "data-science", labelKey: "categories.Data_Science", fallbackLabel: "Data Science" },
  { id: "machine-learning", labelKey: "categories.Machine_Learning", fallbackLabel: "Machine Learning" },
  { id: "artificial-intelligence", labelKey: "categories.Artificial_Intelligence", fallbackLabel: "Artificial Intelligence" },
  { id: "cloud-computing", labelKey: "categories.Cloud_Computing", fallbackLabel: "Cloud Computing" },
  { id: "cyber-security", labelKey: "categories.Cyber_Security", fallbackLabel: "Cyber Security" },
  { id: "mobile-development", labelKey: "categories.Mobile_Development", fallbackLabel: "Mobile Development" },
  { id: "game-development", labelKey: "categories.Game_Development", fallbackLabel: "Game Development" },
  { id: "software-engineering", labelKey: "categories.Software_Engineering", fallbackLabel: "Software Engineering" },
];

export const courseLandingPageFormControls = ({
  categoryOptions = [],
  t,
} = {}) => [
  {
    name: "title",
    label: t?.("course.title") || "Title",
    componentType: "input",
    type: "text",
    placeholder: t?.("course.title") || "Enter course title",
    required: true   // اینو بذار برای فیلدهای اجباری
  },
  {
    name: "category",
    label: t?.("course.category") || "Category",
    componentType: "select",
    type: "text",
    placeholder: "",
    options: categoryOptions,
    required: true,
  },
  {
    name: "level",
    label: t?.("course.level") || "Level",
    componentType: "select",
    type: "text",
    placeholder: "",
    options: courseLevelOptions,
    required: true,
  },
  {
    name: "primaryLanguage",
    label: t?.("course.primaryLanguage") || "Primary Language",
    componentType: "select",
    type: "text",
    placeholder: "",
    options: languageOptions,
    required: true,
  },
  {
    name: "subtitle",
    label: t?.("course.subtitle") || "Subtitle",
    componentType: "input",
    type: "text",
    placeholder: t?.("course.subtitle") || "Enter course subtitle",
    required: true,
  },
  {
    name: "description",
    label: t?.("course.description") || "Description",
    componentType: "textarea",
    type: "text",
    placeholder: t?.("course.description") || "Enter course description",
    required: true,
  },
  {
    name: "pricing",
    label: t?.("course.price") || "Pricing",
    componentType: "input",
    type: "number",
    placeholder: t?.("course.price") || "Enter course pricing",
    required: true,

  },
  {
    name: "objectives",
    label: t?.("course.objectives") || "Objectives",
    componentType: "textarea",
    type: "text",
    placeholder: t?.("course.objectives") || "Enter course objectives",
    required: true,
  },
  {
    name: "welcomeMessage",
    label: t?.("course.welcomeMessage") || "Welcome Message",
    componentType: "textarea",
    placeholder: t?.("course.welcomeMessage") || "Welcome message for students",
    required: true,
  },
];

export const courseLandingInitialFormData = {
  title: "",
  category: "",
  level: "",
  primaryLanguage: "",
  subtitle: "",
  description: "",
  pricing: "",
  objectives: "",
  welcomeMessage: "",
  image: "",
};

export const courseCurriculumInitialFormData = [
  {
    title: "",
    videoUrl: "",
    videoFileKey: "",
    videoFileName: "",
    videoFileType: "",
    videoFileSize: 0,
    attachmentUrl: "",
    attachmentFileKey: "",
    attachmentFileName: "",
    attachmentFileType: "",
    attachmentFileSize: 0,
    freePreview: false,
    public_id: "",
  },
];

export const sortOptions = [
  { id: "price-lowtohigh", label: "Price: Low to High" },
  { id: "price-hightolow", label: "Price: High to Low" },
  { id: "title-atoz", label: "Title: A to Z" },
  { id: "title-ztoa", label: "Title: Z to A" },
];

export const buildFilterOptions = ({ categoryOptions = [] } = {}) => ({
  category: categoryOptions,
  level: courseLevelOptions,
  primaryLanguage: languageOptions,
});

export const roadmapSteps = [
  { id: "signUp", titleKey: "roadmap.signUpTitle", descriptionKey: "roadmap.signUpDescription" },
  { id: "startLearning", titleKey: "roadmap.startLearningTitle", descriptionKey: "roadmap.startLearningDescription" },
  { id: "practice", titleKey: "roadmap.practiceTitle", descriptionKey: "roadmap.practiceDescription" },
  { id: "finalExam", titleKey: "roadmap.finalExamTitle", descriptionKey: "roadmap.finalExamDescription" },
  { id: "certificate", titleKey: "roadmap.certificateTitle", descriptionKey: "roadmap.certificateDescription" }
];
