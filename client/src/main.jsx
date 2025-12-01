import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/main.scss";
import { BrowserRouter } from "react-router-dom";
import AuthProvider from "./context/auth-context/index.jsx";
import InstructorProvider from "./context/instructor-context/index.jsx";
import StudentProvider from "./context/student-context/index.jsx";
import LanguageProvider from "./context/language-context/index.jsx";
import ThemeProvider from "./context/theme-context/index.jsx";
import { Toaster } from "@/components/ui/toaster";
import CategoryProvider from "./context/category-context";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ThemeProvider>
      <LanguageProvider>
        <CategoryProvider>
          <AuthProvider>
            <InstructorProvider>
              <StudentProvider>
                <App />
                <Toaster />
              </StudentProvider>
            </InstructorProvider>
          </AuthProvider>
        </CategoryProvider>
      </LanguageProvider>
    </ThemeProvider>
  </BrowserRouter>
);
