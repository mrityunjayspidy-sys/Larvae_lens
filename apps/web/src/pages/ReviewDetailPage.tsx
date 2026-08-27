import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuth } from '../features/auth/AuthContext';
import { ResultHero } from '../features/scans/ResultHero';
import { EvidenceFunnel } from '../features/scans/EvidenceFunnel';
import { TrackEvidenceCard } from '../features/scans/TrackEvidenceCard';
import { ReviewDecisionPanel } from '../features/review/ReviewDecisionPanel';
import { ArrowLeft, CheckSquare, Layers, RefreshCw } from 'lucide-react';

export const ReviewDetailPage: React.FC = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const { token } = useAuth();

  const { data: scan, isLoading: scanLoading, refetch: refetchScan } = useQuery({
    queryKey: ['scan', scanId],
    queryFn: () => apiClient.getScan(scanId!, token),
    enabled: !!scanId && !!token,
  });

  const { data: tracks = [], isLoading: tracksLoading } = useQuery({
    queryKey: ['scanTracks', scanId],
    queryFn: () => apiClient.getScanTracks(scanId!, token),
    enabled: !!scanId && !!token,
  });

  if (scanLoading || tracksLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-semibold text-navy">Loading audit evidence package...</p>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-navy">Scan Record Not Found</h2>
        <Link to="/review" className="btn-primary text-xs mx-auto inline-flex">
          Return to Review Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <Link
          to="/review"
          className="text-xs text-slate-500 hover:text-navy flex items-center gap-1.5 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Review Queue
        </Link>
        <span className="text-xs font-mono text-slate-400">
          Auditing Scan #{scan.id.slice(0, 8)}
        </span>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy flex items-center gap-2.5">
          <CheckSquare className="w-7 h-7 text-healthAmber" />
          Entomological Review & Audit
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Verify model tracks and submit a human confirmation determination for municipal records.
        </p>
      </div>

      {/* Hero Overview */}
      <ResultHero scan={scan} />

      {/* Review Decision Form */}
      <ReviewDecisionPanel
        scanId={scan.id}
        onReviewSubmitted={() => refetchScan()}
      />

      {/* Funnel */}
      <EvidenceFunnel
        tracks={tracks}
        probableCount={scan.probable_larvae_count ?? 0}
      />

      {/* Track Evidence Cards */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-navy flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Track Evidence Audit ({tracks.length} localized tracks)
          </h3>
          <span className="text-xs text-slate-500 font-medium">Read-Only Model Artifacts</span>
        </div>

        <div className="space-y-3">
          {tracks.map((track) => (
            <TrackEvidenceCard key={track.track_number} track={track} />
          ))}
        </div>
      </div>
    </div>
  );
};
