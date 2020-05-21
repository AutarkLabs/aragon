import React, { createContext, useCallback, useEffect, useState } from 'react'
import { from } from 'rxjs'
import { appIds } from '../../../environment'
import forum from '../abi/Forum.json'

const INITIAL_STATE = {
  threads: [],
  isSyncing: false
}

const getCacheKey = (address, location) => {
  return `${address}.${location}`
}

export const AppStateContext = createContext({})

export const AppStateProvider = ({
  apps,
  children,
  locator,
  onPathRequest,
  wrapper,
  web3
}) => {
    const [app, setApp] = useState(null)
    const [methods, setMethods] = useState(null)
    const [appState, setAppState] = useState(INITIAL_STATE)
    const [installedApps, setInstalledApps] = useState(apps)

    useEffect(() => {
      if (apps.length > installedApps.length) setInstalledApps(apps)
    }, [apps, installedApps, setInstalledApps])

    useEffect(() => {
      const discussionsApp = installedApps.find(
        app => app.appId && app.appId === appIds.Discussions
      )
      if (discussionsApp) setApp(discussionsApp)
    }, [installedApps])

    useEffect(() => {
      if (app && !methods) {
        const contract = new web3.eth.Contract(forum.abi, app.proxyAddress)
        const appMethods = {}
        // Bind calls
        const callMethods = forum.abi.filter(
          item => item.type === 'function' && item.constant
        )
        callMethods.forEach(callMethod => {
          appMethods[callMethod.name] = (...params) => {
            const lastParam = params[params.length - 1]

            return typeof lastParam === 'object' && lastParam !== null
              ? from(
                  contract.methods[callMethod.name](
                    ...params.slice(0, -1)
                  ).call(lastParam)
                )
              : from(contract.methods[callMethod.name](...params).call())
          }
        })
        // Bind intents
        const intentMethods = forum.abi.filter(
          item => item.type === 'function' && !item.constant
        )
        intentMethods.forEach(intentMethod => {
          appMethods[intentMethod.name] = (...params) => {
            return from(
              new Promise((resolve, reject) => {
                wrapper
                  .getTransactionPath(
                    app.proxyAddress,
                    intentMethod.name,
                    params
                  )
                  .then(
                    result => {
                      resolve(wrapper.performTransactionPath(result))},
                    error => reject(error)
                  )
                  .catch(error => reject(error))
              })
            )
          }
        })
        setMethods(appMethods)
      }
    }, [app, methods])

    useEffect(() => {
      lookupState()
    }, [app, wrapper])

    const lookupState = useCallback(async () => {
      if (app) {
        const state = await wrapper.cache.get(getCacheKey(app.proxyAddress, 'state'))
        if (state) setAppState(state)
      }
    }, [app, setAppState, wrapper])

    //Wrapper doesn't change when the cache updates, so we set an interval to update app state
    setInterval(() => lookupState(), 10000)

    return (
      <AppStateContext.Provider
        value={{
          appState,
          methods,
          locator,
          onPathRequest,
        }}
      >
        {children}
      </AppStateContext.Provider>
    )
}
