import { create } from 'zustand'

export const useSystemStore = create((set) => ({
  health: null,
  setHealth: (h) => set({ health: h }),
}))
