import { useContext } from 'react'
import { AppStateContext } from '../context/AppStateContext'

export default function useAragonApi() {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAragonApi must be used within a AppStateProvider')
  }
  if (context.methods) return { api: context.methods }
  return {}
}
