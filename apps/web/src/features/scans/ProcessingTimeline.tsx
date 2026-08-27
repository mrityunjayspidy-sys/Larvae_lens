import React from 'react';
import { Check, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { ScanStatus } from '../../types';

interface ProcessingTimelineProps {
  status: ScanStatus;
  progressPercent: number;
  currentStage?: string | null;
  errorMessage?: string | null;
}

interface StageStep {
  key: string;
  label: string;
  description: string;
  minProgress: number;
}

const STAGES: StageStep[] = [
  {
    key: 'validating',
    label: 'Media Validation',
    description: 'Verifying video integrity, resolution, brightness and stability',
    minProgress: 10,
  },
  {
    key: 'detecting',
    label: 'Candidate Detection',
    description: 'Localizing probable organism candidates across sampled frames',
    minProgress: 30,
  },
  {
    key: 'verifying',
    label: 'Debris Rejection',
    description: 'Evaluating candidate crops against leaves, sand, ripples & lookalikes',
    minProgress: 55,
  },
  {
    key: 'tracking',
    label: 'Temporal Motion Tracking',
    description: 'Calculating background flow & persistent trajectory with ByteTrack',
    minProgress: 75,
  },
  {
    key: 'completed',
    label: 'Evidence Synthesis',
    description: 'Aggregating track confidence, quality metrics and surveillance risk band',
    minProgress: 100,
  },
];

export const ProcessingTimeline: React.FC<ProcessingTimelineProps> = ({
  status,
  progressPercent,
  currentStage,
  errorMessage,
}) => {
  const isFailed = status === 'failed';
  const isRetake = status === 'retake_required';

  const getStageState = (stage: StageStep) => {
    if (isFailed || isRetake) {
      if (progressPercent >= stage.minProgress) return 'error';
      return 'pending';
    }

    if (progressPercent > stage.minProgress || status === 'completed') {
      return 'completed';
    }

    if (
      status === stage.key || 
      currentStage === stage.key || 
      (progressPercent >= stage.minProgress - 15 && progressPercent <= stage.minProgress)
    ) {
      return 'in_progress';
    }

    return 'pending';
  };

  return (
    <div className="card space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm font-bold text-navy">
          <span>Inference Progress</span>
          <span className="font-mono text-primary">{progressPercent}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isFailed 
                ? 'bg-healthRed' 
                : isRetake 
                ? 'bg-healthAmber' 
                : 'bg-gradient-to-r from-teal to-primary'
            }`}
            style={{ width: `${Math.max(5, progressPercent)}%` }}
          />
        </div>
      </div>

      {/* Stage Breakdown */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {STAGES.map((stage) => {
          const state = getStageState(stage);

          return (
            <div key={stage.key} className="relative flex items-start gap-3.5">
              {/* Status Indicator Icon */}
              <div
                className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                  state === 'completed'
                    ? 'bg-healthGreen text-white ring-4 ring-healthGreen-light'
                    : state === 'in_progress'
                    ? 'bg-primary text-white ring-4 ring-primary-light animate-pulse'
                    : state === 'error'
                    ? 'bg-healthRed text-white ring-4 ring-healthRed-light'
                    : 'bg-surface border-2 border-slate-300 text-slate-400'
                }`}
              >
                {state === 'completed' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                {state === 'in_progress' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {state === 'error' && <AlertCircle className="w-3.5 h-3.5" />}
                {state === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
              </div>

              {/* Text Information */}
              <div className="space-y-0.5">
                <p
                  className={`text-sm font-bold ${
                    state === 'in_progress'
                      ? 'text-primary'
                      : state === 'completed'
                      ? 'text-navy'
                      : state === 'error'
                      ? 'text-healthRed'
                      : 'text-slate-400'
                  }`}
                >
                  {stage.label}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {stage.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {isFailed && (
        <div className="p-4 rounded-control bg-healthRed-light border border-healthRed/30 text-healthRed text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Inference Error:</span>
            <p>{errorMessage || 'The automated analysis encountered an unexpected pipeline error.'}</p>
          </div>
        </div>
      )}

      {isRetake && (
        <div className="p-4 rounded-control bg-healthAmber-light border border-healthAmber/30 text-navy text-xs flex items-start gap-2.5">
          <RefreshCw className="w-4 h-4 text-healthAmber shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-healthAmber">Retake Recommended:</span>
            <p>{errorMessage || 'Video quality or lighting is insufficient for confident automated debris verification.'}</p>
          </div>
        </div>
      )}
    </div>
  );
};
