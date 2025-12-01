import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getPublicCategoriesService } from "@/services";

const CategoryContext = createContext(null);

export default function CategoryProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getPublicCategoriesService();
      if (response?.success) {
        setCategories(response?.data?.categories || []);
      } else {
        setCategories([]);
      }
      setError(null);
    } catch (err) {
      console.error("Failed to load categories:", err);
      setCategories([]);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <CategoryContext.Provider
      value={{
        categories,
        loading,
        error,
        refreshCategories: fetchCategories,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error("useCategories must be used within CategoryProvider");
  }
  return context;
};
