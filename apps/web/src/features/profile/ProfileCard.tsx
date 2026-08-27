import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { useAuth } from '../auth/AuthContext';
import { 
  User, 
  ShieldCheck, 
  Edit3, 
  Save, 
  X, 
  Phone, 
  Building, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';

interface ProfileCardProps {
  user: UserProfile;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ user }) => {
  const { updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user.full_name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [organization, setOrganization] = useState(user.organization || '');
  const [locationCity, setLocationCity] = useState(user.location_city || '');
  const [bio, setBio] = useState(user.bio || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Full Name is required.');
      return;
    }

    setError(null);
    setSaving(true);

    try {
      await updateUserProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        organization: organization.trim() || undefined,
        location_city: locationCity.trim() || undefined,
        bio: bio.trim() || undefined,
      });

      setSaving(false);
      setIsEditing(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setSaving(false);
      setError(err.message || 'Failed to update profile information.');
    }
  };

  const handleCancel = () => {
    setFullName(user.full_name || '');
    setPhone(user.phone || '');
    setOrganization(user.organization || '');
    setLocationCity(user.location_city || '');
    setBio(user.bio || '');
    setError(null);
    setIsEditing(false);
  };

  return (
    <div className="card space-y-4 bg-white border border-slate-200/90 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-teal-600" />
            Personal Profile & Surveillance Credentials
          </h3>
          <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-900 text-white uppercase font-mono shadow-2xs">
            {user.role}
          </span>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="btn-secondary text-xs py-1.5 px-3.5 flex items-center gap-1.5 shadow-2xs font-bold"
          >
            <Edit3 className="w-3.5 h-3.5 text-teal-600" />
            Edit Profile Info
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCancel}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
        )}
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-control bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile information saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-control bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
          <span>{error}</span>
        </div>
      )}

      {!isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="p-3.5 rounded-control bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block font-bold text-[11px]">Full Name</span>
              <span className="text-sm font-black text-slate-900">{user.full_name}</span>
            </div>

            <div className="p-3.5 rounded-control bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block font-bold text-[11px]">Email Address</span>
              <span className="text-sm font-bold text-slate-900">{user.email || `${user.full_name.toLowerCase().replace(/\s+/g, '')}@larvalens.org`}</span>
            </div>

            <div className="p-3.5 rounded-control bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block font-bold text-[11px] flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" /> Phone Number
              </span>
              <span className="text-xs font-bold text-slate-800">{user.phone || '— Not provided —'}</span>
            </div>

            <div className="p-3.5 rounded-control bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block font-bold text-[11px] flex items-center gap-1">
                <Building className="w-3 h-3 text-slate-400" /> Department / Organization
              </span>
              <span className="text-xs font-bold text-slate-800">{user.organization || '— Not specified —'}</span>
            </div>

            <div className="p-3.5 rounded-control bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block font-bold text-[11px] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" /> City / Surveillance Zone
              </span>
              <span className="text-xs font-bold text-slate-800">{user.location_city || '— Global / Unassigned —'}</span>
            </div>

            <div className="p-3.5 rounded-control bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block font-bold text-[11px]">Account ID</span>
              <span className="font-mono text-slate-600 text-[11px] break-all">{user.id}</span>
            </div>
          </div>

          {user.bio && (
            <div className="p-3.5 rounded-control bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 block font-bold text-[11px] mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3 text-slate-400" /> Field Notes & Bio:
              </span>
              <p className="text-slate-800 leading-relaxed font-medium">{user.bio}</p>
            </div>
          )}

          <div className="p-3 rounded-control bg-emerald-50/60 border border-emerald-200 text-xs flex items-center justify-between">
            <span className="text-emerald-800 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Verified Surveillance Profile
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Registered on {new Date(user.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4 pt-1 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="text-xs font-bold text-slate-900 block mb-1">
                Full Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full text-xs p-2.5 rounded-control border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-900 block mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full text-xs p-2.5 rounded-control border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-900 block mb-1">
                Organization / Department
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. Vector Control Division, Ward 8"
                className="w-full text-xs p-2.5 rounded-control border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-900 block mb-1">
                City / Assigned Zone
              </label>
              <input
                type="text"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                placeholder="e.g. New Delhi, Central Zone"
                className="w-full text-xs p-2.5 rounded-control border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-900 block mb-1">
              Field Bio & Surveillance Notes
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Add your entomological background, assigned municipal sectors, or inspection duties..."
              className="w-full text-xs p-2.5 rounded-control border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary text-xs py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5 shadow-sm"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Profile Changes
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
