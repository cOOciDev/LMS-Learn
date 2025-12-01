import { defaultCourseCategories } from "@/config";

export function buildCategoryOptions({ categories = [], language = "en", t } = {}) {
  if (Array.isArray(categories) && categories.length > 0) {
    return categories.map((category) => ({
      id: category.slug,
      label:
        language === "fa"
          ? category?.translations?.fa || category.name
          : category.name,
    }));
  }

  return defaultCourseCategories.map((category) => ({
    id: category.id,
    label: t?.(category.labelKey) || category.fallbackLabel,
  }));
}
