import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Runs an async loader and tracks { data, loading, error }. Results from a
 * superseded call (e.g. after the user changed a filter) are discarded.
 */
export function useAsync(loader, deps = [], { immediate = true, initialData = null } = {}) {
  const [state, setState] = useState({ data: initialData, loading: immediate, error: null })
  const callId = useRef(0)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps)

  const reload = useCallback(async () => {
    const id = ++callId.current
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const data = await run()
      if (id === callId.current) setState({ data, loading: false, error: null })
      return data
    } catch (error) {
      if (id === callId.current) setState((prev) => ({ ...prev, loading: false, error }))
      return undefined
    }
  }, [run])

  useEffect(() => {
    if (immediate) reload()
  }, [reload, immediate])

  const setData = useCallback((updater) => {
    setState((prev) => ({ ...prev, data: typeof updater === 'function' ? updater(prev.data) : updater }))
  }, [])

  return { ...state, reload, setData }
}
