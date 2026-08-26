import { useBuildStore } from '../store/useBuildStore'
import { DEFAULT_BUILD_IDS, DEFAULT_FAN_COUNT } from './constants'

// The scene shows a showcase build until the user generates one of their own.
// Scene and SceneStatus both resolve it here so they always agree on which
// ids are being rendered — and therefore on which query they are watching.
export function useSceneBuild() {
    const storeIds = useBuildStore((s) => s.componentIds)
    const storeFanCount = useBuildStore((s) => s.fanCount)

    const isDefault = !storeIds?.length

    return {
        componentIds: isDefault ? DEFAULT_BUILD_IDS : storeIds,
        fanCount: isDefault ? DEFAULT_FAN_COUNT : storeFanCount,
    }
}
