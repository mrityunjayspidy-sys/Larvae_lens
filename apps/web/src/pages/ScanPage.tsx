import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { VideoCaptureCard } from '../features/scans/VideoCaptureCard';
import { LocationConsentModal } from '../features/scans/LocationConsentModal';
import { ModelReadinessBanner } from '../components/ModelReadinessBanner';
import { apiClient } from '../api/client';
import { Camera, Send, AlertTriangle, RefreshCw, Info, LogIn, WifiOff, FileWarning } from 'lucide-react';

export const ScanPage: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ code: string; message: string; retryable: boolean } | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => crypto.randomUUID());

  const handleMediaSelected = (file: File) => {
    setSelectedFile(file);
    setError(null);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setError(null);
    setIdempotencyKey(crypto.randomUUID());
  };

  const handleSubmitScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedFile) return;

    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('video', selectedFile);
    if (coords) {
      formData.append('latitude', coords.latitude.toString());
      formData.append('longitude', coords.longitude.toString());
      formData.append('location_accuracy_m', coords.accuracy.toString());
    }
    formData.append('idempotency_key', idempotencyKey);

    try {
      const response = await apiClient.uploadScan(formData, token, idempotencyKey);
      navigate(`/scans/${response.scan_id}/processing`);
    } catch (err: any) {
      const errCode = err.code || (err.status === 401 ? 'UNAUTHORIZED' : err.status === 413 ? 'FILE_TOO_LARGE' : err.status === 422 ? 'VALIDATION_ERROR' : err.status === 503 ? 'MODEL_NOT_READY' : 'NETWORK_ERROR');
      setError({
        code: errCode,
        message: err.message || 'Failed to submit water sample for analysis.',
        retryable: err.retryable !== false && errCode !== 'UNAUTHORIZED' && errCode !== 'MODEL_NOT_READY',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 py-6">
      <ModelReadinessBanner />

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs">
            Citizen & Field Screening
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
          <Camera className="w-7 h-7 text-teal-600" />
          Check Water for Mosquito Larvae
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Upload or take a photo/video of standing water in buckets, coolers, plant saucers, potholes, or containers to check for larvae.
        </p>
      </div>

      {/* Explicit Error Feedback Panel */}
      {error && (
        <div className="p-4 rounded-card bg-rose-50 border border-rose-200 text-xs space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-800 font-bold">
              {error.code === 'UNAUTHORIZED' ? (
                <LogIn className="w-4 h-4 shrink-0 text-rose-600" />
              ) : error.code === 'NETWORK_ERROR' ? (
                <WifiOff className="w-4 h-4 shrink-0 text-rose-600" />
              ) : error.code === 'FILE_TOO_LARGE' || error.code === 'VALIDATION_ERROR' ? (
                <FileWarning className="w-4 h-4 shrink-0 text-rose-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>
                {error.code === 'UNAUTHORIZED' && 'Authentication Required (401)'}
                {error.code === 'FILE_TOO_LARGE' && 'File Exceeds Size Limit (413)'}
                {error.code === 'VALIDATION_ERROR' && 'Media Validation Failed (422)'}
                {error.code === 'MODEL_NOT_READY' && 'Model Not Ready (503)'}
                {error.code === 'NETWORK_ERROR' && 'Network Connection Error'}
                {!['UNAUTHORIZED', 'FILE_TOO_LARGE', 'VALIDATION_ERROR', 'MODEL_NOT_READY', 'NETWORK_ERROR'].includes(error.code) && `Submission Error (${error.code})`}
              </span>
            </div>
            {error.retryable && selectedFile && (
              <button
                type="button"
                onClick={() => handleSubmitScan()}
                disabled={submitting}
                className="btn-primary text-[11px] px-3 py-1 shadow-xs"
              >
                Retry Submission
              </button>
            )}
          </div>

          <p className="text-rose-700 leading-relaxed font-medium">{error.message}</p>

          {error.code === 'UNAUTHORIZED' && (
            <Link to="/login?next=/scan" className="btn-primary text-xs inline-flex items-center gap-1.5">
              <LogIn className="w-3.5 h-3.5" />
              Sign In to Continue
            </Link>
          )}

          {error.code === 'MODEL_NOT_READY' && (
            <p className="text-slate-500 italic text-[11px]">
              Note: The AI verification pipeline requires active detector and verifier model checkpoints in the backend directory.
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmitScan} className="space-y-6">
        <VideoCaptureCard
          onVideoSelected={handleMediaSelected}
          selectedFile={selectedFile}
          onClear={handleClear}
        />

        {/* Resident Guidance Tips */}
        <div className="p-4 rounded-card bg-teal-50/70 border border-teal-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-black text-slate-900">
            <Info className="w-4 h-4 text-teal-600" />
            <span>Tips for Accurate Larva Detection:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700">
            <li>Hold your phone steady 15–30 cm directly above the stagnant water surface.</li>
            <li>Ensure good ambient daylight or use a flashlight in shady corners.</li>
            <li>Wait 2–3 seconds before recording so swimming or breathing larvae surface at the water edges.</li>
          </ul>
        </div>

        <LocationConsentModal
          onLocationResolved={setCoords}
          currentCoords={coords}
        />

        <div className="sticky bottom-20 md:static bg-white/95 backdrop-blur-md p-4 rounded-card border border-slate-200 shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            {selectedFile ? (
              <span className="text-slate-900">Ready to analyze: <strong className="text-slate-900 underline">{selectedFile.name}</strong></span>
            ) : (
              <span>Select or capture a water photo/video above to proceed.</span>
            )}
          </div>

          <button
            type="submit"
            disabled={!selectedFile || submitting}
            className="btn-primary w-full sm:w-auto text-xs px-8 py-3.5 shadow-md"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Uploading & Initializing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Analyze Water Sample
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
