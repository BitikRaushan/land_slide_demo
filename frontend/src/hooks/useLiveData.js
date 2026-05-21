import { useEffect, useState } from 'react'
import { subscribe } from '@/services/polling'

/**
 * useLiveData
 * -----------
 * Hook that subscribes to a polling task and returns { data, error, loading }.
 * The same hook shape will be reused when the backend exposes WebSocket
 * streams — we'd just swap `subscribe()` implementation in services/polling.
 *
 * @param {string} key    Unique cache key (shared across components)
 * @param {() => Promise<any>} fetcher
 * @param {number} intervalMs
 */
export function useLiveData(key, fetcher, intervalMs = 8000) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribe(key, fetcher, intervalMs, (val, err) => {
      if (err) setError(err)
      else {
        setData(val)
        setError(null)
      }
      setLoading(false)
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, intervalMs])

  return { data, error, loading }
}
