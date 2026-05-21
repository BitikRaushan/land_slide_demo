import { create } from 'zustand'

export const useRouteStore = create((set) => ({
  origin: '',
  destination: '',
  result: null,
  isPlanning: false,
  error: null,
  setOrigin: (origin) => set({ origin }),
  setDestination: (destination) => set({ destination }),
  setResult: (result) => set({ result, error: null }),
  setError: (error) => set({ error, result: null }),
  setPlanning: (isPlanning) => set({ isPlanning }),
  reset: () => set({ origin: '', destination: '', result: null, error: null }),
}))
