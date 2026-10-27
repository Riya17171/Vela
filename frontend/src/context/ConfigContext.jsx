import { createContext, useContext, useEffect, useState } from 'react'

import { fetchPublicConfig } from '../services/meta.js'

const DEFAULT_CONFIG = { currency: 'INR', payments: { enabled: false }, uploadsEnabled: false, maxCartItemQuantity: 10, maxCompareItems: 4 }

const ConfigContext = createContext({ config: DEFAULT_CONFIG, loaded: false, error: null })

export function ConfigProvider({ children }) {
  const [state, setState] = useState({ config: DEFAULT_CONFIG, loaded: false, error: null })

  useEffect(() => {
    fetchPublicConfig()
      .then((config) => setState({ config: { ...DEFAULT_CONFIG, ...config }, loaded: true, error: null }))
      .catch((error) => setState({ config: DEFAULT_CONFIG, loaded: true, error }))
  }, [])

  return <ConfigContext.Provider value={state}>{children}</ConfigContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfig() {
  return useContext(ConfigContext)
}
