import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'
import { useBuildStore } from './useBuildStore'

export const useAuthStore = create((set) => ({
    user: null,
    loading: true,
    setUser: (user) => set({ user, loading: false }),
}))

supabase.auth.getSession().then(({ data }) => {
    useAuthStore.getState().setUser(data.session?.user ?? null)
})

supabase.auth.onAuthStateChange((event, session) => {
    useAuthStore.getState().setUser(session?.user ?? null)

    if (event === 'SIGNED_OUT') {
        useBuildStore.getState().clearBuild()
    }
})