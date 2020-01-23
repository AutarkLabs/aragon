import React, { useCallback, useContext, useMemo, useState } from 'react'
import { getClientTheme, setClientTheme } from './local-settings'

const SETTINGS_THEME = getClientTheme()
const ClientThemeContext = React.createContext(SETTINGS_THEME)

function ClientThemeProvider(props) {
  const [appearance, setAppearance] = useState(SETTINGS_THEME.appearance)
  const [theme, setTheme] = useState(SETTINGS_THEME.theme)

  const toggleAppearance = useCallback(() => {
    const newAppearance = appearance === 'light' ? 'dark' : 'light'
    const newTheme = theme ? {
      ...theme,
      _name: newAppearance,
      _appearance: newAppearance,
    } : null
    setAppearance(newAppearance)
    setTheme(newTheme)
    setClientTheme(newAppearance, newTheme)
  }, [appearance, theme])

  const updateClientTheme = useCallback((appearance, theme) => {
    setAppearance(appearance)
    setTheme(theme)
    setClientTheme(appearance, theme)
  })

  const clientTheme = useMemo(
    () => ({
      appearance,
      theme,
      toggleAppearance,
      updateClientTheme,
    }),
    [appearance, theme, toggleAppearance, updateClientTheme]
  )

  return <ClientThemeContext.Provider value={clientTheme} {...props} />
}

function useClientTheme() {
  return useContext(ClientThemeContext)
}

export { ClientThemeProvider, useClientTheme }
