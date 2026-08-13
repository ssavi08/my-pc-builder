import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabaseClient'
import { useAuthStore } from '../store/useAuthStore'

export function useSavedBuilds() {
    const user = useAuthStore((s) => s.user)

    return useQuery({
        queryKey: ['saved-builds', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('saved_builds')
                .select('id, name, purpose, budget, component_ids, fan_count, reasoning, created_at')
                .order('created_at', { ascending: false })

            if (error) throw error
            return data ?? []
        },
        enabled: !!user,
    })
}