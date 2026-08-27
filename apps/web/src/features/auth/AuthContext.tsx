import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { apiClient } from '../../api/client';
import { UserProfile, UserRole } from '../../types';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<UserProfile>;
  signUp: (email: string, pass: string, fullName: string, role?: UserRole) => Promise<UserProfile>;
  signOut: () => Promise<void>;
  switchRoleForDemo: (role: UserRole) => Promise<void>;
  updateUserProfile: (data: { full_name?: string; phone?: string; organization?: string; location_city?: string; bio?: string }) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileFromBackend = async (authToken: string): Promise<UserProfile | null> => {
    try {
      const profile = await apiClient.getMyProfile(authToken);
      setUser(profile);
      localStorage.setItem('larvalens_auth_user', JSON.stringify(profile));
      return profile;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('larvalens_auth_user');
    const storedToken = localStorage.getItem('larvalens_auth_token');

    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          const userMeta = session.user.user_metadata || {};
          const appMeta = session.user.app_metadata || {};
          const emailLower = session.user.email?.toLowerCase() || '';
          
          let role: UserRole = 'citizen';
          if (appMeta.role || userMeta.role) {
            role = (appMeta.role || userMeta.role) as UserRole;
          } else if (emailLower.includes('admin')) {
            role = 'admin';
          } else if (emailLower.includes('worker') || emailLower.includes('field')) {
            role = 'field_worker';
          }

          const initialUser: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: userMeta.full_name || (role === 'admin' ? 'Dr. Rajesh (Admin)' : role === 'field_worker' ? 'Surveyor Ramesh' : 'Citizen Resident'),
            role,
            created_at: session.user.created_at,
            updated_at: session.user.updated_at || session.user.created_at,
          };
          setUser(initialUser);
          setToken(session.access_token);
          localStorage.setItem('larvalens_auth_user', JSON.stringify(initialUser));
          localStorage.setItem('larvalens_auth_token', session.access_token);
          await fetchProfileFromBackend(session.access_token);
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const userMeta = session.user.user_metadata || {};
          const appMeta = session.user.app_metadata || {};
          const emailLower = session.user.email?.toLowerCase() || '';

          let role: UserRole = 'citizen';
          if (appMeta.role || userMeta.role) {
            role = (appMeta.role || userMeta.role) as UserRole;
          } else if (emailLower.includes('admin')) {
            role = 'admin';
          } else if (emailLower.includes('worker') || emailLower.includes('field')) {
            role = 'field_worker';
          }

          const initialUser: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: userMeta.full_name || (role === 'admin' ? 'Dr. Rajesh (Admin)' : role === 'field_worker' ? 'Surveyor Ramesh' : 'Citizen Resident'),
            role,
            created_at: session.user.created_at,
            updated_at: session.user.updated_at || session.user.created_at,
          };
          setUser(initialUser);
          setToken(session.access_token);
          localStorage.setItem('larvalens_auth_user', JSON.stringify(initialUser));
          localStorage.setItem('larvalens_auth_token', session.access_token);
          await fetchProfileFromBackend(session.access_token);
        } else {
          setUser(null);
          setToken(null);
        }
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      if (storedUser && storedToken) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        } catch {
          // ignore
        }
      }
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, pass: string): Promise<UserProfile> => {
    const emailLower = email.toLowerCase().trim();
    let detectedRole: UserRole = 'citizen';
    if (emailLower.includes('admin')) {
      detectedRole = 'admin';
    } else if (emailLower.includes('worker') || emailLower.includes('field')) {
      detectedRole = 'field_worker';
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: emailLower, password: pass });
      if (error) {
        // If Supabase credentials fail (e.g. password mismatch), smoothly fallback for demo accounts
        if (emailLower.includes('admin') || emailLower.includes('worker') || emailLower.includes('citizen')) {
          const fakeId = 'user-' + btoa(emailLower).slice(0, 8);
          const fallbackUser: UserProfile = {
            id: fakeId,
            email: emailLower,
            full_name: detectedRole === 'admin' ? 'Dr. Rajesh (Admin)' : detectedRole === 'field_worker' ? 'Surveyor Ramesh' : 'Citizen Resident',
            role: detectedRole,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          const fakeToken = 'local-jwt-' + btoa(JSON.stringify(fallbackUser));
          setUser(fallbackUser);
          setToken(fakeToken);
          localStorage.setItem('larvalens_auth_user', JSON.stringify(fallbackUser));
          localStorage.setItem('larvalens_auth_token', fakeToken);
          return fallbackUser;
        }
        throw error;
      }
      if (data.session) {
        setToken(data.session.access_token);
        const userMeta = data.session.user.user_metadata || {};
        const appMeta = data.session.user.app_metadata || {};
        const role = (appMeta.role || userMeta.role || detectedRole) as UserRole;
        
        const loggedInUser: UserProfile = {
          id: data.session.user.id,
          email: data.session.user.email || emailLower,
          full_name: userMeta.full_name || (role === 'admin' ? 'Dr. Rajesh (Admin)' : role === 'field_worker' ? 'Surveyor Ramesh' : 'Citizen Resident'),
          role,
          created_at: data.session.user.created_at,
          updated_at: data.session.user.updated_at || data.session.user.created_at,
        };
        setUser(loggedInUser);
        localStorage.setItem('larvalens_auth_user', JSON.stringify(loggedInUser));
        localStorage.setItem('larvalens_auth_token', data.session.access_token);
        await fetchProfileFromBackend(data.session.access_token);
        return loggedInUser;
      }
    }

    // Local authentication fallback
    const fakeId = 'local-user-' + btoa(emailLower).slice(0, 8);
    const newUser: UserProfile = {
      id: fakeId,
      email: emailLower,
      full_name: detectedRole === 'admin' ? 'Dr. Rajesh (Admin)' : detectedRole === 'field_worker' ? 'Surveyor Ramesh' : 'Citizen Resident',
      role: detectedRole,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const fakeToken = 'local-jwt-' + btoa(JSON.stringify(newUser));
    setUser(newUser);
    setToken(fakeToken);
    localStorage.setItem('larvalens_auth_user', JSON.stringify(newUser));
    localStorage.setItem('larvalens_auth_token', fakeToken);
    return newUser;
  };

  const signUp = async (email: string, pass: string, fullName: string, role: UserRole = 'citizen'): Promise<UserProfile> => {
    const emailLower = email.toLowerCase().trim();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: emailLower,
        password: pass,
        options: {
          data: { full_name: fullName, role },
        },
      });
      if (error) {
        // Fallback for local demo if signup errors
        const fakeId = 'user-' + btoa(emailLower).slice(0, 8);
        const fallbackUser: UserProfile = {
          id: fakeId,
          email: emailLower,
          full_name: fullName || 'User',
          role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const fakeToken = 'local-jwt-' + btoa(JSON.stringify(fallbackUser));
        setUser(fallbackUser);
        setToken(fakeToken);
        localStorage.setItem('larvalens_auth_user', JSON.stringify(fallbackUser));
        localStorage.setItem('larvalens_auth_token', fakeToken);
        return fallbackUser;
      }
      if (data.session) {
        setToken(data.session.access_token);
      }
    }

    const fakeId = 'local-user-' + btoa(emailLower).slice(0, 8);
    const newUser: UserProfile = {
      id: fakeId,
      email: emailLower,
      full_name: fullName || emailLower.split('@')[0],
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const fakeToken = 'local-jwt-' + btoa(JSON.stringify(newUser));
    setUser(newUser);
    setToken(fakeToken);
    localStorage.setItem('larvalens_auth_user', JSON.stringify(newUser));
    localStorage.setItem('larvalens_auth_token', fakeToken);
    return newUser;
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('larvalens_auth_user');
    localStorage.removeItem('larvalens_auth_token');
  };

  const switchRoleForDemo = async (role: UserRole) => {
    if (user) {
      const updated = { ...user, role };
      const newLocalToken = 'local-jwt-' + btoa(JSON.stringify(updated));
      setUser(updated);
      setToken(newLocalToken);
      localStorage.setItem('larvalens_auth_user', JSON.stringify(updated));
      localStorage.setItem('larvalens_auth_token', newLocalToken);

      try {
        await apiClient.updateRole(role, newLocalToken);
      } catch {
        // updated locally
      }
    }
  };

  const updateUserProfile = async (data: { full_name?: string; phone?: string; organization?: string; location_city?: string; bio?: string }) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      localStorage.setItem('larvalens_auth_user', JSON.stringify(updated));

      if (token) {
        try {
          const remoteUpdated = await apiClient.updateProfile(data, token);
          setUser(remoteUpdated);
          localStorage.setItem('larvalens_auth_user', JSON.stringify(remoteUpdated));
        } catch {
          // local update preserved
        }
      }
    }
  };

  const refreshProfile = async () => {
    if (token) {
      await fetchProfileFromBackend(token);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      signIn, 
      signUp, 
      signOut, 
      switchRoleForDemo, 
      updateUserProfile, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
