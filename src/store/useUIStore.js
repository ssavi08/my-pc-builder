import { create } from "zustand";

export const useUIStore = create((set) => ({
    activeModal: null,
    openModal: (name) => set({ activeModal: name}),
    closeModal: () => set({ activeModal: null, selectedComponentId: null }),

    panelsVisible: true,
    togglePanels: () => set((s) => ({ panelsVisible: !s.panelsVisible })),

    selectedComponentId: null,
    selectComponent: (id) => set({ selectedComponentId: id, activeModal: 'component' }),

}))