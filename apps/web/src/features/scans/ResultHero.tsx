import React from 'react';
import { AlertTriangle, CheckCircle, Info, Activity, Filter, Layers } from 'lucide-react';
import { ScanDetail } from '../../types';

interface ResultHeroProps {
  scan: ScanDetail;
}

export const ResultHero: React.FC<ResultHeroProps> = ({ scan }) => {
  const probableCount = scan.probable_larvae_count ?? 0;
  const rejectedCount = scan.rejected_tracks ?? 0;
  const confidencePct = scan.overall_confidence ? Math.round(scan.overall_confidence * 100) : 0;
  const risk = scan.risk_level || 'none_observed';

  const getRiskBadge = () => {
    switch (risk) {
      case 'high':
        return (
          <span className="badge-high">
            <AlertTriangle className="w-3.5 h-3.5" />
            High Risk Band (≥6 Larvae)
          </span>
        );
      case 'medium':
        return (
          <span className="badge-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            Medium Risk Band (3–5 Larvae)
          </span>
        );
      case 'low':
        return (
          <span className="badge-low">
            <Activity className="w-3.5 h-3.5" />
            Low Risk Band (1–2 Larvae)
          </span>
        );
      case 'none_observed':
      default:
        return (
          <span className="badge-none">
            <CheckCircle className="w-3.5 h-3.5" />
            No Probable Larvae Observed
          </span>
        );
    }
  };

  const getQualityBadge = () => {
    const q = scan.video_quality || 'usable';
    if (q === 'good') {
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Good Video Quality</span>;
    }
    if (q === 'usable') {
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">Usable Video Quality</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">Poor Video Quality</span>;
  };

  return (
    <div className="card space-y-6 bg-white border border-slate-200/90 shadow-card">
      {/* Top Banner & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          {getRiskBadge()}
          {getQualityBadge()}
        </div>
        <div className="text-xs text-slate-500 font-bold">
          Scan ID: <code className="font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">#{scan.id.slice(0, 8)}</code>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stat 1: Probable Larvae */}
        <div className="p-4 rounded-card bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
            <span>Probable Larvae Detected</span>
            <Activity className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">{probableCount}</span>
            <span className="text-xs text-slate-500 font-medium">confirmed tracks</span>
          </div>
        </div>

        {/* Stat 2: Rejected Debris Lookalikes */}
        <div className="p-4 rounded-card bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
            <span>Debris Filtered</span>
            <Filter className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">{rejectedCount}</span>
            <span className="text-xs text-slate-500 font-medium">rejected candidates</span>
          </div>
        </div>

        {/* Stat 3: Fused Confidence */}
        <div className="p-4 rounded-card bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
            <span>Fused Confidence</span>
            <Layers className="w-4 h-4 text-slate-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
              {probableCount > 0 ? `${confidencePct}%` : 'N/A'}
            </span>
            <span className="text-xs text-slate-500 font-medium">detection + verifier</span>
          </div>
        </div>
      </div>

      {/* Safe Public Health Language Notice */}
      <div className="p-3.5 rounded-control bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5 leading-relaxed">
        <Info className="w-4 h-4 shrink-0 text-slate-900 mt-0.5" />
        <div>
          {probableCount > 0 ? (
            <p>
              <strong className="text-slate-900">Screening Finding:</strong> Probable mosquito larvae detected in this clip. This surveillance result requires entomological and human field confirmation before chemical larvicide application.
            </p>
          ) : (
            <p>
              <strong className="text-slate-900">Screening Finding:</strong> No probable mosquito larvae detected in this specific clip. Note: This is an observation of this video clip only and does NOT certify the water source as safe or disease-free.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
