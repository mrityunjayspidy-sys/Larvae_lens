import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuth } from '../features/auth/AuthContext';
import { supabase, isSupabaseConfigured } from '../features/auth/supabase';
import { ProcessingTimeline } from '../features/scans/ProcessingTimeline';
import { ArrowLeft, RefreshCw, AlertCircle, Camera } from 'lucide-react';

export const ProcessingPage: React.FC = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const { data: scan, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['scan', scanId],
    queryFn: () => apiClient.getScan(scanId!, token),
    enabled: !!scanId && !!token,
    refetchInterval: (query) => {
      const currentStatus = query.state.data?.status;
      if (currentStatus === 'completed' || currentStatus === 'retake_required' || currentStatus === 'failed') {
        return false;
      }
      return 1500; // Poll every 1.5s as fallback/active monitor
    },
  });

  // Supabase Realtime Subscription
  useEffect(() => {
    if (!scanId || !isSupabaseConfigured || !supabase) return;

    const sbClient = supabase;
    const channel = sbClient
      .channel(`scan-status-${scanId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'scans', filter: `id=eq.${scanId}` },
        (_payload) => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      sbClient.removeChannel(channel);
    };
  }, [scanId, refetch]);

  // Navigate to Result on Completion
  useEffect(() => {
    if (scan?.status === 'completed') {
      const timer = setTimeout(() => {
        navigate(`/scans/${scanId}`, { replace: true });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [scan?.status, scanId, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-semibold text-navy">Connecting to analysis worker...</p>
      </div>
    );
  }

  if (isError || !scan) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-healthRed-light text-healthRed flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-navy">Scan Job Not Found</h2>
        <p className="text-xs text-slate-500">
          {(error as any)?.message || 'Could not retrieve scan progress. Please return to scan capture.'}
        </p>
        <Link to="/scan" className="btn-primary text-xs mx-auto inline-flex">
          <Camera className="w-4 h-4" />
          Start New Scan
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <Link to="/scan" className="text-xs text-slate-500 hover:text-navy flex items-center gap-1.5 font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Capture
        </Link>
        <span className="text-xs font-mono text-slate-400">
          Job #{scan.id.slice(0, 8)}
        </span>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-navy">
          Analyzing Field Video
        </h1>
        <p className="text-xs text-slate-500">
          Live stage progression from the inference engine and database status changes.
        </p>
      </div>

      <ProcessingTimeline
        status={scan.status}
        progressPercent={scan.progress_percent}
        currentStage={scan.current_stage}
        errorMessage={scan.error_message}
      />

      {(scan.status === 'failed' || scan.status === 'retake_required') && (
        <div className="flex justify-center pt-2">
          <Link to="/scan" className="btn-primary text-xs px-6 py-2.5">
            <Camera className="w-4 h-4" />
            Capture New Video
          </Link>
        </div>
      )}
    </div>
  );
};
