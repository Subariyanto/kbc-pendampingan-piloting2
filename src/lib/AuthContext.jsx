import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, supabaseConfigured, ADMIN_EMAIL } from './supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid) => {
    if (!supabase || !uid) {
      setProfile(null);
      return null;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*, madrasah:madrasah_id (id, nama_madrasah, jenjang)')
      .eq('user_id', uid)
      .maybeSingle();
    if (error) {
      console.error('loadProfile error', error);
      setProfile(null);
      return null;
    }
    setProfile(data);
    return data;
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      if (data.session?.user) await loadProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      if (sess?.user) await loadProfile(sess.user.id);
      else setProfile(null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [loadProfile]);

  const signIn = async (email, password) => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async ({ email, password, nama, role }) => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nama, role } },
    });
    if (error) throw error;
    return data;
  };

  const redeemCode = async ({ code, role, madrasah_id }) => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
    const { data, error } = await supabase.rpc('redeem_activation_code', {
      p_code: code,
      p_role: role,
      p_madrasah_id: madrasah_id || null,
    });
    if (error) throw error;
    if (!data?.ok) throw new Error(data?.error || 'Aktivasi gagal');
    if (session?.user?.id) await loadProfile(session.user.id);
    return data;
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  const resetPassword = async (email) => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  };

  const refresh = useCallback(async () => {
    if (session?.user?.id) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const isAdmin = profile?.role === 'admin' || profile?.email === ADMIN_EMAIL;
  const role = profile?.role || null;
  const isActive = profile?.status === 'active' || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        isAdmin,
        role,
        isActive,
        signIn,
        signUp,
        signOut,
        redeemCode,
        resetPassword,
        refresh,
        configured: supabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
