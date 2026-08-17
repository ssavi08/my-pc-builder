import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabaseClient'
import { useAuthStore } from '../store/useAuthStore'

export function useSavedBuilds(autoSaved = false) {
    const user = useAuthStore((s) => s.user)

    return useQuery({
        queryKey: ['saved-builds', user?.id, autoSaved],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('saved_builds')
                .select('id, name, purpose, budget, component_ids, fan_count, reasoning, created_at, auto_saved')
                .eq('auto_saved', autoSaved)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data ?? []
        },
        enabled: !!user,
    })
}