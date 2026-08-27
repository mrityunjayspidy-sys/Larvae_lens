import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface border-t border-slate-200 mt-12 py-8 text-xs text-slate-500 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-navy-light font-medium">
            <ShieldCheck className="w-4 h-4 text-teal" />
            <span>LarvaLens • Video-Based Probable Mosquito-Larva Surveillance</span>
          </div>

          <div className="flex items-center gap-1.5 text-center text-[11px] text-slate-500 max-w-xl">
            <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span>
              <strong>Public Health Screening Disclaimer:</strong> LarvaLens provides automated probable screening and surveillance evidence. It is not a medical diagnosis or definitive species identification system.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
