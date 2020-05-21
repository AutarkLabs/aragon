import React, { useCallback, useContext, useEffect } from 'react'
import { AppStateContext } from '../context/AppStateContext'
import forum from '../abi/Forum.json'

export default function useAragonApi() {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAragonApi must be used within a AppStateProvider')
  }
  if (context.methods) return { api: context.methods }
  return {}
}
