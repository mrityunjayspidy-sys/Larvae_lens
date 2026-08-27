import React from 'react';
import { Lock, User, Users, Cpu, CheckCircle2, ShieldCheck } from 'lucide-react';
import { UserRole } from '../../types';

interface RoleSwitcherProps {
  currentRole: UserRole;
  onRoleChange?: (role: UserRole) => void;
  disabled?: boolean;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentRole,
}) => {
  const roleDescriptions: Record<string, { title: string; desc: string; icon: React.ReactNode; permissions: string[] }> = {
    citizen: {
      title: 'Citizen / Resident User',
      desc: 'Screen home standing water containers, view personal scan history, and check public vector hotspot surveillance maps.',
      icon: <User className="w-5 h-5 text-teal-600" />,
      permissions: [
        'Upload & analyze standing water photo/video captures',
        'Inspect personal scan history & detection verdicts',
        'View regional hotspot surveillance maps',
        'Receive home vector source reduction advice'
      ]
    },
    field_worker: {
      title: 'Field Abatement Worker',
      desc: 'Assigned to inspect positive citizen detections on-site, apply biological/chemical larvicide, and log treatment records.',
      icon: <Users className="w-5 h-5 text-teal-600" />,
      permissions: [
        'Access dispatched citizen positive larva detections with GPS',
        'Accept tasks and update on-site inspection status',
        'Log larvicide chemical treatments (Bti/Temephos) and dosage',
        'Mark vector abatement work completed'
      ]
    },
    admin: {
      title: 'Surveillance Administrator',
      desc: 'Panoramic command authority: dispatch abatement tasks to workers, manage model checkpoints, and monitor system KPIs.',
      icon: <Cpu className="w-5 h-5 text-teal-600" />,
      permissions: [
        'Dispatch positive citizen detections to available field workers',
        'Track real-time field worker availability & task progress',
        'Access all municipal surveillance data and history',
        'Manage AI model manifests and runtime hash integrity'
      ]
    }
  };

  const current = roleDescriptions[currentRole] || roleDescriptions.citizen;

  return (
    <div className="card space-y-4 bg-white border border-slate-200/90 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black shadow-2xs">
            <Lock className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              Account Operational Role
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Permanently bound to your registration credentials
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-900 text-white uppercase font-mono shadow-2xs">
            {currentRole.replace(/_/g, ' ')}
          </span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1">
            <Lock className="w-3 h-3 text-slate-500" /> Role Locked
          </span>
        </div>
      </div>

      <div className="p-4 rounded-card bg-slate-50 border border-slate-200 space-y-3">
        <div className="flex items-center gap-2">
          {current.icon}
          <h4 className="text-sm font-black text-slate-900">{current.title}</h4>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          {current.desc}
        </p>

        <div className="pt-2 border-t border-slate-200">
          <span className="text-[11px] font-black text-slate-900 block mb-2">
            Authorized System Privileges:
          </span>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
            {current.permissions.map((perm, idx) => (
              <li key={idx} className="flex items-start gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{perm}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="p-3 rounded-control bg-teal-50/80 border border-teal-200 text-xs text-teal-900 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
        <span>To operate with a different role, please sign in or register with an authorized role account.</span>
      </div>
    </div>
  );
};
