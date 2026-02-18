import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase.ts';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  initialize: () => () => void;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  initialize: () => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, loading: false });
    });

    // Listen for auth changes (handles JWT refresh automatically)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        set({ session, user: session?.user ?? null, loading: false });
      },
    );

    return () => subscription.unsubscribe();
  },

  signUp: async (email, password, fullName) => {
    set({ error: null, loading: true });
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName ?? '' } },
    });
    if (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
    set({ loading: false });
  },

  signIn: async (email, password) => {
    set({ error: null, loading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
    set({ loading: false });
  },

  signOut: async () => {
    set({ error: null });
    const { error } = await supabase.auth.signOut();
    if (error) {
      set({ error: error.message });
      throw error;
    }
    set({ user: null, session: null });
  },

  resetPassword: async (email) => {
    set({ error: null, loading: true });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
    set({ loading: false });
  },

  clearError: () => set({ error: null }),
}));
