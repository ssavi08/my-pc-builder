import { create } from 'zustand'

export const useBuildStore = create((set) => ({
    componentIds: null,
    originalComponentIds: null,
    fanCount: 0,
    reasoning: null,
    generating: false,
    savedBuildId: null,
    savedBuildName: null,

    // What the user asked for. These live here rather than in Sidebar's local
    // state because they are saved alongside the build, so loading one has to
    // restore them — otherwise "Update build" writes back whatever the sidebar
    // happens to be showing instead of the build's own parameters.
    purpose: 'gaming',
    budget: 1200,

    setPurpose: (purpose) => set({ purpose }),
    setBudget: (budget) => set({ budget }),

    setGenerating: (v) => set({ generating: v }),

    setBuild: (build) => set({
        componentIds: build.componentIds,
        originalComponentIds: build.componentIds,
        fanCount: 0,
        reasoning: build.reasoning,
        savedBuildId: null,        
        savedBuildName: null,
    }),

    loadBuild: (saved) => set({
        componentIds: saved.component_ids,
        originalComponentIds: saved.component_ids,
        fanCount: saved.fan_count ?? 0,
        reasoning: saved.reasoning ?? null,
        savedBuildId: saved.auto_saved ? null : saved.id,
        savedBuildName: saved.auto_saved ? null : saved.name,

        // restore the parameters too, so the sidebar describes the build it is
        // showing and an update writes the row's own purpose/budget back
        purpose: saved.purpose ?? 'gaming',
        budget: Number(saved.budget) || 1200,
    }),

    swapComponent: (oldId, newId) => set((state) => ({
        componentIds: state.componentIds.map((id) => (id === oldId ? newId : id)),
    })),

    resetToOriginal: () => set((state) => ({
        componentIds: state.originalComponentIds,
    })),

    setFanCount: (n) => set({ fanCount: Math.max(0, Math.min(6, n)) }),

    // Deliberately leaves purpose/budget alone: generate.onMutate calls this, and
    // resetting them there would wipe the user's selection mid-generation — the
    // archive write in onSuccess would then record the wrong parameters.
    clearBuild: () => set({
        componentIds: null,
        originalComponentIds: null,
        fanCount: 0,
        reasoning: null,
        savedBuildId: null,
        savedBuildName: null,
    }),

    markSaved: (id, name) => set({ savedBuildId: id, savedBuildName: name }),
}))