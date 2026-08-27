import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuth } from '../features/auth/AuthContext';
import { 
  Camera, 
  History, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Droplet, 
  ArrowRight, 
  Sparkles,
  Info,
  Clock
} from 'lucide-react';
import { HotspotMap } from '../features/map/HotspotMap';

export const CitizenDashboard: React.FC = () => {
  const { user, token } = useAuth();

  const { data: userScansData, isLoading: scansLoading } = useQuery({
    queryKey: ['userScans', 1],
    queryFn: () => apiClient.getUserScans(token, 1, 5),
    enabled: !!token,
  });

  const { data: hotspotsData } = useQuery({
    queryKey: ['hotspots'],
    queryFn: () => apiClient.getHotspots(),
  });

  const scans = userScansData?.items || [];
  const totalScans = userScansData?.total || 0;
  const positiveScans = scans.filter(s => (s.probable_larvae_count || 0) > 0).length;
  const cleanScans = totalScans - positiveScans;

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-4 py-6">
      {/* 1. Welcome Header & Scan Quick Trigger */}
      <div className="card bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-card space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/80 text-teal-300 border border-teal-800/80 text-xs font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              Resident Vector Surveillance Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Hello, {user?.full_name || 'Resident'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Check stagnant water in plant pots, coolers, drains, and buckets to detect mosquito larvae before they emerge.
            </p>
          </div>

          <div className="shrink-0">
            <Link to="/scan" className="btn-primary bg-white text-slate-900 hover:bg-slate-100 text-sm px-7 py-3.5 shadow-lg font-black inline-flex items-center gap-2">
              <Camera className="w-5 h-5 text-teal-600" />
              Check Water Sample
            </Link>
          </div>
        </div>

        {/* Resident Screening Metrics */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-700/80 text-center sm:text-left">
          <div className="p-3 rounded-control bg-slate-800/80 border border-slate-700/60 space-y-0.5">
            <span className="text-[11px] text-slate-400 font-bold block">Total Water Checks</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-white">{totalScans}</span>
          </div>

          <div className="p-3 rounded-control bg-slate-800/80 border border-slate-700/60 space-y-0.5">
            <span className="text-[11px] text-emerald-400 font-bold block">Clean Water Verified</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">{cleanScans >= 0 ? cleanScans : 0}</span>
          </div>

          <div className="p-3 rounded-control bg-slate-800/80 border border-slate-700/60 space-y-0.5">
            <span className="text-[11px] text-rose-400 font-bold block">Larvae Detected</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-rose-400">{positiveScans}</span>
          </div>
        </div>
      </div>

      {/* 2. Main Content Grid: Recent Scans & Hotspots Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Water Checks (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-teal-600" />
              Your Recent Water Inspections
            </h2>
            <Link to="/history" className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1">
              View All History <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {scansLoading ? (
            <div className="card text-center py-10 space-y-2 bg-white border border-slate-200 shadow-card">
              <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-500 font-bold">Loading your recent inspections...</p>
            </div>
          ) : scans.length === 0 ? (
            <div className="card text-center py-12 space-y-3 bg-white border border-slate-200 shadow-card">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 border border-slate-200">
                <Droplet className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-sm font-black text-slate-900">No Water Checks Recorded Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Capture a 5–10s video of any standing water around your home to check for mosquito larvae.
              </p>
              <Link to="/scan" className="btn-primary text-xs inline-flex px-5 py-2.5">
                <Camera className="w-4 h-4" />
                Start First Water Check
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {scans.map((scan) => {
                const isPositive = (scan.probable_larvae_count || 0) > 0;
                return (
                  <Link
                    key={scan.id}
                    to={scan.status === 'completed' ? `/scans/${scan.id}` : `/scans/${scan.id}/processing`}
                    className="card block bg-white border border-slate-200/90 hover:border-slate-400 hover:shadow-elevated transition-all p-4 group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-slate-900 group-hover:text-teal-600 transition-colors">
                            #{scan.id.slice(0, 8)}
                          </span>
                          {isPositive ? (
                            <span className="badge-high text-[11px] py-0.5">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              {scan.probable_larvae_count} Larvae Detected
                            </span>
                          ) : (
                            <span className="badge-none text-[11px] py-0.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Clean Water
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(scan.created_at).toLocaleDateString()}
                          </span>
                          {scan.latitude && scan.longitude && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-teal-600" />
                              Geotagged
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-900 group-hover:text-white text-slate-600 flex items-center justify-center transition-all border border-slate-200">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Regional Hotspot Map Preview (1 Column) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-600" />
              Regional Hotspots
            </h2>
            <Link to="/map" className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1">
              Full Map <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="card p-3 bg-white border border-slate-200/90 shadow-card space-y-3">
            <HotspotMap
              cells={hotspotsData?.cells || []}
              zoom={11}
            />
            <div className="p-2.5 rounded-control bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Exact coordinates are masked in ~1.1km grid cells to protect home privacy.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Community Vector Prevention Guidelines */}
      <div className="card bg-teal-50/70 border border-teal-200 p-6 space-y-4">
        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Info className="w-5 h-5 text-teal-600" />
          Home Vector Breeding Prevention Checklist
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
          <div className="p-4 rounded-control bg-white border border-teal-200 space-y-1.5 shadow-2xs">
            <span className="font-black text-slate-900 block text-sm">1. Empty & Scrub Weekly</span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Empty flowerpot trays, pet bowls, and coolers once a week. Scrub internal walls to dislodge mosquito eggs.
            </p>
          </div>

          <div className="p-4 rounded-control bg-white border border-teal-200 space-y-1.5 shadow-2xs">
            <span className="font-black text-slate-900 block text-sm">2. Tightly Cover Storage</span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Cover overhead water tanks, cisterns, and rainwater barrels with tight lids or fine mosquito netting.
            </p>
          </div>

          <div className="p-4 rounded-control bg-white border border-teal-200 space-y-1.5 shadow-2xs">
            <span className="font-black text-slate-900 block text-sm">3. Report Public Puddles</span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Scan public potholes or roadside drains. Positive detections are dispatched directly to municipal field teams.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
