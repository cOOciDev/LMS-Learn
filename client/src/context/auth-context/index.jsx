import { Skeleton } from "@/components/ui/skeleton";
import { initialSignInFormData, initialSignUpFormData } from "@/config";
import { checkAuthService, loginService, registerService } from "@/services";
import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [signInFormData, setSignInFormData] = useState(initialSignInFormData);
  const [signUpFormData, setSignUpFormData] = useState(initialSignUpFormData);
  const [auth, setAuth] = useState({
    authenticate: false,
    user: null,
  });
  const [loading, setLoading] = useState(true);

  async function handleRegisterUser(event) {
    event.preventDefault();
    const data = await registerService(signUpFormData);
  }

  async function handleLoginUser(event) {
    event.preventDefault();
    try {
      const data = await loginService(signInFormData);

      if (data?.success) {
        // Store tokens
        sessionStorage.setItem(
          "accessToken",
          JSON.stringify(data.data.accessToken)
        );
        if (data.data.refreshToken) {
          sessionStorage.setItem(
            "refreshToken",
            JSON.stringify(data.data.refreshToken)
          );
        }
        
        // Update auth state
        const userData = data.data.user;
        setAuth({
          authenticate: true,
          user: userData,
        });
        
        // Reset form
        setSignInFormData(initialSignInFormData);
        
        return { 
          success: true, 
          message: data.message || "Login successful",
          user: userData // Return user data for navigation
        };
      } else {
        setAuth({
          authenticate: false,
          user: null,
        });
        return { 
          success: false, 
          message: data?.message || "Login failed. Please try again." 
        };
      }
    } catch (error) {
      setAuth({
        authenticate: false,
        user: null,
      });
      return { 
        success: false, 
        message: error?.response?.data?.message || "An error occurred. Please try again." 
      };
    }
  }

  //check auth user

  async function checkAuthUser() {
    try {
      const data = await checkAuthService();
      if (data?.success) {
        setAuth({
          authenticate: true,
          user: data.data?.user,
        });
      } else {
        setAuth({
          authenticate: false,
          user: null,
        });
      }
    } catch (error) {
      console.error("Auth check error:", error);
      // Clear tokens if check fails
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");
      setAuth({
        authenticate: false,
        user: null,
      });
    } finally {
      setLoading(false);
    }
  }

  function resetCredentials() {
    setAuth({
      authenticate: false,
      user: null,
    });
  }

  useEffect(() => {
    checkAuthUser();
  }, []);


  return (
    <AuthContext.Provider
      value={{
        signInFormData,
        setSignInFormData,
        signUpFormData,
        setSignUpFormData,
        handleRegisterUser,
        handleLoginUser,
        auth,
        resetCredentials,
      }}
    >
      {loading ? <Skeleton /> : children}
    </AuthContext.Provider>
  );
}
