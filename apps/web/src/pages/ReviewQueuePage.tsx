import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuth } from '../features/auth/AuthContext';
import { CheckSquare, ArrowRight, Clock, UserCheck } from 'lucide-react';

export const ReviewQueuePage: React.FC = () => {
  const { token } = useAuth();

  const { data: queue = [], isLoading, refetch } = useQuery({
    queryKey: ['reviewQueue'],
    queryFn: () => apiClient.getReviewQueue(token, 1, 50),
    enabled: !!token,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy flex items-center gap-2.5">
            <CheckSquare className="w-7 h-7 text-healthAmber" />
            Public Health Review Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Audit candidate tracks, verify debris filter performance, and record entomological confirmations.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="btn-secondary text-xs py-2 px-3 self-start sm:self-auto"
        >
          Refresh Queue
        </button>
      </div>

      {isLoading ? (
        <div className="card text-center py-12 space-y-3">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Loading review queue...</p>
        </div>
      ) : queue.length === 0 ? (
        <div className="card text-center py-16 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-healthGreen-light text-healthGreen flex items-center justify-center mx-auto">
            <UserCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-navy">All Scans Reviewed</h3>
          <p className="text-xs text-slate-500">There are no pending unreviewed surveillance scans in the queue.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((item) => {
            const scan = item.scan;
            const isReviewed = scan.review_status === 'reviewed';

            return (
              <Link
                key={scan.id}
                to={`/review/${scan.id}`}
                className="card block hover:border-primary/50 hover:shadow-md transition-all p-4 sm:p-5 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-navy group-hover:text-primary font-mono">
                        #{scan.id.slice(0, 8)}
                      </span>
                      {isReviewed ? (
                        <span className="badge-none text-[11px]">Audit Completed</span>
                      ) : (
                        <span className="badge-medium text-[11px]">Awaiting Review</span>
                      )}
                      {scan.risk_level && (
                        <span className="text-[11px] font-semibold text-slate-600 uppercase">
                          • {scan.risk_level.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(scan.created_at).toLocaleString()}
                      </span>
                      <span>Tracks: {item.accepted_tracks_count} accepted / {item.rejected_tracks_count} rejected</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Larvae Count</span>
                      <span className="text-base font-bold text-navy font-mono">
                        {scan.probable_larvae_count ?? 0}
                      </span>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-canvas group-hover:bg-primary-light text-slate-400 group-hover:text-primary flex items-center justify-center transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
