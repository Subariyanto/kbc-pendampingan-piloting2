import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  School,
  Users,
  KeyRound,
  ClipboardCheck,
  Target,
  HandHelping,
  Upload,
  TrendingUp,
  FileText,
  Sparkles,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  GraduationCap,
  BookOpen,
  PenSquare,
  RotateCcw,
  Lightbulb,
  Building2,
  UserCheck,
  Activity,
  Trees,
  Trophy,
  School2,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { ROLE_LABEL } from '../lib/constants';

const adminMenu = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/madrasah', label: 'Data Madrasah', icon: School },
  { to: '/users', label: 'Manajemen User', icon: Users },
  { to: '/kode-aktivasi', label: 'Kode Aktivasi', icon: KeyRound },
  { to: '/diagnosis', label: 'Diagnosis KBC', icon: ClipboardCheck },
  { to: '/rencana-aksi', label: 'Rencana Aksi', icon: Target },
  { to: '/pendampingan', label: 'Pendampingan', icon: HandHelping },
  { to: '/eviden', label: 'Upload Eviden', icon: Upload },
  { to: '/monitoring', label: 'Monitoring Skor', icon: TrendingUp },
  { to: '/laporan', label: 'Laporan', icon: FileText },
  { to: '/praktik-baik', label: 'Praktik Baik', icon: Sparkles },
  { to: '/pengaturan', label: 'Pengaturan', icon: Settings },
];

const pengawasMenu = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/madrasah', label: 'Madrasah Binaan', icon: School },
  { to: '/diagnosis', label: 'Diagnosis Awal', icon: ClipboardCheck },
  { to: '/rencana-aksi', label: 'Rencana Aksi', icon: Target },
  { to: '/pendampingan?tahap=intra', label: 'Intrakurikuler', icon: BookOpen, match: { path: '/pendampingan', query: { tahap: 'intra' } } },
  { to: '/pendampingan?tahap=koku', label: 'Kokurikuler', icon: Activity, match: { path: '/pendampingan', query: { tahap: 'koku' } } },
  { to: '/pendampingan?tahap=ekstra', label: 'Ekstrakurikuler', icon: Trophy, match: { path: '/pendampingan', query: { tahap: 'ekstra' } } },
  { to: '/pendampingan?tahap=budaya', label: 'Budaya Madrasah', icon: Trees, match: { path: '/pendampingan', query: { tahap: 'budaya' } } },
  { to: '/eviden', label: 'Upload Eviden', icon: Upload },
  { to: '/monitoring', label: 'Monitoring Skor', icon: TrendingUp },
  { to: '/rekomendasi', label: 'Rekomendasi', icon: Lightbulb },
  { to: '/laporan', label: 'Laporan', icon: FileText },
];

const kepalaMenu = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/profil-madrasah', label: 'Profil Madrasah', icon: Building2 },
  { to: '/tim-kbc', label: 'Tim Inti KBC', icon: UserCheck },
  { to: '/rencana-aksi', label: 'Rencana Aksi', icon: Target },
  { to: '/eviden', label: 'Upload Eviden', icon: Upload },
  { to: '/laporan', label: 'Laporan', icon: FileText },
  { to: '/rekomendasi', label: 'Rekomendasi', icon: Lightbulb },
];

const guruMenu = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/perangkat-ajar', label: 'Perangkat Ajar', icon: GraduationCap },
  { to: '/jurnal', label: 'Jurnal', icon: PenSquare },
  { to: '/refleksi', label: 'Refleksi', icon: RotateCcw },
  { to: '/eviden', label: 'Upload Eviden', icon: Upload },
  { to: '/rekomendasi', label: 'Rekomendasi', icon: Lightbulb },
];

function getMenu(role) {
  switch (role) {
    case 'admin': return adminMenu;
    case 'pengawas': return pengawasMenu;
    case 'kepala_madrasah': return kepalaMenu;
    case 'guru': return guruMenu;
    default: return [];
  }
}

export default function AppLayout() {
  const { profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const role = isAdmin ? 'admin' : profile?.role;
  const menu = getMenu(role);
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [profile?.id]);

  // Close mobile drawer on navigation change
  useEffect(() => { setOpen(false); }, [location.pathname, location.search]);

  const isMenuActive = (m) => {
    if (m.match) {
      if (location.pathname !== m.match.path) return false;
      const sp = new URLSearchParams(location.search);
      return Object.entries(m.match.query || {}).every(([k, v]) => sp.get(k) === v);
    }
    // For routes that have submenus with ?tahap=xxx, only match exact (no query string)
    if (m.to === '/pendampingan' && location.pathname === '/pendampingan') {
      return !location.search;
    }
    if (m.to === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname === m.to || location.pathname.startsWith(m.to + '/');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-primary-800 text-white transform transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 px-5 flex items-center gap-3 border-b border-primary-700">
          <div className="w-9 h-9 rounded-lg bg-gold-500 text-primary-900 flex items-center justify-center font-bold">
            <School2 size={20} />
          </div>
          <div>
            <div className="font-bold leading-tight">KBC Piloting</div>
            <div className="text-xs text-primary-200">Pendampingan Madrasah</div>
          </div>
          <button
            className="lg:hidden ml-auto p-1 rounded hover:bg-primary-700"
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <nav className="p-2.5 overflow-y-auto h-[calc(100vh-4rem)]">
          {menu.map((m) => {
            const active = isMenuActive(m);
            return (
              <NavLink
                key={m.to + m.label}
                to={m.to}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] mb-0.5 transition-colors leading-tight ${
                  active
                    ? 'bg-primary-700 text-white font-medium'
                    : 'text-primary-100 hover:bg-primary-700/60'
                }`}
              >
                <m.icon size={17} className="shrink-0" />
                <span className="flex-1 min-w-0">{m.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <header className="app-header sticky top-0 z-30 bg-white border-b border-slate-200 h-16 px-4 lg:px-6 flex items-center gap-3">
          <button
            className="lg:hidden p-2 rounded hover:bg-slate-100"
            onClick={() => setOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="font-semibold text-slate-800 truncate">
            Aplikasi Pendampingan KBC Madrasah Piloting
          </div>
          <div className="ml-auto relative">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100"
            >
              <div className="w-8 h-8 rounded-full bg-primary-700 text-white flex items-center justify-center text-sm font-semibold">
                {(profile?.nama || profile?.email || 'U')[0].toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-slate-800 leading-tight">
                  {profile?.nama || profile?.email}
                </div>
                <div className="text-xs text-slate-500 leading-tight">
                  {ROLE_LABEL[role] || role}
                </div>
              </div>
              <ChevronDown size={16} className="text-slate-500" />
            </button>
            {userMenuOpen && (
              <div
                className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1"
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <LogOut size={16} /> Keluar
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 max-w-full">
          <Outlet />
        </main>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
