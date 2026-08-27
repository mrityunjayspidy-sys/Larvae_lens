import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { 
  Camera, 
  History, 
  MapPin, 
  Cpu, 
  LogOut,
  LayoutDashboard,
  Users
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-all">
              <Camera className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1">
                Larva<span className="text-teal-600 font-bold">Lens</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                Vector Surveillance
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links (Role Tailored) */}
          <nav className="hidden md:flex items-center gap-1.5">
            {user && (
              <>
                {/* Citizen Navigation (Has Scan) */}
                {user.role === 'citizen' && (
                  <>
                    <Link
                      to="/dashboard/citizen"
                      className={`px-3.5 py-2 rounded-control text-xs font-bold flex items-center gap-2 transition-all ${
                        isActive('/dashboard/citizen') || isActive('/')
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>

                    <Link
                      to="/scan"
                      className={`px-3.5 py-2 rounded-control text-xs font-bold flex items-center gap-2 transition-all ${
                        isActive('/scan')
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Camera className="w-4 h-4 text-teal-600" />
                      Check Water
                    </Link>

                    <Link
                      to="/history"
                      className={`px-3.5 py-2 rounded-control text-xs font-bold flex items-center gap-2 transition-all ${
                        isActive('/history')
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <History className="w-4 h-4" />
                      My History
                    </Link>

                    <Link
                      to="/map"
                      className={`px-3.5 py-2 rounded-control text-xs font-bold flex items-center gap-2 transition-all ${
                        isActive('/map')
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      Hotspot Map
                    </Link>
                  </>
                )}

                {/* Field Worker Navigation (NO Scan/Upload Access) */}
                {user.role === 'field_worker' && (
                  <>
                    <Link
                      to="/dashboard/field-worker"
                      className={`px-3.5 py-2 rounded-control text-xs font-bold flex items-center gap-2 transition-all ${
                        isActive('/dashboard/field-worker') || isActive('/')
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Users className="w-4 h-4 text-teal-400" />
                      Field Tasks
                    </Link>

                    <Link
                      to="/map"
                      className={`px-3.5 py-2 rounded-control text-xs font-bold flex items-center gap-2 transition-all ${
                        isActive('/map')
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      Hotspot Map
                    </Link>
                  </>
                )}

                {/* Admin Navigation */}
                {user.role === 'admin' && (
                  <>
                    <Link
                      to="/dashboard/admin"
                      className={`px-3.5 py-2 rounded-control text-xs font-bold flex items-center gap-2 transition-all ${
                        isActive('/dashboard/admin') || isActive('/')
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Command Center
                    </Link>

                    <Link
                      to="/scan"
                      className={`px-3.5 py-2 rounded-control text-xs font-bold flex items-center gap-2 transition-all ${
                        isActive('/scan')
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Camera className="w-4 h-4 text-teal-600" />
                      Check Water
                    </Link>

                    <Link
                      to="/admin/models"
                      className={`px-3.5 py-2 rounded-control text-xs font-bold flex items-center gap-2 transition-all ${
                        isActive('/admin/models')
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Cpu className="w-4 h-4 text-teal-600" />
                      Models
                    </Link>

                    <Link
                      to="/map"
                      className={`px-3.5 py-2 rounded-control text-xs font-bold flex items-center gap-2 transition-all ${
                        isActive('/map')
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      Hotspots
                    </Link>
                  </>
                )}
              </>
            )}

            {!user && (
              <Link
                to="/map"
                className={`px-3.5 py-2 rounded-control text-xs font-bold flex items-center gap-2 transition-all ${
                  isActive('/map') ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <MapPin className="w-4 h-4" />
                Hotspot Map
              </Link>
            )}
          </nav>

          {/* User Account Action */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/settings"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-control text-xs font-bold bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 transition-all"
                  title="Profile and Role"
                >
                  <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-[10px]">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline">{user.full_name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-slate-700 border border-slate-300 uppercase">
                    {user.role.replace(/_/g, ' ')}
                  </span>
                </Link>

                <button
                  onClick={() => {
                    signOut();
                    navigate('/');
                  }}
                  className="p-2 rounded-control text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary text-xs py-2 px-5 min-h-[38px]">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
