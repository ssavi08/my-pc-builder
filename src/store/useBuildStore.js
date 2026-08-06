import { create } from 'zustand'

export const useBuildStore = create((set) => ({
    componentIds: null,
    fanCount: 0,
    reasoning: null,
    totalPrice: null,

    setBuild: (build) => set({
        componentIds: build.componentIds,
        fanCount: 0,
        reasoning: build.reasoning,
        totalPrice: build.totalPrice,
    }),

    setFanCount: (n) => set({ fanCount: Math.max(0, Math.min(6, n)) }),

    clearBuild: () => set({
        componentIds: null, fanCount: 0, reasoning: null, totalPrice: null,
    }),
}))