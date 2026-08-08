import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabaseClient'

export function useSwapOptions(componentId, buildIds, enabled) {
    return useQuery({
        queryKey: ['swap-options', componentId, buildIds],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_swap_options', {
                p_component_id: componentId,
                p_build_ids: buildIds,
                p_limit: 6,
            })

            if (error) throw error
            return data ?? []
        },
        enabled: !!componentId && !!buildIds?.length && enabled,
        staleTime: 1000 * 60 * 5,
    })
}