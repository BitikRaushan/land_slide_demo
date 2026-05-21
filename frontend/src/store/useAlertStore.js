/**
 * Lightweight Zustand store for app-wide alert state (Red/critical alerts list,
 * unacknowledged count, etc.). The polling hook keeps this in sync.
 */
import { create } from 'zustand'

export const useAlertStore = create((set, get) => ({
  alerts: [],
  seenIds: new Set(),
  setAlerts: (alerts) => {
    const prev = get().seenIds
    const newIds = []
    alerts.forEach((a) => {
      if (!prev.has(a.id)) newIds.push(a.id)
    })
    set({
      alerts,
      seenIds: new Set([...prev, ...alerts.map((a) => a.id)]),
      _new: newIds,
    })
  },
  acknowledge: (id) =>
    set({
      alerts: get().alerts.map((a) =>
        a.id === id ? { ...a, acknowledged: true } : a
      ),
    }),
  unacknowledgedCount: () =>
    get().alerts.filter((a) => !a.acknowledged).length,
}))
