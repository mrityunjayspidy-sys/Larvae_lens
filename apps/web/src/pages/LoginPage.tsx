import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { isSupabaseConfigured } from '../features/auth/supabase';
import { UserRole } from '../types';
import { 
  Camera, 
  Lock, 
  Mail, 
  User, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  Users,
  Cpu,
  Info
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextRoute = searchParams.get('next');

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('citizen');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getDashboardRoute = (role: UserRole) => {
    if (nextRoute) return nextRoute;
    switch (role) {
      case 'citizen':
        return '/dashboard/citizen';
      case 'field_worker':
        return '/dashboard/field-worker';
      case 'admin':
        return '/dashboard/admin';
      default:
        return '/dashboard/citizen';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const newUser = await signUp(email, password, fullName, selectedRole);
        setSuccessMsg(`Account created as ${selectedRole.replace(/_/g, ' ').toUpperCase()}! Signing in...`);
        setTimeout(() => {
          navigate(getDashboardRoute(newUser.role || selectedRole), { replace: true });
        }, 800);
      } else {
        const loggedUser = await signIn(email, password);
        navigate(getDashboardRoute(loggedUser.role), { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAccount = (roleType: UserRole) => {
    setSelectedRole(roleType);
    if (roleType === 'citizen') {
      setEmail('citizen@larvalens.org');
      setPassword('citizen1234');
      setFullName('Citizen Ananya');
    } else if (roleType === 'admin') {
      setEmail('admin@larvalens.org');
      setPassword('admin1234');
      setFullName('Dr. Rajesh (Admin)');
    } else {
      setEmail('fieldworker@larvalens.org');
      setPassword('worker1234');
      setFullName('Surveyor Ramesh');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black shadow-sm">
              <Camera className="w-6 h-6 text-teal-400" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              Larva<span className="text-teal-600 font-bold">Lens</span>
            </span>
          </Link>
          <h2 className="text-2xl font-black text-slate-900">
            {isSignUp ? 'Create Dedicated Account' : 'Sign In to Portal'}
          </h2>
          <p className="text-xs text-slate-600">
            {isSignUp 
              ? 'Select your permanent operational field role upon registration' 
              : 'Enter your credentials to access your role-specific surveillance dashboard'}
          </p>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border mt-1 bg-white border-slate-200 shadow-2xs">
            {isSupabaseConfigured ? (
              <span className="text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Connected to Supabase Auth & Database
              </span>
            ) : (
              <span className="text-slate-600 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                Local Auth Active
              </span>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-control bg-slate-200 border border-slate-300 text-xs font-bold text-slate-900">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError(null);
              setSuccessMsg(null);
            }}
            className={`py-2.5 rounded-control transition-all ${
              !isSignUp ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError(null);
              setSuccessMsg(null);
            }}
            className={`py-2.5 rounded-control transition-all ${
              isSignUp ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Register Account
          </button>
        </div>

        {/* Form Card */}
        <div className="card space-y-4 bg-white border border-slate-200 shadow-card">
          {error && (
            <div className="p-3.5 rounded-control bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-control bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900" htmlFor="fullName">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ananya Sharma"
                      className="w-full text-xs pl-9 pr-3 py-3 rounded-control border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none bg-slate-50 text-slate-900"
                    />
                  </div>
                </div>

                {/* 3 Core Roles Selection (Reviewer removed) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900">
                      Select Permanent Operational Role
                    </label>
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Permanent Selection
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('citizen')}
                      className={`p-3 rounded-control border text-left text-xs transition-all ${
                        selectedRole === 'citizen'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <User className="w-4 h-4 text-teal-400" />
                        <span>Citizen / User</span>
                      </div>
                      <p className={`text-[10px] ${selectedRole === 'citizen' ? 'text-slate-300' : 'text-slate-500'}`}>
                        Upload photo/video & check home water
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('field_worker')}
                      className={`p-3 rounded-control border text-left text-xs transition-all ${
                        selectedRole === 'field_worker'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <Users className="w-4 h-4 text-teal-400" />
                        <span>Field Worker</span>
                      </div>
                      <p className={`text-[10px] ${selectedRole === 'field_worker' ? 'text-slate-300' : 'text-slate-500'}`}>
                        View assigned sites & log larvicide treatments
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('admin')}
                      className={`p-3 rounded-control border text-left text-xs transition-all ${
                        selectedRole === 'admin'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <Cpu className="w-4 h-4 text-teal-400" />
                        <span>Admin</span>
                      </div>
                      <p className={`text-[10px] ${selectedRole === 'admin' ? 'text-slate-300' : 'text-slate-500'}`}>
                        Dispatch tasks & view all municipal data
                      </p>
                    </button>
                  </div>

                  <div className="p-2 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-600 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Once created, the field role cannot be modified in Settings.</span>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900" htmlFor="email">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-xs pl-9 pr-3 py-3 rounded-control border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none bg-slate-50 text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900" htmlFor="password">Password (min 6 characters)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-9 pr-3 py-3 rounded-control border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none bg-slate-50 text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-xs py-3.5 mt-2"
            >
              {loading ? (
                <span>Authenticating Session...</span>
              ) : isSignUp ? (
                <span className="flex items-center justify-center gap-2">
                  Create {selectedRole.replace(/_/g, ' ').toUpperCase()} Account <ArrowRight className="w-4 h-4" />
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In to Dashboard <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Quick Demo Role Presets (3 core roles) */}
        <div className="p-4 rounded-card bg-slate-100 border border-slate-200 text-xs space-y-2.5 shadow-sm">
          <span className="font-bold text-slate-900 block text-[11px] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" /> 1-Click Role Login Presets:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillQuickAccount('citizen')}
              className={`px-3 py-2.5 rounded border font-black text-xs text-center shadow-2xs transition-all active:scale-95 ${
                selectedRole === 'citizen' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              Citizen / User
            </button>
            <button
              type="button"
              onClick={() => fillQuickAccount('field_worker')}
              className={`px-3 py-2.5 rounded border font-black text-xs text-center shadow-2xs transition-all active:scale-95 ${
                selectedRole === 'field_worker' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              Field Worker
            </button>
            <button
              type="button"
              onClick={() => fillQuickAccount('admin')}
              className={`px-3 py-2.5 rounded border font-black text-xs text-center shadow-2xs transition-all active:scale-95 ${
                selectedRole === 'admin' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
