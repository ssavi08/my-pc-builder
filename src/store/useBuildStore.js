import { create } from 'zustand'

export const useBuildStore = create((set) => ({
    currentBuild: null,
    reasoning: null,
    setBuild: (currentBuild, reasoning) => set({ currentBuild, reasoning }),
    clearBuild: () => set({ currentBuild: null, reasoning: null }),
}))