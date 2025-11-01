import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, UserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
}

const ProtectedRoute = ({ 
  children, 
  requiredRole,
  redirectTo = "/auth" 
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading, hasRole } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(redirectTo);
    }
  }, [user, authLoading, navigate, redirectTo]);

  useEffect(() => {
    if (!authLoading && !roleLoading && user && requiredRole) {
      if (!hasRole(requiredRole)) {
        // Redirect based on role
        if (role === "cliente") {
          navigate("/catalogo");
        } else if (role === "funcionario" || role === "admin") {
          navigate("/dashboard");
        } else {
          navigate("/auth");
        }
      }
    }
  }, [user, role, authLoading, roleLoading, requiredRole, hasRole, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
