import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const ForbiddenPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="card max-w-md text-center p-8 space-y-4 border-healthRed/30">
        <div className="w-14 h-14 rounded-2xl bg-healthRed-light text-healthRed flex items-center justify-center mx-auto border border-healthRed/20">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-navy">403 • Access Restricted</h1>
          <p className="text-xs text-slate-500">
            You do not have the required permissions to view this resource. This view is restricted to certified Entomologist Reviewers and Administrators.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/settings" className="btn-secondary text-xs inline-flex items-center gap-1.5">
            Switch Session Role
          </Link>
          <Link to="/" className="btn-primary text-xs inline-flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
