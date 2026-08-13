import { create } from 'zustand'

export const useBuildStore = create((set) => ({
    componentIds: null,
    originalComponentIds: null,
    fanCount: 0,
    reasoning: null,
    generating: false,

    setGenerating: (v) => set({ generating: v }),

    setBuild: (build) => set({
        componentIds: build.componentIds,
        originalComponentIds: build.componentIds,
        fanCount: 0,
        reasoning: build.reasoning,
    }),

    loadBuild: (saved) => set({
        componentIds: saved.component_ids,
        originalComponentIds: saved.component_ids,
        fanCount: saved.fan_count ?? 0,
        reasoning: saved.reasoning ?? null,
    }),

    swapComponent: (oldId, newId) => set((state) => ({
        componentIds: state.componentIds.map((id) => (id === oldId ? newId : id)),
    })),

    resetToOriginal: () => set((state) => ({
        componentIds: state.originalComponentIds,
    })),

    setFanCount: (n) => set({ fanCount: Math.max(0, Math.min(6, n)) }),

    clearBuild: () => set({
        componentIds: null,
        originalComponentIds: null,
        fanCount: 0,
        reasoning: null,
    }),
}))