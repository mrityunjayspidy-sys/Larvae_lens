import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { HotspotMap } from '../features/map/HotspotMap';
import { MapPin, ShieldCheck, RefreshCw } from 'lucide-react';

export const MapPage: React.FC = () => {
  const { data: hotspots, isLoading, refetch } = useQuery({
    queryKey: ['hotspots'],
    queryFn: () => apiClient.getHotspots(),
    staleTime: 60000,
  });

  const cells = hotspots?.cells || [];
  const totalScans = cells.reduce((acc, c) => acc + c.scan_count, 0);
  const totalLarvae = cells.reduce((acc, c) => acc + c.probable_larvae_total, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy flex items-center gap-2.5">
            <MapPin className="w-7 h-7 text-teal" />
            Vector Surveillance Hotspots
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Privacy-preserving municipal surveillance map aggregating probable larvae observations across geographic grid cells.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="btn-secondary text-xs py-2 px-3 self-start sm:self-auto flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Map Data
        </button>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <span className="text-xs text-slate-500 font-semibold block">Surveillance Clusters</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-navy">{cells.length}</span>
          <span className="text-[11px] text-slate-400 block mt-1">~1.1km snapped grid cells</span>
        </div>

        <div className="card p-4">
          <span className="text-xs text-slate-500 font-semibold block">Geotagged Clips Mapped</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-navy">{totalScans}</span>
          <span className="text-[11px] text-slate-400 block mt-1">Total completed field scans</span>
        </div>

        <div className="card p-4">
          <span className="text-xs text-slate-500 font-semibold block">Probable Larvae Observed</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-primary">{totalLarvae}</span>
          <span className="text-[11px] text-slate-400 block mt-1">Screening evidence tracks</span>
        </div>
      </div>

      {/* Interactive Map */}
      {isLoading ? (
        <div className="card h-[450px] flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-teal animate-spin" />
          <p className="text-sm font-semibold text-navy">Loading geospatial surveillance layer...</p>
        </div>
      ) : (
        <HotspotMap cells={cells} />
      )}

      {/* Privacy Guarantee Box */}
      <div className="card bg-teal-light/50 border border-teal/20 text-xs text-navy space-y-2">
        <div className="flex items-center gap-2 font-bold text-teal">
          <ShieldCheck className="w-4 h-4" />
          <span>Surveillance Privacy & Ethical Safeguards</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          {hotspots?.disclaimer || 'To protect resident privacy, exact residential GPS coordinates are snapped to regional centroid buckets. Raw video clips, surveyor names, and home addresses are never published to the public hotspot layer.'}
        </p>
      </div>
    </div>
  );
};
