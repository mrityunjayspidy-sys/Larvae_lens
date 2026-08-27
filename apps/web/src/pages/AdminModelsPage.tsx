import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuth } from '../features/auth/AuthContext';
import { Cpu, CheckCircle2, AlertTriangle, RefreshCw, ShieldCheck, Sliders } from 'lucide-react';

export const AdminModelsPage: React.FC = () => {
  const { token } = useAuth();

  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ['adminModelsStatus'],
    queryFn: () => apiClient.getModelsStatus(token),
    enabled: !!token,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy flex items-center gap-2.5">
            <Cpu className="w-7 h-7 text-primary" />
            Model Registry & Checkpoints
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Read-only verification of active AI model weights, SHA-256 cryptographic hashes, and fusion parameters.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="btn-secondary text-xs py-2 px-3 self-start sm:self-auto flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Re-validate Manifest
        </button>
      </div>

      {isLoading ? (
        <div className="card text-center py-12 space-y-3">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Inspecting model filesystem & SHA-256 hashes...</p>
        </div>
      ) : !status ? (
        <div className="card text-center py-12 text-slate-500 text-xs">
          Could not load model status.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Readiness Status Hero */}
          <div className={`card p-5 border-2 ${
            status.ready ? 'bg-healthGreen-light/50 border-healthGreen/40' : 'bg-healthAmber-light border-healthAmber/40'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                  status.ready ? 'bg-healthGreen' : 'bg-healthAmber'
                }`}>
                  {status.ready ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-navy">
                      {status.ready ? 'Model Registry Ready' : 'Inference Pipeline Degraded'}
                    </h3>
                    <code className="text-xs px-2 py-0.5 rounded bg-white font-mono text-slate-700 border border-slate-200">
                      {status.status_code}
                    </code>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{status.message}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Model Artifacts Cards */}
          <div className="card space-y-4">
            <h3 className="text-base font-bold text-navy flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal" />
              Active Checkpoint Artifacts
            </h3>

            <div className="space-y-3">
              {Object.entries(status.active_models || {}).map(([key, model]) => (
                <div key={key} className="p-4 rounded-control bg-canvas border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-navy uppercase font-mono">{key} Model</span>
                      <span className="text-xs text-slate-500 font-mono">({model.filename})</span>
                    </div>
                    {model.hash_matched ? (
                      <span className="badge-none text-[11px]">SHA-256 Matched</span>
                    ) : model.file_exists ? (
                      <span className="badge-medium text-[11px]">Hash Mismatch</span>
                    ) : (
                      <span className="badge-high text-[11px]">File Missing</span>
                    )}
                  </div>

                  <div className="text-[11px] font-mono space-y-1 text-slate-600 bg-white p-2.5 rounded border border-slate-200/80">
                    <div>Expected SHA: {model.sha256_expected || 'None specified'}</div>
                    {model.sha256_actual && (
                      <div>Actual SHA: {model.sha256_actual}</div>
                    )}
                    <div className="flex gap-4 font-sans text-slate-500 pt-1">
                      <span>Classes: {model.classes?.join(', ')}</span>
                      {model.input_size && <span>Input Size: {model.input_size}px</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fusion Gating Thresholds */}
          <div className="card space-y-4">
            <h3 className="text-base font-bold text-navy flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />
              Manifest Fusion Thresholds
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-control bg-canvas border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Detector Confidence Threshold</span>
                <span className="font-mono font-bold text-navy text-sm">
                  {status.fusion_thresholds?.detector_threshold ?? 0.25}
                </span>
              </div>

              <div className="p-3 rounded-control bg-canvas border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Min Track Persistence</span>
                <span className="font-mono font-bold text-navy text-sm">
                  {status.fusion_thresholds?.min_track_frames ?? 4} frames
                </span>
              </div>

              <div className="p-3 rounded-control bg-canvas border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Motion Threshold</span>
                <span className="font-mono font-bold text-navy text-sm">
                  {status.fusion_thresholds?.motion_threshold ?? 0.015}
                </span>
              </div>

              <div className="p-3 rounded-control bg-canvas border border-slate-200">
                <span className="text-[10px] text-slate-400 block">High Morphology Threshold</span>
                <span className="font-mono font-bold text-navy text-sm">
                  {status.fusion_thresholds?.high_morphology_threshold ?? 0.88}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
