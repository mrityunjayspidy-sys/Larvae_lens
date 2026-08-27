import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';
import { useAuth } from '../features/auth/AuthContext';
import { AlertTriangle, RefreshCw, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ModelReadinessBanner: React.FC = () => {
  const { token, user } = useAuth();

  const { data: status, isLoading, isError, refetch } = useQuery({
    queryKey: ['modelsStatus'],
    queryFn: () => apiClient.getModelsStatus(token),
    enabled: !!token,
    staleTime: 30000,
    retry: 1,
  });

  if (isLoading || !token) return null;

  if (isError || (status && !status.ready)) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-amber-900 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs sm:text-sm">
              <span className="font-bold text-slate-900">Analysis Service Notice: </span>
              <span className="text-amber-900 font-medium">{status?.message || 'Model weights or manifest are pending verification. New uploads will report 503.'}</span>
              {status?.status_code && (
                <code className="ml-1.5 px-2 py-0.5 rounded bg-amber-100 font-mono text-[11px] text-amber-800 border border-amber-300">
                  {status.status_code}
                </code>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => refetch()}
              className="text-xs font-bold px-3 py-1.5 rounded-control bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              Check Again
            </button>
            {user?.role === 'admin' && (
              <Link
                to="/admin/models"
                className="btn-primary text-xs font-black px-3 py-1.5 flex items-center gap-1.5"
              >
                <Cpu className="w-3.5 h-3.5 text-teal-400" />
                Admin View
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
