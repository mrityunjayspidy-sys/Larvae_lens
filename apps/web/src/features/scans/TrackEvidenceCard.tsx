import React, { useState } from 'react';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { TrackEvidence } from '../../types';

interface TrackEvidenceCardProps {
  track: TrackEvidence;
}

export const TrackEvidenceCard: React.FC<TrackEvidenceCardProps> = ({ track }) => {
  const [expanded, setExpanded] = useState(false);

  const formatPercent = (val: number) => `${Math.round(val * 100)}%`;

  return (
    <div className={`p-4 rounded-card border transition-all ${
      track.accepted 
        ? 'bg-white border-emerald-300 shadow-sm' 
        : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Track Title and Acceptance Status */}
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-black flex items-center justify-center shadow-xs">
            #{track.track_number}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900">Track #{track.track_number}</span>
              {track.accepted ? (
                <span className="badge-none text-[11px] py-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Accepted Probable Larva
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-slate-500" />
                  Filtered Debris
                </span>
              )}
            </div>
            {track.reject_reason && (
              <p className="text-[11px] text-amber-700 font-bold mt-0.5">
                Rejection Reason: <span className="font-mono text-slate-700 font-semibold">{track.reject_reason}</span>
              </p>
            )}
          </div>
        </div>

        {/* Fused Confidence & Expand Toggle */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-500 block font-bold">Fused Confidence</span>
            <span className={`text-sm font-black font-mono ${track.accepted ? 'text-slate-900' : 'text-slate-500'}`}>
              {formatPercent(track.fused_confidence)}
            </span>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-control text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            aria-label={expanded ? 'Collapse track details' : 'Expand track details'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Metric Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-slate-200 text-xs">
        <div className="p-2.5 rounded-control bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-500 block font-bold">Detector Conf</span>
          <span className="font-black font-mono text-slate-900">{formatPercent(track.detector_confidence)}</span>
        </div>

        <div className="p-2.5 rounded-control bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-500 block font-bold">Larva Morphology</span>
          <span className={`font-black font-mono ${track.larva_probability >= 0.7 ? 'text-emerald-700' : 'text-slate-700'}`}>
            {formatPercent(track.larva_probability)}
          </span>
        </div>

        <div className="p-2.5 rounded-control bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-500 block font-bold">Motion Score</span>
          <span className="font-bold font-mono text-slate-700">{track.motion_score.toFixed(4)}</span>
        </div>

        <div className="p-2.5 rounded-control bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-500 block font-bold">Persistence</span>
          <span className="font-bold font-mono text-slate-700">{track.persistence_frames} frames</span>
        </div>
      </div>

      {/* Expanded Trajectory View */}
      {expanded && track.trajectory && track.trajectory.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200 space-y-2 text-xs">
          <span className="font-bold text-slate-900 text-[11px] flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-slate-900" />
            Track Trajectory Coordinates ({track.trajectory.length} checkpoints):
          </span>
          <div className="max-h-32 overflow-y-auto rounded-control bg-slate-900 text-slate-200 p-2.5 font-mono text-[11px] space-y-1">
            {track.trajectory.map((pt, idx) => (
              <div key={idx} className="flex justify-between border-b border-slate-800 pb-0.5 last:border-0">
                <span className="text-slate-300">Frame #{pt.frame_idx} ({pt.timestamp_s.toFixed(2)}s)</span>
                <span className="text-teal-400 font-bold">
                  BBox: [{pt.bbox.map(n => Math.round(n)).join(', ')}]
                </span>
                <span className="text-emerald-400">Conf: {(pt.confidence * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
