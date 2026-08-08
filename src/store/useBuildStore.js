import { create } from 'zustand'

export const useBuildStore = create((set, get) => ({
    componentIds: null,
    originalComponentIds: null,
    fanCount: 0,
    reasoning: null,
    totalPrice: null,
    generating: false,

    setGenerating: (v) => set({ generating: v }),

    setBuild: (build) => set({
        componentIds: build.componentIds,
        originalComponentIds: build.componentIds,
        fanCount: 0,
        reasoning: build.reasoning,
        totalPrice: build.totalPrice,
    }),

    swapComponent: (oldId, newId) => set((state) => ({
        componentIds: state.componentIds.map((id) => (id === oldId ? newId : id)),
    })),

    resetToOriginal: () => set((state) => ({
        componentIds: state.originalComponentIds,
    })),

    hasSwaps: () => {
        const { componentIds, originalComponentIds } = get()
        if (!componentIds || !originalComponentIds) return false
        return componentIds.some((id, i) => id !== originalComponentIds[i])
    },

    setFanCount: (n) => set({ fanCount: Math.max(0, Math.min(6, n)) }),

    clearBuild: () => set({
        componentIds: null,
        originalComponentIds: null,
        fanCount: 0,
        reasoning: null,
        totalPrice: null,
    }),
}))