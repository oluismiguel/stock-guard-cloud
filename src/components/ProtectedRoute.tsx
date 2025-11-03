import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

const ProtectedRoute = ({ 
  children, 
  allowedRoles,
  redirectTo = "/auth" 
}: ProtectedRouteProps) => {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate(redirectTo);
      } else if (allowedRoles && role && !allowedRoles.includes(role)) {
        // Redirect based on role if not allowed
        if (role === 'cliente') {
          navigate('/catalogo');
        } else if (role === 'funcionario') {
          navigate('/products');
        } else if (role === 'gerente') {
          navigate('/dashboard');
        } else {
          navigate('/');
        }
      }
    }
  }, [user, loading, role, allowedRoles, navigate, redirectTo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
