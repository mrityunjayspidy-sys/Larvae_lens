import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuth } from '../features/auth/AuthContext';
import { ModelPredictionReport } from '../features/scans/ModelPredictionReport';
import { ResultHero } from '../features/scans/ResultHero';
import { EvidenceFunnel } from '../features/scans/EvidenceFunnel';
import { TrackEvidenceCard } from '../features/scans/TrackEvidenceCard';
import { QualityCard } from '../features/scans/QualityCard';
import { ReviewDecisionPanel } from '../features/review/ReviewDecisionPanel';
import { HotspotMap } from '../features/map/HotspotMap';
import { 
  ArrowLeft, 
  Camera, 
  ChevronDown, 
  ChevronUp, 
  Cpu, 
  MapPin, 
  Layers, 
  Clock, 
  RefreshCw,
  Sparkles,
  Share2,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';

export const ResultPage: React.FC = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'prediction' | 'audit'>('prediction');
  const [techDetailsOpen, setTechDetailsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleShareReport = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (scanLoading || tracksLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-white animate-spin" />
        <p className="text-sm font-bold text-white">Loading model predictions & evidence...</p>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
        <h2 className="text-xl font-black text-white">Scan Not Found</h2>
        <p className="text-xs text-neutral-400">The requested evidence record could not be found.</p>
        <Link to="/history" className="btn-primary text-xs mx-auto inline-flex">
          Return to History
        </Link>
      </div>
    );
  }

  const acceptedTracks = tracks.filter((t) => t.accepted);
  const rejectedTracks = tracks.filter((t) => !t.accepted);

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-6">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/history"
          className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Scan History
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShareReport}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
          >
            {copied ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Copied Link
              </span>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                Share Report
              </>
            )}
          </button>

          <Link to="/scan" className="btn-primary text-xs py-2 px-4">
            <Camera className="w-3.5 h-3.5" />
            Check Another Sample
          </Link>
        </div>
      </div>

      {/* View Mode Tab Switcher */}
      <div className="grid grid-cols-2 p-1 rounded-control bg-neutral-950 border border-neutral-800 text-xs font-bold max-w-md shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTab('prediction')}
          className={`py-2 px-3 rounded-control flex items-center justify-center gap-2 transition-all ${
            activeTab === 'prediction'
              ? 'bg-white text-black font-black shadow-glow'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Model Prediction Report
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`py-2 px-3 rounded-control flex items-center justify-center gap-2 transition-all ${
            activeTab === 'audit'
              ? 'bg-white text-black font-black shadow-glow'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Evidence Audit & Funnel
        </button>
      </div>

      {/* Tab 1: Direct AI Model Prediction Report */}
      {activeTab === 'prediction' && (
        <ModelPredictionReport
          scan={scan}
          tracks={tracks}
        />
      )}

      {/* Tab 2: Detailed Evidence Audit & Diagnostics */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <ResultHero scan={scan} />

          <EvidenceFunnel
            tracks={tracks}
            probableCount={scan.probable_larvae_count ?? 0}
          />

          <QualityCard
            quality={scan.video_quality}
            reasons={scan.quality_reasons || []}
          />

          <div className="card space-y-4 border border-neutral-800 bg-neutral-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-white" />
                  Object Track Evidence ({tracks.length} localized)
                </h3>
                <p className="text-xs text-neutral-400">
                  Detailed breakdown of detector bounding boxes, debris verifier probabilities, and movement scores.
                </p>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="badge-none">{acceptedTracks.length} Accepted</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                  {rejectedTracks.length} Filtered
                </span>
              </div>
            </div>

            {tracks.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400 bg-neutral-950 rounded-card border border-neutral-800">
                No object tracks localized in this video clip.
              </div>
            ) : (
              <div className="space-y-3">
                {tracks.map((track) => (
                  <TrackEvidenceCard key={track.track_number} track={track} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location Context */}
      {scan.latitude && scan.longitude && activeTab === 'audit' && (
        <div className="card space-y-3 border border-neutral-800 bg-neutral-900">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-white" />
              Observation Location & Hotspot Context
            </h3>
            <span className="text-xs text-neutral-400 font-mono">
              {scan.latitude.toFixed(4)}°, {scan.longitude.toFixed(4)}°
            </span>
          </div>
          <HotspotMap
            cells={[
              {
                id: scan.id,
                latitude_bucket: Number(scan.latitude.toFixed(4)),
                longitude_bucket: Number(scan.longitude.toFixed(4)),
                scan_count: 1,
                probable_larvae_total: scan.probable_larvae_count || 0,
                dominant_risk: scan.risk_level || 'none_observed',
                latest_scan_at: scan.created_at,
              },
            ]}
            center={[scan.latitude, scan.longitude]}
            zoom={14}
          />
        </div>
      )}

      {/* Reviewer Decision Panel for Authorized Users */}
      {(user?.role === 'reviewer' || user?.role === 'admin') && (
        <ReviewDecisionPanel
          scanId={scan.id}
          onReviewSubmitted={() => refetchScan()}
        />
      )}

      {/* Collapsible Model Version & Checkpoint Metadata */}
      <div className="card bg-neutral-900 border border-neutral-800 text-xs space-y-3">
        <button
          type="button"
          onClick={() => setTechDetailsOpen(!techDetailsOpen)}
          className="w-full flex items-center justify-between font-bold text-white py-1 hover:text-neutral-300 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-neutral-300" />
            Model Checkpoint & Audit Cryptographic Hashes
          </span>
          {techDetailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {techDetailsOpen && (
          <div className="pt-2 border-t border-neutral-800 space-y-2 font-mono text-[11px] text-neutral-400">
            <div>
              <span className="font-bold text-white">Detector Model SHA-256:</span>
              <p className="break-all text-neutral-300 bg-neutral-950 p-2.5 rounded-control border border-neutral-800 mt-0.5">
                {scan.model_versions?.detector_sha256 || 'Verified active manifest SHA'}
              </p>
            </div>

            <div>
              <span className="font-bold text-white">Binary Debris Verifier SHA-256:</span>
              <p className="break-all text-neutral-300 bg-neutral-950 p-2.5 rounded-control border border-neutral-800 mt-0.5">
                {scan.model_versions?.verifier_sha256 || 'Verified active manifest SHA'}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-1 font-sans text-neutral-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Submitted: {new Date(scan.created_at).toLocaleString()}
              </span>
              {scan.completed_at && (
                <span>Completed: {new Date(scan.completed_at).toLocaleTimeString()}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
