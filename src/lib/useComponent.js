import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabaseClient'

export function useComponent(componentId) {
    return useQuery({
        queryKey: ['component', componentId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('components')
                .select('*')
                .eq('id', componentId)
                .single()

            if (error) throw error
            return data
        },
        enabled: !!componentId,
    })
}