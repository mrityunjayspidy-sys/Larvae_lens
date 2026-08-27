import React from 'react';
import { Sun, Focus, Video, AlertCircle } from 'lucide-react';
import { VideoQuality } from '../../types';

interface QualityCardProps {
  quality?: VideoQuality | null;
  reasons: string[];
}

export const QualityCard: React.FC<QualityCardProps> = ({ quality = 'usable', reasons = [] }) => {
  const isGood = quality === 'good';
  const isPoor = quality === 'poor';

  return (
    <div className="card space-y-4 bg-white border border-slate-200/90 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Video className="w-4 h-4 text-teal-600" />
          Capture Quality Diagnostics
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-black ${
          isGood ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : isPoor ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
        }`}>
          {quality?.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* Illumination */}
        <div className="p-3.5 rounded-control bg-slate-50 border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-900 font-black">
            <Sun className="w-4 h-4 text-amber-600" />
            <span>Illumination</span>
          </div>
          <p className="text-[11px] text-slate-600">
            {reasons.includes('LOW_LIGHT_ENVIRONMENT') ? 'Low surface illumination' : reasons.includes('OVEREXPOSED_SURFACE_REFLECTION') ? 'High water reflection' : 'Optimal daylight / clear water'}
          </p>
        </div>

        {/* Optical Focus */}
        <div className="p-3.5 rounded-control bg-slate-50 border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-900 font-black">
            <Focus className="w-4 h-4 text-teal-600" />
            <span>Optical Focus</span>
          </div>
          <p className="text-[11px] text-slate-600">
            {reasons.includes('EXCESSIVE_BLUR_OUT_OF_FOCUS') ? 'Out of focus / motion blur' : 'Clear larval contours captured'}
          </p>
        </div>

        {/* Camera Stability */}
        <div className="p-3.5 rounded-control bg-slate-50 border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-900 font-black">
            <Video className="w-4 h-4 text-slate-700" />
            <span>Camera Stability</span>
          </div>
          <p className="text-[11px] text-slate-600">
            {reasons.includes('SEVERE_CAMERA_UNSTABILITY') ? 'Severe camera jitter' : 'Flow compensated successfully'}
          </p>
        </div>
      </div>

      {reasons.length > 0 && (
        <div className="p-3.5 rounded-control bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-900">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Quality Diagnostics:
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
            {reasons.map((r, i) => (
              <li key={i}>{r.replace(/_/g, ' ')}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
