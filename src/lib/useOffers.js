import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabaseClient'

export function useOffers(componentId) {
    return useQuery({
        queryKey: ['offers', componentId],
        queryFn: async () => {
            const { data, error } = await supabase.functions.invoke('fetch-offers', {
                body: { componentId },
            })

            if (error) throw error
            if (data?.error) throw new Error(data.error)

            return data.offers ?? []
        },
        enabled: !!componentId,
        staleTime: 1000 * 60 * 60,
        retry: false,
    })
}