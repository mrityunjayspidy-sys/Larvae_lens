import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="card max-w-md text-center p-8 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-canvas text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
          <HelpCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-navy">404 • Page Not Found</h1>
          <p className="text-xs text-slate-500">
            The requested surveillance route or evidence report does not exist.
          </p>
        </div>
        <div className="pt-2">
          <Link to="/" className="btn-primary text-xs mx-auto inline-flex">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
