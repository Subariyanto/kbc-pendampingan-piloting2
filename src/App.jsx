import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { ProtectedRoute, RoleGuard } from './components/guards';

import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import LupaPassword from './pages/LupaPassword';
import Aktivasi from './pages/Aktivasi';
import Dashboard from './pages/Dashboard';
import Madrasah from './pages/Madrasah';
import Users from './pages/Users';
import KodeAktivasi from './pages/KodeAktivasi';
import Diagnosis from './pages/Diagnosis';
import RencanaAksi from './pages/RencanaAksi';
import Pendampingan from './pages/Pendampingan';
import Eviden from './pages/Eviden';
import Monitoring from './pages/Monitoring';
import Laporan from './pages/Laporan';
import PraktikBaik from './pages/PraktikBaik';
import Pengaturan from './pages/Pengaturan';
import Rekomendasi from './pages/Rekomendasi';
import ProfilMadrasah from './pages/ProfilMadrasah';
import TimKBC from './pages/TimKBC';
import PerangkatAjar from './pages/PerangkatAjar';
import Jurnal from './pages/Jurnal';
import Refleksi from './pages/Refleksi';

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/lupa-password" element={<LupaPassword />} />
          <Route path="/aktivasi" element={<Aktivasi />} />

          {/* Protected app */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="madrasah" element={<Madrasah />} />
            <Route path="users" element={<RoleGuard allow={['admin']}><Users /></RoleGuard>} />
            <Route path="aktivasi-kode" element={<RoleGuard allow={['admin']}><KodeAktivasi /></RoleGuard>} />
            <Route path="aktivasi" element={<RoleGuard allow={['admin']}><KodeAktivasi /></RoleGuard>} />
            <Route path="diagnosis" element={<Diagnosis />} />
            <Route path="rencana-aksi" element={<RencanaAksi />} />
            <Route path="pendampingan" element={<Pendampingan />} />
            <Route path="eviden" element={<Eviden />} />
            <Route path="monitoring" element={<Monitoring />} />
            <Route path="rekomendasi" element={<Rekomendasi />} />
            <Route path="laporan" element={<Laporan />} />
            <Route path="praktik-baik" element={<PraktikBaik />} />
            <Route path="pengaturan" element={<RoleGuard allow={['admin']}><Pengaturan /></RoleGuard>} />
            <Route path="profil-madrasah" element={<ProfilMadrasah />} />
            <Route path="tim-kbc" element={<TimKBC />} />
            <Route path="perangkat-ajar" element={<PerangkatAjar />} />
            <Route path="jurnal" element={<Jurnal />} />
            <Route path="refleksi" element={<Refleksi />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
