import { create } from "zustand";

export const useUIStore = create((set) => ({
    activeModal: null,
    openModal: (name) => set({ activeModal: name}),
    closeModal: () => set({ activeModal: null }),
}))