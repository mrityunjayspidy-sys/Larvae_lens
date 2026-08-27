import React from 'react';
import { Filter, Eye, Activity, CheckCircle2 } from 'lucide-react';
import { TrackEvidence } from '../../types';

interface EvidenceFunnelProps {
  tracks: TrackEvidence[];
  probableCount: number;
}

export const EvidenceFunnel: React.FC<EvidenceFunnelProps> = ({ tracks, probableCount }) => {
  const totalCandidates = tracks.length;
  const passedMorphology = tracks.filter(t => t.larva_probability >= 0.70).length;
  const passedTemporal = tracks.filter(t => t.persistence_frames >= 4).length;
  const accepted = probableCount;

  return (
    <div className="card space-y-4 bg-white border border-slate-200/90 shadow-card">
      <div>
        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Filter className="w-4 h-4 text-teal-600" />
          Evidence Screening Funnel
        </h3>
        <p className="text-xs text-slate-500">
          How raw frame candidates are filtered through morphology and temporal verification.
        </p>
      </div>

      <div className="space-y-2.5">
        {/* Tier 1 */}
        <div className="p-3.5 rounded-control bg-slate-50 border border-slate-200">
          <div className="flex justify-between items-center text-xs font-black text-slate-900 mb-1">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              1. Candidate Detections
            </span>
            <span className="font-mono text-slate-900 font-black">{totalCandidates}</span>
          </div>
          <p className="text-[11px] text-slate-500">Bounding boxes meeting initial detector confidence.</p>
        </div>

        {/* Tier 2 */}
        <div className="p-3.5 rounded-control bg-slate-50 border border-slate-200">
          <div className="flex justify-between items-center text-xs font-black text-slate-900 mb-1">
            <span className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-teal-600" />
              2. Morphology Verified (Debris Filtered)
            </span>
            <span className="font-mono text-slate-900 font-black">{passedMorphology}</span>
          </div>
          <p className="text-[11px] text-slate-500">Padded crops matching larval morphology rather than leaves or sand.</p>
        </div>

        {/* Tier 3 */}
        <div className="p-3.5 rounded-control bg-slate-50 border border-slate-200">
          <div className="flex justify-between items-center text-xs font-black text-slate-900 mb-1">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-600" />
              3. Temporally Persistent Tracks
            </span>
            <span className="font-mono text-amber-700 font-black">{passedTemporal}</span>
          </div>
          <p className="text-[11px] text-slate-500">Objects tracked continuously for ≥4 frames with camera shift compensation.</p>
        </div>

        {/* Tier 4 */}
        <div className="p-3.5 rounded-control bg-emerald-50 border border-emerald-200">
          <div className="flex justify-between items-center text-xs font-black text-emerald-800 mb-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              4. Probable Larvae Confirmed
            </span>
            <span className="font-mono text-emerald-800 text-sm font-black">{accepted}</span>
          </div>
          <p className="text-[11px] text-emerald-700/90">Passed all multi-stage criteria and gating thresholds.</p>
        </div>
      </div>
    </div>
  );
};
