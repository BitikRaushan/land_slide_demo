/**
 * Centralised polling service.
 * Each consumer registers a fetcher + interval. The service de-duplicates
 * intervals and tears them down when no consumers remain. Designed to be
 * future-swappable with a WebSocket bus (same subscription API).
 */
const tasks = new Map() // key -> { fetcher, intervalMs, subs:Set<fn>, handle, lastVal }

export function subscribe(key, fetcher, intervalMs, cb) {
  let task = tasks.get(key)
  if (!task) {
    task = { fetcher, intervalMs, subs: new Set(), handle: null, lastVal: null }
    tasks.set(key, task)
  }
  task.subs.add(cb)

  const tick = async () => {
    try {
      const data = await task.fetcher()
      task.lastVal = data
      task.subs.forEach((s) => s(data, null))
    } catch (err) {
      task.subs.forEach((s) => s(null, err))
    }
  }

  if (!task.handle) {
    tick() // immediate fire
    task.handle = setInterval(tick, intervalMs)
  } else if (task.lastVal !== null) {
    // new subscriber immediately gets last value
    cb(task.lastVal, null)
  }

  return () => {
    task.subs.delete(cb)
    if (task.subs.size === 0) {
      clearInterval(task.handle)
      tasks.delete(key)
    }
  }
}
