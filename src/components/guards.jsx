import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Loading } from './ui';

export function ProtectedRoute({ children }) {
  const { session, loading, isActive, profile, configured } = useAuth();
  const location = useLocation();

  if (!configured) return <Navigate to="/login" replace state={{ from: location }} />;
  if (loading) return <Loading label="Memeriksa sesi..." />;
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!isActive && profile) return <Navigate to="/aktivasi" replace />;
  return children;
}

export function RoleGuard({ allow, children }) {
  const { isAdmin, role } = useAuth();
  const effective = isAdmin ? 'admin' : role;
  if (!allow.includes(effective)) {
    return (
      <div className="card text-center py-10">
        <div className="text-lg font-semibold text-slate-700">Akses Ditolak</div>
        <div className="text-sm text-slate-500 mt-1">Halaman ini tidak tersedia untuk peran Anda.</div>
      </div>
    );
  }
  return children;
}
