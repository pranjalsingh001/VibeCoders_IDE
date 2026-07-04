// src/router/ProtectedRoute.tsx
// --------------------------------
// Wraps around protected pages and redirects to login if not authenticated.

import { Navigate } from "react-router-dom";
import useAuthStore from "../stores/authStore";

interface Props {
  children: JSX.Element;
}

const ProtectedRoute = ({ children }: Props) => {
  const { isAuthenticated, loading } = useAuthStore();

  // Only skip auth in development mode with explicit flag
  const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true' && import.meta.env.DEV;

  if (loading) {
    return <div>Loading...</div>;
  }

  // Skip authentication check in development mode
  if (skipAuth) {
    console.log('🔧 Development mode: Skipping authentication check');
    return children;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
