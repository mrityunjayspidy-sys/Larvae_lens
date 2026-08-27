import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuth } from '../features/auth/AuthContext';
import { Camera, History, ArrowRight, Filter, Clock } from 'lucide-react';
import { ScanDetail } from '../types';

export const HistoryPage: React.FC = () => {
  const { token } = useAuth();
  const [page] = useState(1);
  const [filterRisk, setFilterRisk] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['userScans', page],
    queryFn: () => apiClient.getUserScans(token, page, 20),
    enabled: !!token,
  });

  const scans = data?.items || [];
  const filteredScans = filterRisk === 'all' 
    ? scans 
    : scans.filter(s => s.risk_level === filterRisk);

  const getStatusBadge = (scan: ScanDetail) => {
    if (scan.status === 'completed') {
      return <span className="badge-none">Completed</span>;
    }
    if (scan.status === 'retake_required') {
      return <span className="badge-medium">Retake Required</span>;
    }
    if (scan.status === 'failed') {
      return <span className="badge-high">Failed</span>;
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 animate-pulse">
        {scan.status}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <History className="w-7 h-7 text-teal-600" />
            Field Scan History
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Chronological log of your recorded water surveillance video clips and evidence reports.
          </p>
        </div>

        <Link to="/scan" className="btn-primary text-xs py-2.5 px-5 self-start sm:self-auto shadow-sm">
          <Camera className="w-4 h-4" />
          New Water Scan
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 text-xs">
        <Filter className="w-4 h-4 text-slate-500" />
        <span className="font-bold text-slate-900">Filter by Risk:</span>
        <select
          value={filterRisk}
          onChange={(e) => setFilterRisk(e.target.value)}
          className="text-xs px-3 py-2 rounded-control border border-slate-300 bg-white font-bold text-slate-900 focus:outline-none focus:border-slate-900 shadow-2xs"
        >
          <option value="all">All Risk Levels</option>
          <option value="high">High Risk (≥6)</option>
          <option value="medium">Medium Risk (3–5)</option>
          <option value="low">Low Risk (1–2)</option>
          <option value="none_observed">None Observed (0)</option>
        </select>
      </div>

      {isLoading ? (
        <div className="card text-center py-12 space-y-3 bg-white border border-slate-200 shadow-card">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-600 font-bold">Fetching scan records from database...</p>
        </div>
      ) : filteredScans.length === 0 ? (
        <div className="card text-center py-16 space-y-4 bg-white border border-slate-200 shadow-card">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 border border-slate-200 shadow-2xs">
            <Camera className="w-7 h-7 text-slate-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900">No Scan Records Yet</h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              You haven't submitted any field water clips yet. Start your first vector screening scan to populate history.
            </p>
          </div>
          <Link to="/scan" className="btn-primary text-xs inline-flex px-6 py-3">
            <Camera className="w-4 h-4" />
            Capture First Scan
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredScans.map((scan) => {
            const targetUrl = scan.status === 'completed' 
              ? `/scans/${scan.id}` 
              : `/scans/${scan.id}/processing`;

            return (
              <Link
                key={scan.id}
                to={targetUrl}
                className="card block bg-white border border-slate-200/90 hover:border-slate-400 hover:shadow-elevated transition-all p-4 sm:p-5 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-sm text-slate-900 group-hover:text-teal-600 transition-colors">
                        #{scan.id.slice(0, 8)}
                      </span>
                      {getStatusBadge(scan)}
                      {scan.risk_level && (
                        <span className="text-[11px] font-bold text-slate-600 uppercase">
                          • {scan.risk_level.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(scan.created_at).toLocaleDateString()} {new Date(scan.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {scan.duration_seconds && (
                        <span>Duration: {scan.duration_seconds.toFixed(1)}s</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-500 block font-bold">Probable Larvae</span>
                      <span className="text-lg font-black text-slate-900 font-mono">
                        {scan.probable_larvae_count !== null && scan.probable_larvae_count !== undefined
                          ? scan.probable_larvae_count
                          : '—'}
                      </span>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-900 group-hover:text-white text-slate-600 flex items-center justify-center transition-all border border-slate-200">
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
