import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}