import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabaseClient'
import { useAuthStore } from '../store/useAuthStore'

const HISTORY_LIMIT = 20

export function useSaveBuild() {
    const user = useAuthStore((s) => s.user)
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            name, purpose, budget, componentIds, fanCount, reasoning,
            autoSaved = false,
        }) => {
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
                    auto_saved: autoSaved,
                })
                .select()
                .single()

            if (error) throw error

            // keep history from growing without bound
            if (autoSaved) {
                const { data: old } = await supabase
                    .from('saved_builds')
                    .select('id')
                    .eq('auto_saved', true)
                    .order('created_at', { ascending: false })
                    .range(HISTORY_LIMIT, HISTORY_LIMIT + 49)

                if (old?.length) {
                    await supabase
                        .from('saved_builds')
                        .delete()
                        .in('id', old.map((r) => r.id))
                }
            }

            return data
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['saved-builds', user.id, variables.autoSaved ?? false],
            })
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

export function useUpdateBuild() {
    const user = useAuthStore((s) => s.user)
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, name, purpose, budget, componentIds, fanCount, reasoning }) => {
            const { data, error } = await supabase
                .from('saved_builds')
                .update({
                    name,
                    purpose,
                    budget,
                    component_ids: componentIds,
                    fan_count: fanCount,
                    reasoning,
                })
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['saved-builds', user.id, false] })
        },
    })
}