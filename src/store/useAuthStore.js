import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'

export const useAuthStore = create((set) => ({
    user: null,
    loading: true,
    setUser: (user) => set({ user, loading: false }),
}))

//get the existing session then listen for changes
supabase.auth.getSession().then(({ data }) => {
    useAuthStore.getState().setUser(data.session?.user ?? null)
})

supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setUser(session?.user ?? null)

    if (event === 'SIGNED_OUT') {
        useBuildStore.getState().clearBuild()
    }
})