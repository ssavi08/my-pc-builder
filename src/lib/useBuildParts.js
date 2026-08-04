import { useQuery } from '@tanstack/react-query'
import { fetchBuildComponents } from './fetchBuildComponents'

export function useBuildParts(componentIds) {
    return useQuery({
        queryKey: ['build', componentIds],
        queryFn: () => fetchBuildComponents(componentIds),
        enabled: !!componentIds?.length,
    })
}