import React from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { ProfileCard, RoleSwitcher } from '../features/profile';
import { User, LogOut, Info } from 'lucide-react';
import { UserRole } from '../types';

export const SettingsPage: React.FC = () => {
  const { user, signOut, switchRoleForDemo } = useAuth();

  if (!user) return null;

  const handleRoleChange = async (newRole: UserRole) => {
    if (switchRoleForDemo) {
      await switchRoleForDemo(newRole);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 py-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy flex items-center gap-2.5">
          <User className="w-7 h-7 text-primary" />
          Field Profile & Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Account credentials, role authorization, and surveillance privacy configurations.
        </p>
      </div>

      {/* Modular Profile Card */}
      <ProfileCard user={user} />

      {/* Modular Role Switcher */}
      <RoleSwitcher
        currentRole={user.role}
        onRoleChange={handleRoleChange}
      />

      {/* Privacy Policy */}
      <div className="card bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-navy">
          <Info className="w-4 h-4 text-teal" />
          <span>Surveillance Data Governance Notice</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          LarvaLens handles stagnant-water video footage strictly for vector surveillance and debris verification. Private home coordinates are aggregated into regional cluster cells. All human review determinations are logged separately to preserve original model evidence immutability.
        </p>
      </div>

      {/* Sign Out Action */}
      <div className="pt-2">
        <button
          onClick={() => signOut()}
          className="p-3 rounded-control bg-healthRed-light hover:bg-healthRed/20 text-healthRed border border-healthRed/30 text-xs font-bold w-full flex items-center justify-center gap-2 transition-colors min-h-[44px]"
        >
          <LogOut className="w-4 h-4" />
          Sign Out of Field Session
        </button>
      </div>
    </div>
  );
};
