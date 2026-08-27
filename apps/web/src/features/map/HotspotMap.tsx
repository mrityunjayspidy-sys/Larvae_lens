import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { HotspotCell } from '../../types';

interface HotspotMapProps {
  cells: HotspotCell[];
  center?: [number, number];
  zoom?: number;
}

const SetViewOnMount: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export const HotspotMap: React.FC<HotspotMapProps> = ({
  cells,
  center = [28.6139, 77.2090], // Default coordinates
  zoom = 12,
}) => {
  const activeCenter: [number, number] = cells.length > 0
    ? [cells[0].latitude_bucket, cells[0].longitude_bucket]
    : center;

  const getColorByRisk = (risk: string) => {
    switch (risk) {
      case 'high': return '#C94A4A';
      case 'medium': return '#E59F23';
      case 'low': return '#0F8B8D';
      case 'none_observed':
      default: return '#208A61';
    }
  };

  return (
    <div className="relative w-full h-[500px] rounded-card overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      <MapContainer
        center={activeCenter}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        <SetViewOnMount center={activeCenter} zoom={zoom} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {cells.map((cell) => {
          const color = getColorByRisk(cell.dominant_risk);
          const radius = Math.min(30, Math.max(10, 8 + cell.probable_larvae_total * 2));

          return (
            <CircleMarker
              key={cell.id}
              center={[cell.latitude_bucket, cell.longitude_bucket]}
              radius={radius}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.5,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-xs space-y-1.5 p-1">
                  <div className="font-bold text-navy flex items-center justify-between gap-3">
                    <span>Surveillance Cluster</span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase"
                      style={{ backgroundColor: color }}
                    >
                      {cell.dominant_risk.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-slate-600 space-y-0.5 text-[11px]">
                    <p>Total Scans in Cell: <strong>{cell.scan_count}</strong></p>
                    <p>Probable Larvae Observed: <strong>{cell.probable_larvae_total}</strong></p>
                    <p>Grid Cell: {cell.latitude_bucket}°, {cell.longitude_bucket}°</p>
                    <p className="text-[10px] text-slate-400">
                      Latest Activity: {new Date(cell.latest_scan_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 right-4 z-[400] bg-surface/90 backdrop-blur p-3 rounded-card border border-slate-200 shadow-md text-xs space-y-2">
        <span className="font-bold text-navy text-[11px] block">Surveillance Risk Index</span>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-healthRed"></span>
            <span>High (≥6 Larvae)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-healthAmber"></span>
            <span>Medium (3–5 Larvae)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-teal"></span>
            <span>Low (1–2 Larvae)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-healthGreen"></span>
            <span>None Observed (0 Larvae)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
