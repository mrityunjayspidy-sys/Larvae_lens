import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { 
  Camera, 
  History, 
  MapPin, 
  Settings, 
  LayoutDashboard, 
  Users, 
  Cpu 
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe shadow-lg"
    >
      {/* 1. Citizen Mobile Nav (5 Items with Scan) */}
      {user.role === 'citizen' && (
        <div className="grid grid-cols-5 h-16 max-w-md mx-auto items-center px-1">
          <Link
            to="/dashboard/citizen"
            className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-all ${
              isActive('/dashboard/citizen') ? 'text-slate-900 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className={`p-1.5 rounded-full transition-all ${isActive('/dashboard/citizen') ? 'bg-slate-900 text-white shadow-sm' : ''}`}>
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold">Home</span>
          </Link>

          <Link
            to="/scan"
            className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-all ${
              isActive('/scan') ? 'text-slate-900 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className={`p-1.5 rounded-full transition-all ${isActive('/scan') ? 'bg-slate-900 text-white shadow-sm' : ''}`}>
              <Camera className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold">Scan</span>
          </Link>

          <Link
            to="/history"
            className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-all ${
              isActive('/history') ? 'text-slate-900 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className={`p-1.5 rounded-full transition-all ${isActive('/history') ? 'bg-slate-900 text-white shadow-sm' : ''}`}>
              <History className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold">History</span>
          </Link>

          <Link
            to="/map"
            className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-all ${
              isActive('/map') ? 'text-slate-900 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className={`p-1.5 rounded-full transition-all ${isActive('/map') ? 'bg-slate-900 text-white shadow-sm' : ''}`}>
              <MapPin className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold">Hotspots</span>
          </Link>

          <Link
            to="/settings"
            className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-all ${
              isActive('/settings') ? 'text-slate-900 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className={`p-1.5 rounded-full transition-all ${isActive('/settings') ? 'bg-slate-900 text-white shadow-sm' : ''}`}>
              <Settings className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold">Profile</span>
          </Link>
        </div>
      )}

      {/* 2. Field Worker Mobile Nav (3 Items, NO Scan) */}
      {user.role === 'field_worker' && (
        <div className="grid grid-cols-3 h-16 max-w-md mx-auto items-center px-4">
          <Link
            to="/dashboard/field-worker"
            className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-all ${
              isActive('/dashboard/field-worker') ? 'text-slate-900 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className={`p-1.5 rounded-full transition-all ${isActive('/dashboard/field-worker') ? 'bg-slate-900 text-white shadow-sm' : ''}`}>
              <Users className="w-4 h-4 text-teal-400" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold">Field Tasks</span>
          </Link>

          <Link
            to="/map"
            className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-all ${
              isActive('/map') ? 'text-slate-900 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className={`p-1.5 rounded-full transition-all ${isActive('/map') ? 'bg-slate-900 text-white shadow-sm' : ''}`}>
              <MapPin className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold">Hotspots</span>
          </Link>

          <Link
            to="/settings"
            className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-all ${
              isActive('/settings') ? 'text-slate-900 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className={`p-1.5 rounded-full transition-all ${isActive('/settings') ? 'bg-slate-900 text-white shadow-sm' : ''}`}>
              <Settings className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold">Profile</span>
          </Link>
        </div>
      )}

      {/* 3. Admin Mobile Nav */}
      {user.role === 'admin' && (
        <div className="grid grid-cols-5 h-16 max-w-md mx-auto items-center px-1">
          <Link
            to="/dashboard/admin"
            className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-all ${
              isActive('/dashboard/admin') ? 'text-slate-900 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className={`p-1.5 rounded-full transition-all ${isActive('/dashboard/admin') ? 'bg-slate-900 text-white shadow-sm' : ''}`}>
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold">Command</span>
          </Link>

          <Link
            to="/scan"
            className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-all ${
              isActive('/scan') ? 'text-slate-900 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className={`p-1.5 rounded-full transition-all ${isActive('/scan') ? 'bg-slate-900 text-white shadow-sm' : ''}`}>
              <Camera className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold">Scan</span>
          </Link>

          <Link
            to="/admin/models"
            className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-all ${
              isActive('/admin/models') ? 'text-slate-900 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className={`p-1.5 rounded-full transition-all ${isActive('/admin/models') ? 'bg-slate-900 text-white shadow-sm' : ''}`}>
              <Cpu className="w-4 h-4 text-teal-400" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold">Models</span>
          </Link>

          <Link
            to="/map"
            className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-all ${
              isActive('/map') ? 'text-slate-900 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className={`p-1.5 rounded-full transition-all ${isActive('/map') ? 'bg-slate-900 text-white shadow-sm' : ''}`}>
              <MapPin className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold">Hotspots</span>
          </Link>

          <Link
            to="/settings"
            className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-all ${
              isActive('/settings') ? 'text-slate-900 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className={`p-1.5 rounded-full transition-all ${isActive('/settings') ? 'bg-slate-900 text-white shadow-sm' : ''}`}>
              <Settings className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold">Profile</span>
          </Link>
        </div>
      )}
    </nav>
  );
};
