import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { 
  Camera, 
  MapPin, 
  Filter, 
  Activity, 
  ArrowRight, 
  Smartphone,
  Sparkles
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-16 py-8 sm:py-16">
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto text-center space-y-6 px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          Mobile Vector Surveillance & AI Screening Platform
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
          High-Precision Larva Detection with <span className="text-teal-600">Debris Rejection</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
          LarvaLens inspects standing water photo and video captures, distinguishes true mosquito larvae from floating leaves, reflections, and bubbles, and builds explainable geotagged evidence for vector control teams.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
          {user ? (
            <Link to="/scan" className="btn-primary text-sm px-8 py-3.5 w-full sm:w-auto shadow-md">
              <Camera className="w-4 h-4" />
              Start New Water Scan
            </Link>
          ) : (
            <Link to="/login" className="btn-primary text-sm px-8 py-3.5 w-full sm:w-auto shadow-md">
              Sign In to Scan
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          <Link to="/map" className="btn-secondary text-sm px-7 py-3.5 w-full sm:w-auto">
            <MapPin className="w-4 h-4 text-slate-600" />
            View Hotspot Surveillance Map
          </Link>
        </div>
      </section>

      {/* 3-Pillar Verification Workflow */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Why LarvaLens Rejects False Positives</h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Traditional vision models trigger alarms on dust and ripples. LarvaLens fuses morphology with temporal tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <div className="card space-y-3 bg-white border border-slate-200/90 hover:border-slate-400 hover:shadow-elevated transition-all">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black shadow-sm">
              <Camera className="w-6 h-6 text-teal-400" />
            </div>
            <h3 className="text-lg font-black text-slate-900">1. Candidate Localization</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Real-time YOLO candidate detection scans sampled frames to localize suspected organism bounding boxes with sub-pixel precision.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="card space-y-3 bg-white border border-slate-200/90 hover:border-slate-400 hover:shadow-elevated transition-all">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black shadow-sm">
              <Filter className="w-6 h-6 text-teal-400" />
            </div>
            <h3 className="text-lg font-black text-slate-900">2. Morphology Verifier</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              15% padded crops pass through a binary verifier to reject twigs, floating leaves, sand grains, and surface bubbles.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="card space-y-3 bg-white border border-slate-200/90 hover:border-slate-400 hover:shadow-elevated transition-all">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black shadow-sm">
              <Activity className="w-6 h-6 text-teal-400" />
            </div>
            <h3 className="text-lg font-black text-slate-900">3. Temporal Tracking</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              ByteTrack compensates for mobile camera shake and validates organism motion persistence across consecutive frames.
            </p>
          </div>
        </div>
      </section>

      {/* Android Mobile App Callout */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="p-6 sm:p-8 rounded-card bg-slate-900 text-white space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 font-black text-base">
            <Smartphone className="w-6 h-6 text-teal-400" />
            <span>Mobile Android Application & Progressive Web App</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
            <div className="space-y-1">
              <strong className="text-white block font-bold text-sm">Android Field Ready:</strong>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Native Android Camera shutter with 1-click capture</li>
                <li>Offline caching and standalone APK display mode</li>
                <li>Exact GPS high-accuracy coordinates detection</li>
                <li>Touch-optimized 48px tactile bottom navigation</li>
              </ul>
            </div>

            <div className="space-y-1">
              <strong className="text-white block font-bold text-sm">Public Health Safeguards:</strong>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Traceable probable mosquito larva counts</li>
                <li>Not a clinical disease diagnosis system</li>
                <li>Requires field confirmation before larvicide</li>
                <li>Exact home coordinates masked on public maps</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
