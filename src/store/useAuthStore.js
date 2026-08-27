import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'
import { queryClient } from '../lib/queryClient'
import { useBuildStore } from './useBuildStore'

export const useAuthStore = create((set) => ({
    user: null,
    setUser: (user) => set({ user }),
}))

// maybe_grant_daily_credit is throttled to 24h server-side, so asking twice is
// harmless — this set only avoids a pointless round trip on every token refresh
// within one page load.
const grantAsked = new Set()

async function grantDailyCredit(user) {
    if (!user || grantAsked.has(user.id)) return
    grantAsked.add(user.id)

    try {
        const { data, error } = await supabase.functions.invoke('daily-credit-grant')

        if (error) {
            grantAsked.delete(user.id)   // let the next sign-in try again
            return
        }

        // only bust the cache when a credit actually landed
        if (data?.granted) {
            queryClient.invalidateQueries({ queryKey: ['profile', user.id] })
        }
    } catch {
        // a failed grant must never break sign-in
        grantAsked.delete(user.id)
    }
}

supabase.auth.getSession().then(({ data }) => {
    const user = data.session?.user ?? null
    useAuthStore.getState().setUser(user)
    grantDailyCredit(user)
})

supabase.auth.onAuthStateChange((event, session) => {
    const user = session?.user ?? null
    useAuthStore.getState().setUser(user)

    if (event === 'SIGNED_IN') {
        grantDailyCredit(user)
    }

    if (event === 'SIGNED_OUT') {
        grantAsked.clear()
        useBuildStore.getState().clearBuild()
    }
})
