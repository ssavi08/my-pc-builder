import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabaseClient'
import { useAuthStore } from '../store/useAuthStore'

export function useSaveBuild() {
    const user = useAuthStore((s) => s.user)
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ name, purpose, budget, componentIds, fanCount, reasoning }) => {
            const { data, error } = await supabase
                .from('saved_builds')
                .insert({
                    user_id: user.id,
                    name,
                    purpose,
                    budget,
                    component_ids: componentIds,
                    fan_count: fanCount,
                    reasoning,
                })
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['saved-builds', user.id] })
        },
    })
}

export function useDeleteBuild() {
    const user = useAuthStore((s) => s.user)
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (buildId) => {
            const { error } = await supabase
                .from('saved_builds')
                .delete()
                .eq('id', buildId)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['saved-builds', user.id] })
        },
    })
}