import React, { useState } from 'react';
import { MapPin, ShieldAlert, Check, HelpCircle, ChevronDown, ChevronUp, Navigation, RefreshCw, Crosshair } from 'lucide-react';

interface LocationConsentProps {
  onLocationResolved: (coords: { latitude: number; longitude: number; accuracy: number } | null) => void;
  currentCoords: { latitude: number; longitude: number; accuracy: number } | null;
}

export const LocationConsentModal: React.FC<LocationConsentProps> = ({
  onLocationResolved,
  currentCoords,
}) => {
  const [loading, setLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');
  const [locationName, setLocationName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestExactLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const acc = Number(pos.coords.accuracy.toFixed(1));

        onLocationResolved({
          latitude: lat,
          longitude: lng,
          accuracy: acc,
        });

        // Reverse geocoding lookup
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`);
          if (res.ok) {
            const data = await res.json();
            if (data.display_name) {
              const parts = data.display_name.split(',');
              setLocationName(parts.slice(0, 3).join(', '));
            }
          }
        } catch {
          // Non-blocking reverse lookup
        }

        setLoading(false);
      },
      (err) => {
        setLoading(false);
        setError(`Location access denied (${err.message}). You can enter coordinates manually or skip.`);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleApplyManualCoords = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('Please enter a valid Latitude between -90 and 90.');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setError('Please enter a valid Longitude between -180 and 180.');
      return;
    }

    setError(null);
    onLocationResolved({ latitude: lat, longitude: lng, accuracy: 5.0 });
    setManualMode(false);
  };

  return (
    <div className="card space-y-3 border border-slate-200/90 bg-white shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm font-black">
            <MapPin className="w-5 h-5 text-teal-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              Exact Water Sample Location
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                GPS Geotag
              </span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tag the exact coordinates of this water container, drain, or stagnant pond for hotspot mapping.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowExplanation(!showExplanation)}
          className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 shrink-0 pt-0.5"
          aria-expanded={showExplanation}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Explain</span>
          {showExplanation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {showExplanation && (
        <div className="p-3.5 rounded-control bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5 animate-fadeIn">
          <p className="font-bold text-slate-900">Exact Location Privacy & Aggregation:</p>
          <p>
            • Precise coordinates are stored in private database storage and linked to your inspection evidence report.
          </p>
          <p>
            • Public hotspot surveillance maps group nearby observations into ~1.1km grid buckets to preserve neighborhood privacy.
          </p>
        </div>
      )}

      {currentCoords ? (
        <div className="p-3.5 rounded-control bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Exact Location Acquired: {currentCoords.latitude}°, {currentCoords.longitude}°</span>
              <span className="text-[11px] font-normal text-slate-500">(±{currentCoords.accuracy}m accuracy)</span>
            </div>
            {locationName && (
              <p className="text-[11px] text-slate-700 font-medium pl-6">
                📍 {locationName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={requestExactLocation}
              disabled={loading}
              className="text-[11px] font-bold text-slate-900 hover:underline flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Re-detect
            </button>
            <button
              type="button"
              onClick={() => {
                onLocationResolved(null);
                setLocationName(null);
              }}
              className="text-[11px] text-rose-600 hover:underline font-bold ml-2"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 pt-1">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={requestExactLocation}
              disabled={loading}
              className="btn-primary w-full sm:w-auto text-xs py-2.5 px-4 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Acquiring High-Accuracy GPS...
                </>
              ) : (
                <>
                  <Crosshair className="w-4 h-4 text-teal-400" />
                  Detect Exact GPS Location
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setManualMode(!manualMode)}
              className="btn-secondary w-full sm:w-auto text-xs py-2.5 px-4 text-slate-800 flex items-center justify-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5 text-slate-600" />
              {manualMode ? 'Cancel Manual Input' : 'Enter Coordinates Manually'}
            </button>

            <button
              type="button"
              onClick={() => onLocationResolved(null)}
              className="text-xs text-slate-500 hover:text-slate-900 px-3 py-2 font-medium"
            >
              Skip Geotag
            </button>
          </div>

          {manualMode && (
            <form onSubmit={handleApplyManualCoords} className="p-3.5 bg-slate-50 rounded-control border border-slate-200 text-xs space-y-2.5">
              <span className="font-bold text-slate-900 block text-[11px]">Enter GPS Coordinates:</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-600 block mb-0.5 font-bold">Latitude (e.g. 28.6139)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    placeholder="28.6139"
                    className="w-full text-xs p-2.5 rounded-control border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 block mb-0.5 font-bold">Longitude (e.g. 77.2090)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={customLng}
                    onChange={(e) => setCustomLng(e.target.value)}
                    placeholder="77.2090"
                    className="w-full text-xs p-2.5 rounded-control border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn-primary text-xs py-2 px-4 mt-1"
              >
                Apply Coordinates
              </button>
            </form>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-amber-800 font-medium flex items-center gap-1.5 bg-amber-50 p-3 rounded-control border border-amber-200">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
