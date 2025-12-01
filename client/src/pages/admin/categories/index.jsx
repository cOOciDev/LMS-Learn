import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createCategoryService,
  deleteCategoryService,
  getAdminCategoriesService,
} from "@/services";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";
import { useCategories } from "@/context/category-context";

function AdminCategoryManagement() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { refreshCategories } = useCategories();

  const [formData, setFormData] = useState({
    name: "",
    nameFa: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchAdminCategories();
  }, []);

  async function fetchAdminCategories() {
    setLoading(true);
    try {
      const response = await getAdminCategoriesService();
      if (response?.success) {
        setCategories(response?.data?.categories || []);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast({
        title: t("common.error") || "Error",
        description: t("admin.failedToLoadCategories") || "Unable to load categories.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: t("common.error") || "Error",
        description: t("admin.categoryNameRequired") || "Category name is required.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        nameFa: formData.nameFa.trim(),
        description: formData.description.trim(),
      };
      const response = await createCategoryService(payload);
      if (response?.success) {
        toast({
          title: t("common.success") || "Success",
          description: t("admin.categoryCreated") || "Category created successfully.",
        });
        setFormData({ name: "", nameFa: "", description: "" });
        await Promise.all([fetchAdminCategories(), refreshCategories()]);
      }
    } catch (error) {
      toast({
        title: t("common.error") || "Error",
        description:
          error?.response?.data?.message ||
          t("admin.failedToCreateCategory") ||
          "Unable to create category.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(categoryId) {
    const confirmed = window.confirm(
      t("admin.deleteCategoryConfirm") ||
        "Are you sure you want to delete this category?"
    );
    if (!confirmed) return;

    setDeletingId(categoryId);
    try {
      const response = await deleteCategoryService(categoryId);
      if (response?.success) {
        toast({
          title: t("common.success") || "Success",
          description:
            t("admin.categoryDeleted") || "Category deleted successfully.",
        });
        await Promise.all([fetchAdminCategories(), refreshCategories()]);
      }
    } catch (error) {
      toast({
        title: t("common.error") || "Error",
        description:
          error?.response?.data?.message ||
          t("admin.failedToDeleteCategory") ||
          "Unable to delete category.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(value) {
    if (!value) return "--";
    return new Date(value).toLocaleDateString();
  }

  const localizedCategories = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        localizedName:
          language === "fa"
            ? category?.translations?.fa || category.name
            : category.name,
      })),
    [categories, language]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {t("admin.categoryManagement") || "Category Management"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t("admin.categoryManagementDescription") ||
            "Create, view, and delete course categories."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {t("admin.addCategory") || "Add New Category"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t("admin.categoryName") || "Category Name (English)"}
                </label>
                <Input
                  value={formData.name}
                  onChange={(event) =>
                    setFormData({ ...formData, name: event.target.value })
                  }
                  placeholder="e.g. Web Development"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t("admin.categoryNameFa") || "Category Name (Persian)"}
                </label>
                <Input
                  value={formData.nameFa}
                  onChange={(event) =>
                    setFormData({ ...formData, nameFa: event.target.value })
                  }
                  placeholder="نام دسته‌بندی"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t("admin.categoryDescription") || "Description"}
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      description: event.target.value,
                    })
                  }
                  placeholder="Short summary about this category"
                />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? t("common.loading") || "Saving..."
                  : t("admin.saveCategory") || "Save Category"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.categoryTips") || "Why categories matter"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              {t("admin.categoryTipsBody") ||
                "Categories help students quickly find the courses that match their interests. Keep names short, meaningful, and provide localized titles when possible."}
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                {t("admin.categoryTipOne") ||
                  "Avoid duplicates and prefer consistent wording."}
              </li>
              <li>
                {t("admin.categoryTipTwo") ||
                  "Only delete categories that are not assigned to any course."}
              </li>
              <li>
                {t("admin.categoryTipThree") ||
                  "Provide a Persian translation so learners see localized names."}
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.categoriesList") || "Existing Categories"}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              {t("common.loading") || "Loading..."}
            </div>
          ) : localizedCategories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("admin.noCategories") || "No categories created yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.categoryName") || "Name"}</TableHead>
                    <TableHead>{t("admin.categorySlug") || "Slug"}</TableHead>
                    <TableHead>{t("admin.categoryCourses") || "Courses"}</TableHead>
                    <TableHead>{t("admin.createdAt") || "Created"}</TableHead>
                    <TableHead className="text-right">
                      {t("common.actions") || "Actions"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localizedCategories.map((category) => (
                    <TableRow key={category._id}>
                      <TableCell className="font-semibold">
                        <div>{category.localizedName}</div>
                        {category.translations?.fa && language !== "fa" ? (
                          <p className="text-xs text-muted-foreground">
                            {category.translations.fa}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>{category.slug}</TableCell>
                      <TableCell>{category.courseCount || 0}</TableCell>
                      <TableCell>{formatDate(category.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(category._id)}
                          disabled={deletingId === category._id}
                        >
                          {deletingId === category._id
                            ? t("common.loading") || "Deleting..."
                            : t("common.delete") || "Delete"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminCategoryManagement;
